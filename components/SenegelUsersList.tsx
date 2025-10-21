import React from 'react';
import { SenegelAuthService } from '../services/senegelAuthService';

const SenegelUsersList: React.FC = () => {
  const users = SenegelAuthService.getSenegelUsersList();

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
        <h3 className="text-lg font-semibold text-emerald-800 mb-2">
          👥 Utilisateurs SENEGEL Natifs
        </h3>
        <p className="text-sm text-emerald-700">
          Tous les utilisateurs ci-dessous peuvent se connecter avec le mot de passe universel : <strong>Senegel2024!</strong>
        </p>
      </div>

      <div className="grid gap-3">
        {users.map((user, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{user.fullName}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'super_administrator' ? 'bg-red-100 text-red-800' :
                    user.role === 'administrator' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'supervisor' ? 'bg-indigo-100 text-indigo-800' :
                    user.role === 'trainer' ? 'bg-green-100 text-green-800' :
                    user.role === 'coach' ? 'bg-yellow-100 text-yellow-800' :
                    user.role === 'facilitator' ? 'bg-pink-100 text-pink-800' :
                    user.role === 'editor' ? 'bg-orange-100 text-orange-800' :
                    user.role === 'producer' ? 'bg-teal-100 text-teal-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'super_administrator' ? 'Super Admin' :
                     user.role === 'administrator' ? 'Admin' :
                     user.role === 'manager' ? 'Manager' :
                     user.role === 'supervisor' ? 'Supervisor' :
                     user.role === 'trainer' ? 'Trainer' :
                     user.role === 'coach' ? 'Coach' :
                     user.role === 'facilitator' ? 'Facilitator' :
                     user.role === 'editor' ? 'Editor' :
                     user.role === 'producer' ? 'Producer' :
                     user.role}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  📧 {user.email}
                </p>
                <p className="text-sm text-gray-500">
                  📞 {user.phone}
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400 mb-1">
                  Mot de passe
                </div>
                <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                  Senegel2024!
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
        <h4 className="font-semibold text-blue-800 mb-2">💡 Instructions de connexion :</h4>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Sélectionnez n'importe quel email de la liste ci-dessus</li>
          <li>Utilisez le mot de passe universel : <strong>Senegel2024!</strong></li>
          <li>Cliquez sur "Connexion" pour accéder à EcosystIA</li>
        </ol>
      </div>
    </div>
  );
};

export default SenegelUsersList;