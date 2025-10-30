import React, { useState, useMemo } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { useModulePermissions } from '../hooks/useModulePermissions';
import { DataService } from '../services/dataService';
import { User, ModuleName, Role } from '../types';

interface UserModulePermissionsProps {
  users: User[];
}

const moduleDisplayNames: Record<ModuleName, string> = {
  'projects': 'Projets',
  'goals_okrs': 'Objectifs OKR',
  'time_tracking': 'Suivi du Temps',
  'leave_management': 'Demandes de Congés',
  'finance': 'Finance',
  'knowledge_base': 'Base de Connaissances',
  'courses': 'Cours',
  'jobs': 'Offres d\'Emploi',
  'ai_coach': 'Coach IA',
  'gen_ai_lab': 'Génération IA',
  'crm_sales': 'CRM & Ventes',
  'analytics': 'Analytics',
  'talent_analytics': 'Talent Analytics',
  'user_management': 'Gestion des Utilisateurs',
  'course_management': 'Gestion des Cours',
  'job_management': 'Gestion des Jobs',
  'leave_management_admin': 'Gestion des Demandes de Congés'
};

// Catégories de modules pour une meilleure organisation
const moduleCategories: Record<string, { label: string; icon: string; modules: ModuleName[] }> = {
  workspace: {
    label: 'Workspace',
    icon: 'fas fa-briefcase',
    modules: ['projects', 'goals_okrs', 'time_tracking', 'leave_management', 'finance', 'knowledge_base']
  },
  development: {
    label: 'Development',
    icon: 'fas fa-code',
    modules: ['courses', 'jobs']
  },
  tools: {
    label: 'Tools',
    icon: 'fas fa-tools',
    modules: ['ai_coach', 'gen_ai_lab']
  },
  management: {
    label: 'Management Panel',
    icon: 'fas fa-crown',
    modules: ['course_management', 'job_management', 'leave_management_admin', 'user_management', 'analytics', 'talent_analytics']
  },
  sales: {
    label: 'CRM & Sales',
    icon: 'fas fa-handshake',
    modules: ['crm_sales']
  }
};

const UserModulePermissions: React.FC<UserModulePermissionsProps> = ({ users }) => {
  const { t } = useLocalization();
  const { user: currentUser } = useAuth();
  const { hasPermission } = useModulePermissions();
  const [selectedUserId, setSelectedUserId] = useState<string | number>('');
  const [permissions, setPermissions] = useState<Record<ModuleName, {canRead: boolean, canWrite: boolean, canDelete: boolean, canApprove: boolean}>>({} as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | 'all'>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const selectedUser = users.find(u => u.id === selectedUserId);

  // Filtrer les utilisateurs selon la recherche et le rôle
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchQuery === '' ||
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Extraire les rôles uniques pour le filtre
  const uniqueRoles = useMemo(() => {
    const roles = new Set<Role>(users.map(u => u.role));
    return Array.from(roles).sort();
  }, [users]);

  // Toggle Component
  const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean; label: string }> = ({ checked, onChange, disabled = false, label }) => (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700 w-24">{label}</span>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
          checked ? 'bg-emerald-600' : 'bg-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  // Fonction pour obtenir les permissions par défaut basées sur le rôle
  const getDefaultPermissionsByRole = (role: string): Record<ModuleName, {canRead: boolean, canWrite: boolean, canDelete: boolean, canApprove: boolean}> => {
    const basePermissions: Record<ModuleName, any> = {} as any;
    
    // Tous les modules ont accès de base (lecture)
    Object.keys(moduleDisplayNames).forEach(moduleName => {
      basePermissions[moduleName as ModuleName] = {
        canRead: true,
        canWrite: true,
        canDelete: false,
        canApprove: false
      };
    });

    // Permissions spéciales pour les modules de gestion (uniquement pour les rôles internes)
    const managementRoles: Role[] = ['supervisor', 'manager', 'administrator', 'super_administrator'];
    if (managementRoles.includes(role as Role)) {
      basePermissions['course_management'] = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
      basePermissions['job_management'] = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
      basePermissions['leave_management_admin'] = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
      basePermissions['user_management'] = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
      basePermissions['crm_sales'] = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
      basePermissions['analytics'] = { canRead: true, canWrite: false, canDelete: false, canApprove: false };
      basePermissions['talent_analytics'] = { canRead: true, canWrite: false, canDelete: false, canApprove: false };
    } else {
      // Les utilisateurs externes n'ont pas accès aux modules de gestion
      basePermissions['course_management'] = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
      basePermissions['job_management'] = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
      basePermissions['leave_management_admin'] = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
      basePermissions['user_management'] = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
      basePermissions['crm_sales'] = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
      basePermissions['analytics'] = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
      basePermissions['talent_analytics'] = { canRead: false, canWrite: false, canDelete: false, canApprove: false };
    }

    // Super admin a tous les droits
    if (role === 'super_administrator') {
      Object.keys(basePermissions).forEach(module => {
        basePermissions[module as ModuleName] = { canRead: true, canWrite: true, canDelete: true, canApprove: true };
      });
    }

    return basePermissions;
  };

  const handleUserSelect = async (userId: string | number) => {
    setSelectedUserId(userId);
    
    // Charger les permissions depuis Supabase, fallback sur défauts
    const selectedUser = users.find(u => u.id === userId);
    
    if (!selectedUser) {
      // Si l'utilisateur n'est pas trouvé, utiliser des permissions vides
      const emptyPermissions: Record<ModuleName, any> = {} as any;
      Object.keys(moduleDisplayNames).forEach(moduleName => {
        emptyPermissions[moduleName as ModuleName] = {
          canRead: false,
          canWrite: false,
          canDelete: false,
          canApprove: false
        };
      });
      setPermissions(emptyPermissions);
      return;
    }
    
    // 1. Charger les permissions par défaut basées sur le rôle
    let effectivePermissions = getDefaultPermissionsByRole(selectedUser.role);
    console.log('📋 Permissions par défaut pour rôle', selectedUser.role, ':', effectivePermissions);

    try {
      // 2. Surcharger avec les permissions Supabase si elles existent
      if (selectedUser.profileId) {
        const { data } = await DataService.getUserModulePermissions(String(selectedUser.profileId));
        if (Array.isArray(data) && data.length > 0) {
          console.log('📋 Permissions Supabase trouvées:', data.length, 'modules');
          data.forEach((row: any) => {
            const m = row.module_name as ModuleName;
            effectivePermissions[m] = {
              canRead: !!row.can_read,
              canWrite: !!row.can_write,
              canDelete: !!row.can_delete,
              canApprove: !!row.can_approve
            };
          });
        } else {
          console.log('📋 Aucune permission personnalisée dans Supabase, utilisation des défauts du rôle');
        }
      }
    } catch (error) {
      console.error('Erreur chargement permissions Supabase:', error);
    }

    console.log('📋 Permissions finales chargées:', effectivePermissions);
    setPermissions(effectivePermissions);
  };

  const handlePermissionChange = async (moduleName: ModuleName, permission: 'canRead' | 'canWrite' | 'canDelete' | 'canApprove', value: boolean) => {
    // Mise à jour locale immédiate
    const updatedPermissions = {
      ...permissions,
      [moduleName]: {
        ...permissions[moduleName],
        [permission]: value
      }
    };
    setPermissions(updatedPermissions);

    // Debounce: Annuler le timeout précédent si existant
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Sauvegarde automatique dans Supabase avec debounce de 500ms
    if (selectedUser && selectedUser.profileId) {
      const timeout = setTimeout(async () => {
        setIsSaving(true);
        try {
          const payload = Object.entries(updatedPermissions).map(([modName, perms]) => ({
            moduleName: modName,
            canRead: perms.canRead,
            canWrite: perms.canWrite,
            canDelete: perms.canDelete,
            canApprove: perms.canApprove
          }));
          
          await DataService.upsertUserModulePermissions(String(selectedUser.profileId), payload);
        } catch (error) {
          console.error('❌ Erreur sauvegarde automatique:', error);
          // Rollback local en cas d'erreur
          setPermissions(permissions);
          alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
        } finally {
          setIsSaving(false);
        }
      }, 500);
      
      setSaveTimeout(timeout);
    }
  };

  const handleSave = async () => {
    if (!selectedUser || !selectedUser.profileId) return;
    
    try {
      const payload = Object.entries(permissions).map(([moduleName, perms]) => ({
        moduleName,
        canRead: perms.canRead,
        canWrite: perms.canWrite,
        canDelete: perms.canDelete,
        canApprove: perms.canApprove
      }));
      await DataService.upsertUserModulePermissions(String(selectedUser.profileId), payload);
      alert('Permissions sauvegardées avec succès !');
    } catch (error) {
      console.error('❌ Erreur sauvegarde permissions:', error);
      alert('Erreur lors de la sauvegarde des permissions');
    }
  };

  if (!currentUser || (currentUser.role !== 'administrator' && currentUser.role !== 'super_administrator')) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-md">
          <i className="fas fa-lock text-6xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès Refusé</h2>
          <p className="text-gray-600">Seuls les administrateurs peuvent gérer les permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg rounded-lg p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
            <i className="fas fa-shield-alt text-3xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Gestion des Permissions Module</h2>
            <p className="text-emerald-50 text-sm">
              Configurez les accès et permissions pour chaque utilisateur
            </p>
          </div>
        </div>
        <div className="bg-white bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
          <p className="text-sm flex items-start gap-2">
            <i className="fas fa-info-circle mt-1"></i>
            <span>Gérez les permissions granulaires par module : Lecture, Écriture, Suppression, Approbation</span>
          </p>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <i className="fas fa-user-check text-emerald-600"></i>
          Sélectionner un utilisateur
        </h3>
        
        {/* Recherche */}
        <div className="mb-4">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Filtre par rôle */}
        <div className="mb-4">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as Role | 'all')}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Tous les rôles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>
                {t(role)}
              </option>
            ))}
          </select>
        </div>

        {/* Liste des utilisateurs */}
        <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-users text-4xl mb-2"></i>
              <p>Aucun utilisateur trouvé</p>
            </div>
          ) : (
            filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedUserId === user.id
                    ? 'bg-emerald-50 border-emerald-500 shadow-md'
                    : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  {user.avatar && !user.avatar.startsWith('data:image') ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name || 'Utilisateur'} 
                      className="w-10 h-10 rounded-full object-cover" 
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{user.name || user.email}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {t(user.role)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedUser && (
        <>
          {/* En-tête avec informations utilisateur */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg shadow-sm border border-emerald-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar || undefined} alt={selectedUser.name} className="w-16 h-16 rounded-full border-4 border-white shadow-md" onError={(e) => { e.currentTarget.style.display = 'none'; }}/>
                ) : (
                  <div className="w-16 h-16 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedUser.name || selectedUser.fullName}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {t(selectedUser.role)}
                  </span>
                </div>
              </div>
              {isSaving && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                  <i className="fas fa-spinner fa-spin text-emerald-600"></i>
                  <span className="text-sm font-medium text-gray-700">Sauvegarde...</span>
                </div>
              )}
            </div>
          </div>

          {/* Permissions par module */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-list-check text-emerald-600"></i>
              Permissions par Module
            </h3>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
              <p className="text-sm text-gray-700 flex items-start gap-2">
                <i className="fas fa-info-circle text-blue-600 mt-1"></i>
                <span><strong>Info :</strong> Les modifications sont sauvegardées automatiquement après 0.5s d'inactivité</span>
              </p>
            </div>
            <div className="space-y-6 max-h-[600px] overflow-y-auto">
              {Object.entries(moduleCategories).map(([categoryKey, category]) => (
                <div key={categoryKey} className="space-y-3">
                  {/* Titre de catégorie */}
                  <div className="sticky top-0 bg-gray-100 z-10 py-2 px-4 rounded-lg border border-gray-300">
                    <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                      <i className={category.icon}></i>
                      {category.label}
                    </h4>
                  </div>
                  
                  {/* Modules de la catégorie */}
                  {category.modules.map(moduleName => {
                    const module = moduleName as ModuleName;
                    const displayName = moduleDisplayNames[module];
                    const modulePerms = permissions[module] || { canRead: false, canWrite: false, canDelete: false, canApprove: false };
                    
                    return (
                      <div key={moduleName} className={`border rounded-lg p-5 transition-all ${
                        modulePerms.canRead 
                          ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300' 
                          : 'border-gray-200 bg-gray-50'
                      }`}>
                    {/* En-tête du module avec toggle principal */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-lg">{displayName}</h4>
                        <span className="text-xs text-gray-500 uppercase font-mono">{moduleName}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          modulePerms.canRead 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <i className={`fas fa-${modulePerms.canRead ? 'check-circle' : 'lock'} mr-1`}></i>
                          {modulePerms.canRead ? 'Activé' : 'Désactivé'}
                        </span>
                        {/* Toggle principal pour activer/désactiver le module */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">Activer le module</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newValue = !modulePerms.canRead;
                              handlePermissionChange(module, 'canRead', newValue);
                              if (!newValue) {
                                handlePermissionChange(module, 'canWrite', false);
                                handlePermissionChange(module, 'canDelete', false);
                                handlePermissionChange(module, 'canApprove', false);
                              }
                            }}
                            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                              modulePerms.canRead ? 'bg-emerald-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                modulePerms.canRead ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Permissions CRUD sous le module */}
                    {modulePerms.canRead && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <i className="fas fa-key text-emerald-600"></i>
                          Permissions Fonctionnelles
                        </h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* ✏️ Écriture */}
                          <Toggle
                            label="✏️ Écriture"
                            checked={modulePerms.canWrite}
                            onChange={(value) => handlePermissionChange(module, 'canWrite', value)}
                          />
                          
                          {/* 🗑️ Suppression */}
                          <Toggle
                            label="🗑️ Suppression"
                            checked={modulePerms.canDelete}
                            onChange={(value) => handlePermissionChange(module, 'canDelete', value)}
                          />
                          
                          {/* ✅ Approbation */}
                          <Toggle
                            label="✅ Approbation"
                            checked={modulePerms.canApprove}
                            onChange={(value) => handlePermissionChange(module, 'canApprove', value)}
                          />
                        </div>
                      </div>
                    )}
                    
                    {!modulePerms.canRead && (
                      <div className="bg-gray-100 rounded-lg p-4 border border-gray-200 text-center">
                        <p className="text-sm text-gray-500 italic">
                          <i className="fas fa-info-circle mr-2"></i>
                          Activez le module pour configurer les permissions CRUD
                        </p>
                      </div>
                    )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Bouton d'annulation */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSelectedUserId('')}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-blue-700 transition-all shadow-lg transform hover:scale-105"
            >
              <i className="fas fa-check mr-2"></i>
              Fermer
            </button>
          </div>
        </>
      )}

      {!selectedUserId && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <i className="fas fa-hand-pointer text-6xl text-gray-300 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Sélectionnez un utilisateur</h3>
          <p className="text-gray-500">Choisissez un utilisateur dans la liste ci-dessus pour gérer ses permissions.</p>
        </div>
      )}
    </div>
  );
};

export default UserModulePermissions;

