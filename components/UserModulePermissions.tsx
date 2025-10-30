import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { useModulePermissions } from '../hooks/useModulePermissions';
import { User, ModuleName } from '../types';

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

const UserModulePermissions: React.FC<UserModulePermissionsProps> = ({ users }) => {
  const { t } = useLocalization();
  const { user: currentUser } = useAuth();
  const { hasPermission } = useModulePermissions();
  const [selectedUserId, setSelectedUserId] = useState<string | number>('');
  const [permissions, setPermissions] = useState<Record<ModuleName, {canRead: boolean, canWrite: boolean, canDelete: boolean, canApprove: boolean}>>({} as any);

  const selectedUser = users.find(u => u.id === selectedUserId);

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

  const handleUserSelect = async (userId: string | number) => {
    setSelectedUserId(userId);
    
    // TODO: Charger les permissions depuis Supabase
    // Pour l'instant, initialiser avec valeurs par défaut basées sur le rôle
    const selectedUser = users.find(u => u.id === userId);
    
    if (!selectedUser) {
      const defaultPermissions: Record<ModuleName, any> = {} as any;
      Object.keys(moduleDisplayNames).forEach(moduleName => {
        defaultPermissions[moduleName as ModuleName] = {
          canRead: false,
          canWrite: false,
          canDelete: false,
          canApprove: false
        };
      });
      setPermissions(defaultPermissions);
      return;
    }
    
    // Initialiser les permissions selon le rôle de l'utilisateur
    const defaultPermissions: Record<ModuleName, any> = {} as any;
    Object.keys(moduleDisplayNames).forEach(moduleName => {
      const module = moduleName as ModuleName;
      const isUserAdmin = selectedUser.role === 'administrator' || selectedUser.role === 'super_administrator' || selectedUser.role === 'manager';
      
      // Permissions par défaut selon le rôle
      if (['dashboard', 'projects', 'goals_okrs', 'time_tracking', 'leave_management', 'finance', 'knowledge_base', 'courses', 'jobs', 'ai_coach', 'gen_ai_lab', 'settings'].includes(moduleName)) {
        // Tous les utilisateurs ont accès à ces modules par défaut
        defaultPermissions[module] = {
          canRead: true,
          canWrite: true,
          canDelete: false,
          canApprove: false
        };
      } else if (['crm_sales', 'analytics', 'talent_analytics', 'user_management', 'course_management', 'job_management', 'leave_management_admin'].includes(moduleName)) {
        // Seulement pour les admins/manager
        defaultPermissions[module] = {
          canRead: isUserAdmin,
          canWrite: isUserAdmin,
          canDelete: isUserAdmin,
          canApprove: isUserAdmin
        };
      } else {
        defaultPermissions[module] = {
          canRead: false,
          canWrite: false,
          canDelete: false,
          canApprove: false
        };
      }
    });
    
    setPermissions(defaultPermissions);
  };

  const handlePermissionChange = (moduleName: ModuleName, permission: 'canRead' | 'canWrite' | 'canDelete' | 'canApprove', value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [moduleName]: {
        ...prev[moduleName],
        [permission]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    
    try {
      // TODO: Sauvegarder les permissions dans Supabase
      console.log('💾 Sauvegarde des permissions pour:', selectedUser.name, permissions);
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
      {/* Sélection de l'utilisateur */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sélectionner un utilisateur</h3>
        <select
          value={selectedUserId}
          onChange={(e) => handleUserSelect(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">-- Choisir un utilisateur --</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email}) - {t(user.role)}
            </option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <>
          {/* En-tête avec informations utilisateur */}
          <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg shadow-sm border border-emerald-200 p-6">
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
          </div>

          {/* Permissions par module */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Permissions par Module</h3>
            <p className="text-sm text-gray-600 mb-6">
              <i className="fas fa-info-circle mr-2 text-emerald-600"></i>
              Les permissions supérieures nécessitent d'activer d'abord les permissions de base (Lecture → Écriture → Suppression/Approbation)
            </p>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(moduleDisplayNames).map(([moduleName, displayName]) => {
                const module = moduleName as ModuleName;
                const modulePerms = permissions[module] || { canRead: false, canWrite: false, canDelete: false, canApprove: false };
                
                return (
                  <div key={moduleName} className="border border-gray-200 rounded-lg p-5 hover:border-emerald-300 transition-colors bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-800 text-lg">{displayName}</h4>
                        <span className="text-xs text-gray-500 uppercase font-mono">{moduleName}</span>
                      </div>
                      {!modulePerms.canRead && (
                        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          <i className="fas fa-lock mr-1"></i>
                          Module désactivé
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                      {/* 📖 Lecture - L'accès au module */}
                      <Toggle
                        label="📖 Lecture"
                        checked={modulePerms.canRead}
                        onChange={(value) => {
                          handlePermissionChange(module, 'canRead', value);
                          // Si on désactive la lecture, on désactive aussi les autres permissions
                          if (!value) {
                            handlePermissionChange(module, 'canWrite', false);
                            handlePermissionChange(module, 'canDelete', false);
                            handlePermissionChange(module, 'canApprove', false);
                          }
                        }}
                      />
                      
                      {/* ✏️ Écriture - Nécessite Lecture */}
                      <Toggle
                        label="✏️ Écriture"
                        checked={modulePerms.canWrite}
                        onChange={(value) => handlePermissionChange(module, 'canWrite', value)}
                        disabled={!modulePerms.canRead}
                      />
                      
                      {/* 🗑️ Suppression - Nécessite Lecture */}
                      <Toggle
                        label="🗑️ Suppression"
                        checked={modulePerms.canDelete}
                        onChange={(value) => handlePermissionChange(module, 'canDelete', value)}
                        disabled={!modulePerms.canRead}
                      />
                      
                      {/* ✅ Approbation - Nécessite Lecture */}
                      <Toggle
                        label="✅ Approbation"
                        checked={modulePerms.canApprove}
                        onChange={(value) => handlePermissionChange(module, 'canApprove', value)}
                        disabled={!modulePerms.canRead}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setSelectedUserId('')}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md"
            >
              <i className="fas fa-save mr-2"></i>
              Sauvegarder les Permissions
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

