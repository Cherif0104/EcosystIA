import { supabase } from './supabaseService';
import { User } from '../types';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  avatar_url?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Service d'authentification Supabase
export class AuthService {
  // Vérifier si un rôle management existe déjà
  static async checkRoleAvailability(role: string): Promise<{ available: boolean; error?: string }> {
    try {
      // Bloquer complètement super_administrator
      if (role === 'super_administrator') {
        return { 
          available: false, 
          error: 'Le rôle super_administrator ne peut pas être créé via l\'interface publique' 
        };
      }

      // Limiter les rôles management à un seul compte
      const restrictedRoles = ['administrator', 'manager', 'supervisor'];
      
      if (restrictedRoles.includes(role)) {
        const { data: existing, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('role', role)
          .limit(1);

        if (error) {
          console.error('Erreur vérification rôle:', error);
          return { available: true }; // En cas d'erreur, on autorise par sécurité
        }

        if (existing && existing.length > 0) {
          return { 
            available: false, 
            error: `Un compte avec le rôle "${role}" existe déjà. Ce rôle est limité à un seul compte.` 
          };
        }
      }

      // Les autres rôles sont autorisés sans restriction
      return { available: true };
    } catch (error) {
      console.error('Erreur vérification disponibilité rôle:', error);
      return { available: true }; // En cas d'erreur, on autorise par sécurité
    }
  }

  // Inscription
  static async signUp(data: SignUpData) {
    try {
      // Vérifier la disponibilité du rôle avant l'inscription
      const roleCheck = await this.checkRoleAvailability(data.role || 'student');
      
      if (!roleCheck.available) {
        const error = new Error(roleCheck.error || 'Rôle non disponible');
        return { user: null, error };
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          email_redirect_to: undefined, // Pas de redirection email
          data: {
            full_name: data.full_name,
            phone_number: data.phone_number,
            role: data.role || 'student'
          }
        },
        // Confirmer automatiquement l'email pour le développement
        // En production, vous devriez activer la confirmation par email
      });

      if (authError) throw authError;

      if (authData.user) {
        // Déterminer l'organization_id selon le rôle
        const internalRoles = ['super_administrator', 'administrator', 'manager', 'supervisor', 'intern'];
        let organizationId: string | null = null;
        
        if (internalRoles.includes(data.role || 'student')) {
          organizationId = '550e8400-e29b-41d4-a716-446655440000';  // SENEGEL
        } else if (data.role === 'student') {
          organizationId = '11111111-1111-1111-1111-111111111111';  // STUDENTS
        }
        // null pour les autres utilisateurs externes (isolation totale)
        
        // Créer le profil utilisateur
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            email: data.email,
            full_name: data.full_name,
            phone_number: data.phone_number,
            role: data.role || 'student',
            organization_id: organizationId
          });

        if (profileError) {
          console.error('Erreur création profil:', profileError);
          // Ne pas faire échouer l'inscription pour cette erreur
        }
      }

      return { user: authData.user, error: null };
    } catch (error) {
      console.error('Erreur inscription:', error);
      return { user: null, error };
    }
  }

  // Connexion - Utilise uniquement Supabase Auth
  static async signIn(data: SignInData) {
    try {
      console.log('🔍 AuthService.signIn appelé avec:', { email: data.email, password: '***' });
      
      // Authentification Supabase uniquement
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (authError) {
        console.error('❌ Erreur Supabase Auth:', authError);
        return { user: null, error: authError };
      }

      if (!authData.user) {
        console.log('❌ Aucun utilisateur retourné par Supabase');
        return { user: null, error: 'Aucun utilisateur trouvé' };
      }

      console.log('👤 Utilisateur Supabase trouvé:', authData.user.id);
      
      // Récupérer le profil utilisateur depuis la table profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError) {
        console.error('❌ Erreur récupération profil:', profileError);
        // Si le profil n'existe pas, créer un profil basique depuis les metadata
        if (profileError.code === 'PGRST116') {
          console.log('⚠️ Profil non trouvé, création depuis metadata...');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              user_id: authData.user.id,
              email: authData.user.email || '',
              full_name: authData.user.user_metadata?.full_name || authData.user.email || '',
              role: authData.user.user_metadata?.role || 'student',
              phone_number: authData.user.user_metadata?.phone_number || null,
              is_active: true
            })
            .select()
            .single();

          if (createError) {
            console.error('❌ Erreur création profil:', createError);
            return { user: null, error: createError };
          }

          // Mettre à jour la dernière connexion
          await supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('user_id', authData.user.id);

          console.log('✅ Profil créé et authentification réussie !');
          return { 
            user: {
              id: authData.user.id,
              email: newProfile.email,
              full_name: newProfile.full_name,
              role: newProfile.role,
              avatar_url: newProfile.avatar_url || ''
            }, 
            error: null 
          };
        }
        return { user: null, error: profileError };
      }

      // Mettre à jour la dernière connexion
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('user_id', authData.user.id);

      console.log('✅ Authentification Supabase réussie !');
      return { 
        user: {
          id: authData.user.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          avatar_url: profile.avatar_url || ''
        }, 
        error: null 
      };
    } catch (error) {
      console.error('💥 Erreur dans AuthService.signIn:', error);
      return { user: null, error };
    }
  }

  // Déconnexion
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      return { error };
    }
  }

  // Récupérer l'utilisateur actuel
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      if (!user) return { user: null, error: null };

      // Récupérer le profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        // Ne pas logger l'erreur si c'est juste un profil manquant
        if (profileError.code !== 'PGRST116') {
          console.error('Erreur récupération profil:', profileError);
        }
        return { user: null, error: profileError };
      }

      return {
        user: {
          id: user.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          avatar_url: profile.avatar_url
        },
        error: null
      };
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error);
      return { user: null, error };
    }
  }

  // Écouter les changements d'authentification
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Récupérer le profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          callback({
            id: session.user.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            avatar_url: profile.avatar_url
          });
        } else {
          callback(null);
        }
      } else {
        callback(null);
      }
    });
  }

  // Mettre à jour le profil
  static async updateProfile(userId: string, updates: Partial<AuthUser>) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      return { error };
    }
  }

  // Réinitialiser le mot de passe
  static async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      return { error };
    }
  }

  // Changer le mot de passe
  static async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
      return { error };
    }
  }
}

export default AuthService;
