import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContextSupabase';
import { DataService } from '../services/dataService';
import { ModuleName, ModulePermission } from '../types';

interface ModulePermissions {
  [key: string]: ModulePermission;
}

export const useModulePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<ModulePermissions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Pour l'instant, utilisons uniquement les permissions par défaut basées sur le rôle
    // TODO: Implémenter le chargement des permissions personnalisées depuis Supabase
    setPermissions(getDefaultPermissions(user.role));
    setLoading(false);
  }, [user]);

  // Fonction pour vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (module: ModuleName, action: 'read' | 'write' | 'delete' | 'approve'): boolean => {
    if (!user) return false;
    
    // Super admin a tous les droits
    if (user.role === 'super_administrator') return true;
    
    const modulePermissions = permissions[module];
    if (!modulePermissions) return false;
    
    switch (action) {
      case 'read':
        return modulePermissions.canRead;
      case 'write':
        return modulePermissions.canWrite;
      case 'delete':
        return modulePermissions.canDelete;
      case 'approve':
        return modulePermissions.canApprove;
      default:
        return false;
    }
  };

  // Fonction pour vérifier si l'utilisateur peut accéder à un module (au minimum read)
  const canAccessModule = (module: ModuleName): boolean => {
    return hasPermission(module, 'read');
  };

  return {
    permissions,
    loading,
    hasPermission,
    canAccessModule
  };
};

// Permissions par défaut basées sur le rôle
const getDefaultPermissions = (role: string): ModulePermissions => {
  const basePermissions: ModulePermissions = {
    dashboard: { canRead: true, canWrite: false, canDelete: false, canApprove: false },
    projects: { canRead: true, canWrite: true, canDelete: false, canApprove: false },
    goals_okrs: { canRead: true, canWrite: true, canDelete: false, canApprove: false },
    time_tracking: { canRead: true, canWrite: true, canDelete: false, canApprove: false },
    leave_management: { canRead: true, canWrite: true, canDelete: false, canApprove: false },
    finance: { canRead: true, canWrite: true, canDelete: false, canApprove: false },
    knowledge_base: { canRead: true, canWrite: true, canDelete: false, canApprove: false },
    courses: { canRead: true, canWrite: false, canDelete: false, canApprove: false },
    jobs: { canRead: true, canWrite: false, canDelete: false, canApprove: false },
    ai_coach: { canRead: true, canWrite: false, canDelete: false, canApprove: false },
    gen_ai_lab: { canRead: true, canWrite: false, canDelete: false, canApprove: false },
    settings: { canRead: true, canWrite: true, canDelete: false, canApprove: false }
  };

  // Permissions pour les modules de gestion (seulement pour les rôles de gestion)
  const managementRoles = ['supervisor', 'manager', 'administrator', 'super_administrator'];
  if (managementRoles.includes(role)) {
    basePermissions.course_management = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
    basePermissions.job_management = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
    basePermissions.leave_management_admin = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
    basePermissions.user_management = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
    basePermissions.crm_sales = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
    basePermissions.analytics = { canRead: true, canWrite: false, canDelete: false, canApprove: false };
    basePermissions.talent_analytics = { canRead: true, canWrite: false, canDelete: false, canApprove: false };
  }

  // Super admin a tous les droits
  if (role === 'super_administrator') {
    Object.keys(basePermissions).forEach(module => {
      basePermissions[module] = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
    });
  }

  return basePermissions;
};
