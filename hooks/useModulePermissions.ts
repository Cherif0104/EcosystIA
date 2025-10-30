import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContextSupabase';
import { DataService } from '../services/dataService';
import { ModuleName, ModulePermission, Role, MANAGEMENT_ROLES } from '../types';

interface ModulePermissions {
  [key: string]: ModulePermission;
}

export const useModulePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<ModulePermissions>({});
  const [loading, setLoading] = useState(true);

  const loadPermissions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      // Charger d'abord les permissions par défaut
      let effective = getDefaultPermissions(user.role);
      // Puis surcharger avec les permissions Supabase si existantes
      // Utiliser profileId si disponible, sinon user.id (fallback pour compatibilité)
      const userIdToUse = (user as any).profileId || user.id;
      console.log('🔄 useModulePermissions - Loading permissions for userId:', userIdToUse, 'profileId:', (user as any).profileId);
      const { data, error } = await DataService.getUserModulePermissions(String(userIdToUse));
      if (!error && Array.isArray(data) && data.length > 0) {
        console.log('✅ useModulePermissions - Loaded', data.length, 'custom permissions from Supabase');
        data.forEach((row: any) => {
          const moduleName = row.module_name as ModuleName;
          effective[moduleName] = {
            canRead: !!row.can_read,
            canWrite: !!row.can_write,
            canDelete: !!row.can_delete,
            canApprove: !!row.can_approve
          } as ModulePermission;
        });
      } else {
        console.log('ℹ️ useModulePermissions - No custom permissions, using role defaults');
      }
      setPermissions(effective);
    } catch (e) {
      console.error('❌ useModulePermissions - Error loading permissions:', e);
      setPermissions(getDefaultPermissions(user.role));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPermissions();

    // Écouter les événements de rechargement des permissions
    window.addEventListener('permissions-reload', loadPermissions);

    return () => {
      window.removeEventListener('permissions-reload', loadPermissions);
    };
  }, [loadPermissions]);

  // Fonction pour vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (module: ModuleName, action: 'read' | 'write' | 'delete' | 'approve'): boolean => {
    if (!user) return false;
    
    // Tous les utilisateurs ont maintenant les mêmes droits par défaut
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
  const basePermissions: ModulePermissions = {};
  
  // Vérifier si l'utilisateur a accès au Management Panel
  const hasManagementAccess = MANAGEMENT_ROLES.includes(role as Role);
  
  // Dashboard (tous les utilisateurs y ont accès)
  basePermissions.dashboard = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  
  // Modules Workspace (tous les utilisateurs y ont accès)
  basePermissions.projects = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  basePermissions.goals_okrs = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  basePermissions.time_tracking = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  basePermissions.leave_management = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  basePermissions.finance = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  basePermissions.knowledge_base = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  
  // Modules Development (tous les utilisateurs y ont accès)
  basePermissions.courses = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  basePermissions.jobs = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  
  // Modules Tools (tous les utilisateurs y ont accès)
  basePermissions.ai_coach = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  basePermissions.gen_ai_lab = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  
  // CRM & Sales (tous les utilisateurs y ont accès)
  basePermissions.crm_sales = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  
  // Management Panel (SEULEMENT pour les rôles de gestion)
  if (hasManagementAccess) {
    basePermissions.analytics = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
    basePermissions.talent_analytics = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
    basePermissions.course_management = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
    basePermissions.job_management = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
    basePermissions.leave_management_admin = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
    basePermissions.user_management = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
  } else {
    // Rôles non-management n'ont PAS accès aux modules Management Panel
    basePermissions.analytics = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
    basePermissions.talent_analytics = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
    basePermissions.course_management = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
    basePermissions.job_management = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
    basePermissions.leave_management_admin = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
    basePermissions.user_management = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
  }
  
  // Settings (tous les utilisateurs y ont accès)
  basePermissions.settings = { canRead: true, canWrite: true, canDelete: true, canApprove: true };

  return basePermissions;
};
