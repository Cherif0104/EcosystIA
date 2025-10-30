import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContextSupabase';
import { useLocalization } from '../contexts/LocalizationContext';
import NexusFlowIcon from './icons/NexusFlowIcon';
import AuthAIAssistant from './AuthAIAssistant';
import SenegelUsersList from './SenegelUsersList';

interface LoginProps {
  onSwitchToSignup: () => void;
  onLoginSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignup, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn } = useAuth();
  const { t } = useLocalization();
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState('');
  const [showUsersList, setShowUsersList] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 Tentative de connexion avec:', { email, password: '***' });
    setLoading(true);
    setError('');

    try {
      const result = await signIn(email, password);
      console.log('📋 Résultat de connexion:', result);
      
      if (!result.success) {
        const errorMessage = result.error?.message || 'Erreur de connexion';
        
        // Messages d'erreur plus clairs
        if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Invalid login')) {
          setError('Email ou mot de passe incorrect. Vérifiez vos identifiants ou créez un compte.');
        } else if (errorMessage.includes('Email not confirmed')) {
          setError('Votre email n\'a pas été confirmé. Vérifiez votre boîte de réception.');
        } else {
          setError(errorMessage);
        }
        
        console.error('❌ Erreur de connexion:', result.error);
      } else {
        console.log('✅ Connexion réussie !');
        // Appeler le callback de succès pour la redirection contrôlée
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (error) {
      console.error('💥 Erreur lors de la connexion:', error);
      setError('Erreur inattendue lors de la connexion');
    }
    
    setLoading(false);
  };

  const openAssistant = (prompt: string = '') => {
    setAssistantInitialPrompt(prompt);
    setAssistantOpen(true);
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden md:flex">
          {/* Left Panel */}
          <div className="md:w-1/2 bg-emerald-600 text-white p-12 flex flex-col justify-center items-center text-center">
            <NexusFlowIcon className="w-28 h-28"/>
            <h1 className="text-3xl font-bold mt-4">SENEGEL</h1>
            <p className="mt-2 text-emerald-100 text-lg">Plateforme de Gestion et de Formation</p>
            <div className="mt-8 space-y-4 text-sm text-emerald-50">
              <div className="bg-emerald-700/30 backdrop-blur-sm rounded-lg p-4 border border-emerald-400/30">
                <i className="fas fa-users text-2xl mb-2"></i>
                <h3 className="font-semibold mb-2">Équipe SENEGEL</h3>
                <p className="text-xs">Accès aux projets collaboratifs et données organisationnelles</p>
              </div>
              <div className="bg-emerald-700/30 backdrop-blur-sm rounded-lg p-4 border border-emerald-400/30">
                <i className="fas fa-user-circle text-2xl mb-2"></i>
                <h3 className="font-semibold mb-2">Comptes Indépendants</h3>
                <p className="text-xs">Vos propres projets et modules, isolation totale</p>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="md:w-1/2 p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900">{t('login_title')}</h2>
             <form className="mt-8 space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('email')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  {t('password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div className="text-right text-sm">
                <button
                  type="button"
                  onClick={() => openAssistant(t('auth_ai_prompt_password'))}
                  className="text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  {t('forgot_password')}
                </button>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Connexion...' : t('login')}
                </button>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  {t('login_prompt')}{' '}
                  <button
                    type="button"
                    onClick={onSwitchToSignup}
                    className="text-emerald-600 hover:text-emerald-500 font-medium"
                  >
                    {t('signup_prompt')}
                  </button>
                </span>
              </div>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setShowUsersList(!showUsersList)}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  👥 Voir les utilisateurs disponibles
                </button>
                <br/>
                <button
                  type="button"
                  onClick={() => openAssistant()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {t('need_help')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isAssistantOpen && (
        <AuthAIAssistant
          isOpen={isAssistantOpen}
          onClose={() => setAssistantOpen(false)}
          initialPrompt={assistantInitialPrompt}
        />
      )}

      {showUsersList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Utilisateurs SENEGEL</h2>
                <button
                  onClick={() => setShowUsersList(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <SenegelUsersList />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Login;