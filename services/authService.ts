import { supabase } from './supabaseService';
import { User } from '../types';
import { SenegelAuthService } from './senegelAuthService';

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
  // Inscription
  static async signUp(data: SignUpData) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
            phone_number: data.phone_number,
            role: data.role || 'student'
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Créer le profil utilisateur
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user.id,
            email: data.email,
            full_name: data.full_name,
            phone_number: data.phone_number,
            role: data.role || 'student'
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

  // Connexion
  static async signIn(data: SignInData) {
    try {
      console.log('🔍 AuthService.signIn appelé avec:', { email: data.email, password: '***' });
      
      // D'abord, essayer avec les utilisateurs SENEGEL natifs
      console.log('🇸🇳 Tentative d\'authentification SENEGEL...');
      const senegelResult = await SenegelAuthService.signInSenegelUser(data.email, data.password);
      console.log('📊 Résultat SENEGEL:', senegelResult);
      
      if (senegelResult.user) {
        console.log('✅ Authentification SENEGEL réussie !');
        
        // Créer une session Supabase artificielle pour la persistance
        const mockSession = {
          user: {
            id: senegelResult.user.id,
            email: senegelResult.user.email,
            user_metadata: {
              full_name: senegelResult.user.full_name,
              role: senegelResult.user.role,
              phone_number: senegelResult.user.phone_number
            }
          },
          access_token: 'senegel-mock-token',
          refresh_token: 'senegel-mock-refresh-token',
          expires_in: 3600,
          token_type: 'bearer'
        };

        // Stocker la session dans localStorage pour la persistance
        localStorage.setItem('supabase.auth.token', JSON.stringify(mockSession));
        console.log('💾 Session SENEGEL stockée pour persistance');
        
        return senegelResult;
      }

      console.log('🔄 Tentative d\'authentification Supabase standard...');
      // Si ce n'est pas un utilisateur SENEGEL, essayer l'authentification Supabase normale
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (authError) {
        console.error('❌ Erreur Supabase Auth:', authError);
        throw authError;
      }

      if (authData.user) {
        console.log('👤 Utilisateur Supabase trouvé:', authData.user.id);
        // Récupérer le profil utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authData.user.id)
          .single();

        if (profileError) {
          // Ne pas logger l'erreur si c'est juste un profil manquant
          if (profileError.code !== 'PGRST116') {
            console.error('Erreur récupération profil:', profileError);
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
            avatar_url: profile.avatar_url
          }, 
          error: null 
        };
      }

      console.log('❌ Aucun utilisateur retourné par Supabase');
      return { user: null, error: 'Aucun utilisateur trouvé' };
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
