import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { AuthService, AuthUser } from '../services/authService';
import { User } from '../types';
import { authGuard } from '../middleware/authGuard';
import { supabase } from '../services/supabaseService';

interface AuthContextType {
  user: User | null;
  profile: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  signUp: (email: string, password: string, fullName: string, phoneNumber?: string, role?: string) => Promise<{ success: boolean; error?: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => Promise<{ success: boolean; error?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Vérifier la session au chargement avec persistance
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // Vérifier la session Supabase persistée
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur récupération session:', error);
          setLoading(false);
          return;
        }

        if (session?.user) {
          console.log('✅ Session persistée trouvée:', session.user.email);
          
          // Récupérer le profil depuis la table profiles
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

          if (profileError) {
            console.error('❌ Erreur récupération profil:', profileError);
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }

          // Construire les données utilisateur depuis le profil Supabase
          const userData: User = {
            id: session.user.id, // UUID de auth.users.id
            profileId: profile.id, // UUID de profiles.id (utilisé pour TimeLog.userId)
            email: profile.email,
            name: profile.full_name, // Pour compatibilité avec l'ancien code
            fullName: profile.full_name,
            role: profile.role as any,
            avatar: profile.avatar_url || '',
            phone: profile.phone_number || '',
            phoneNumber: profile.phone_number || '',
            skills: profile.skills || [],
            bio: profile.bio || '',
            location: profile.location || '',
            website: profile.website || '',
            linkedinUrl: profile.linkedin_url || '',
            githubUrl: profile.github_url || '',
            isActive: profile.is_active ?? true,
            lastLogin: profile.last_login || new Date().toISOString(),
            createdAt: profile.created_at || new Date().toISOString(),
            updatedAt: profile.updated_at || new Date().toISOString()
          };
          
          const profileData: AuthUser = {
            id: session.user.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            avatar_url: profile.avatar_url || '',
            phone_number: profile.phone_number || ''
          };
          
          // Mettre à jour l'état de manière synchrone
          setUser(userData);
          setProfile(profileData);
          
          // Démarrer la surveillance d'inactivité
          authGuard.startInactivityMonitoring();
          
          console.log('✅ Utilisateur restauré depuis session persistée:', userData.email);
        } else {
          console.log('ℹ️ Aucune session persistée trouvée');
          // S'assurer que l'état est bien null
          setUser(null);
          setProfile(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur initialisation auth:', error);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { user: authUser, error } = await AuthService.signIn({ email, password });
      
      if (error) {
        setLoading(false);
        return { success: false, error };
      }

      if (authUser) {
        // Récupérer le profil complet pour obtenir profileId
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', authUser.id)
          .single();

        // Convertir AuthUser en User pour la compatibilité
        const userData: User = {
          id: authUser.id,
          profileId: profile?.id, // UUID du profil si disponible
          email: authUser.email,
          name: authUser.full_name, // Pour compatibilité avec l'ancien code
          fullName: authUser.full_name,
          role: authUser.role as any,
          avatar: authUser.avatar_url || '',
          phone: authUser.phone_number || '',
          phoneNumber: authUser.phone_number || '',
          skills: [],
          bio: '',
          location: '',
          website: '',
          linkedinUrl: '',
          githubUrl: '',
          isActive: true,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setUser(userData);
        setProfile(authUser);
        
        // Démarrer la surveillance d'inactivité
        authGuard.startInactivityMonitoring();
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Aucun utilisateur retourné' };
    } catch (error) {
      setLoading(false);
      return { success: false, error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phoneNumber?: string, role?: string) => {
    try {
      setLoading(true);
      const { user: authUser, error } = await AuthService.signUp({
        email,
        password,
        full_name: fullName,
        phone_number: phoneNumber,
        role: role || 'student'
      });
      
      if (error) {
        setLoading(false);
        return { success: false, error };
      }

      if (authUser) {
        // Convertir AuthUser en User pour la compatibilité
        const userData: User = {
          id: authUser.id,
          email: authUser.email,
          fullName: authUser.full_name,
          role: authUser.role as any,
          avatar: authUser.avatar_url || '',
          phoneNumber: phoneNumber || '',
          skills: [],
          bio: '',
          location: '',
          website: '',
          linkedinUrl: '',
          githubUrl: '',
          isActive: true,
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setUser(userData);
        setProfile(authUser);
        
        // Démarrer la surveillance d'inactivité
        authGuard.startInactivityMonitoring();
        setLoading(false);
        return { success: true };
      }

      setLoading(false);
      return { success: false, error: 'Aucun utilisateur retourné' };
    } catch (error) {
      setLoading(false);
      return { success: false, error };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Utiliser authGuard pour une déconnexion propre
      await authGuard.signOut();
      
      setUser(null);
      setProfile(null);
      setLoading(false);
      
      // Rediriger vers dashboard après déconnexion
      window.location.href = '/login';
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      if (!profile) {
        return { success: false, error: 'Aucun profil trouvé' };
      }

      const { error } = await AuthService.updateProfile(profile.id, updates);
      
      if (error) {
        return { success: false, error };
      }

      // Mettre à jour le profil local
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);

      // Mettre à jour l'utilisateur local
      const updatedUser: User = {
        ...user!,
        fullName: updatedProfile.full_name,
        avatar: updatedProfile.avatar_url || '',
        updatedAt: new Date().toISOString()
      };
      setUser(updatedUser);

      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
