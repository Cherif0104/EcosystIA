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
        
        // Vérifier aussi les sessions SENEGEL stockées dans localStorage
        const storedSenegelSession = localStorage.getItem('supabase.auth.token');
        let senegelSession = null;
        
        if (storedSenegelSession) {
          try {
            senegelSession = JSON.parse(storedSenegelSession);
            console.log('🇸🇳 Session SENEGEL trouvée dans localStorage:', senegelSession.user?.email);
          } catch (e) {
            console.error('Erreur parsing session SENEGEL:', e);
            localStorage.removeItem('supabase.auth.token');
          }
        }
        
        if (error) {
          console.error('Erreur récupération session:', error);
          setLoading(false);
          return;
        }

        if (session?.user || senegelSession?.user) {
          const currentUser = session?.user || senegelSession?.user;
          console.log('✅ Session persistée trouvée:', currentUser.email);
          console.log('🔍 Détails utilisateur:', {
            id: currentUser.id,
            email: currentUser.email,
            metadata: currentUser.user_metadata
          });
          
          // Pour les utilisateurs SENEGEL natifs, utiliser les données de session directement
          const userData: User = {
            id: currentUser.id,
            email: currentUser.email || '',
            fullName: currentUser.user_metadata?.full_name || currentUser.email || '',
            role: currentUser.user_metadata?.role || 'student',
            avatar: currentUser.user_metadata?.avatar_url || '',
            phoneNumber: currentUser.user_metadata?.phone_number || '',
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
          
          const profileData: AuthUser = {
            id: currentUser.id,
            email: currentUser.email || '',
            full_name: currentUser.user_metadata?.full_name || currentUser.email || '',
            role: currentUser.user_metadata?.role || 'student',
            avatar_url: currentUser.user_metadata?.avatar_url || '',
            phone_number: currentUser.user_metadata?.phone_number || ''
          };
          
          // Mettre à jour l'état de manière synchrone
          setUser(userData);
          setProfile(profileData);
          
          // Démarrer la surveillance d'inactivité
          authGuard.startInactivityMonitoring();
          
          console.log('✅ Utilisateur restauré depuis session persistée:', userData.email);
          console.log('🔍 État utilisateur mis à jour:', { user: userData, profile: profileData });
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
        // Convertir AuthUser en User pour la compatibilité
        const userData: User = {
          id: authUser.id,
          email: authUser.email,
          fullName: authUser.full_name,
          role: authUser.role as any,
          avatar: authUser.avatar_url || '',
          phoneNumber: '',
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
