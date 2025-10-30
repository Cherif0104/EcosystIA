import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContextSupabase';
import { useLocalization } from '../contexts/LocalizationContext';
import NexusFlowIcon from './icons/NexusFlowIcon';
import { Role } from '../types';
import AuthAIAssistant from './AuthAIAssistant';
import { AuthService } from '../services/authService';

const PasswordStrengthMeter: React.FC<{ password?: string }> = ({ password = '' }) => {
    const { t } = useLocalization();

    const calculateStrength = () => {
        let score = 0;
        if (password.length > 7) score++;
        if (password.length > 10) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        return Math.floor(score / 1.25); // Scale score to 0-4
    };

    const strength = calculateStrength();
    const strengthLabels = [t('strength_weak'), t('strength_weak'), t('strength_medium'), t('strength_strong'), t('strength_very_strong')];
    const strengthColors = ['bg-red-500', 'bg-red-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-600'];

    return (
        <div>
            <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-medium text-gray-600">{t('password_strength')}</span>
                <span className={`font-semibold ${strength > 1 ? 'text-gray-800' : 'text-gray-500'}`}>{strengthLabels[strength]}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                    className={`h-1.5 rounded-full ${strengthColors[strength]} transition-all duration-300`} 
                    style={{ width: `${(strength / 4) * 100}%`}}
                ></div>
            </div>
        </div>
    );
};

interface SignupProps {
  onSwitchToLogin: () => void;
  onSignupSuccess?: () => void;
}

const Signup: React.FC<SignupProps> = ({ onSwitchToLogin, onSignupSuccess }) => {
  const { t } = useLocalization();
  const { signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAssistantOpen, setAssistantOpen] = useState(false);
  const [assistantInitialPrompt, setAssistantInitialPrompt] = useState('');
  const [roleAvailability, setRoleAvailability] = useState<Record<string, { available: boolean; reason?: string }>>({});
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Charger la disponibilité des rôles au montage
  useEffect(() => {
    const loadRoleAvailability = async () => {
      try {
        setLoadingRoles(true);
        // Tous les rôles sont maintenant disponibles
        const allRoles: Role[] = ['administrator', 'manager', 'supervisor', 'intern'];
        const availability: Record<string, { available: boolean; reason?: string }> = {};

        // Vérifier chaque rôle
        for (const role of allRoles) {
          const check = await AuthService.checkRoleAvailability(role);
          availability[role] = check;
        }

        // super_administrator est toujours bloqué
        availability['super_administrator'] = { 
          available: false, 
          reason: 'Réservé aux admins système' 
        };

        setRoleAvailability(availability);
      } catch (error) {
        console.error('Erreur chargement disponibilité rôles:', error);
      } finally {
        setLoadingRoles(false);
      }
    };

    loadRoleAvailability();
  }, []);

  const isRoleAvailable = (roleValue: string): boolean => {
    return roleAvailability[roleValue]?.available !== false;
  };

  const getRoleReason = (roleValue: string): string | undefined => {
    return roleAvailability[roleValue]?.reason;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError(t('passwords_do_not_match'));
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    // Vérifier que le rôle est disponible
    if (!isRoleAvailable(role)) {
      setError(getRoleReason(role) || `Le rôle "${role}" n'est pas disponible. Un compte avec ce rôle existe déjà.`);
      return;
    }

    setLoading(true);
    setError('');

    const result = await signUp(email, password, name, phone, role);
    
    if (!result.success) {
      const errorMessage = result.error?.message || 'Erreur lors de l\'inscription';
      
      // Messages d'erreur plus clairs
      if (errorMessage.includes('Email address') && errorMessage.includes('invalid')) {
        setError('Email invalide. Veuillez utiliser un email valide (ex: votrenom@gmail.com, votrenom@outlook.com). Certains domaines sont bloqués par Supabase.');
      } else if (errorMessage.includes('already registered')) {
        setError('Cet email est déjà utilisé. Utilisez un autre email ou connectez-vous.');
      } else {
        setError(errorMessage);
      }
    } else {
      // Inscription réussie
      if (onSignupSuccess) {
        onSignupSuccess();
      }
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
          <div className="md:w-1/2 bg-gradient-to-br from-emerald-600 to-blue-600 text-white p-12 flex flex-col justify-center items-center text-center">
            <NexusFlowIcon className="w-28 h-28"/>
            <h1 className="text-3xl font-bold mt-4">SENEGEL</h1>
            <p className="mt-2 text-emerald-100 text-lg">Plateforme de Gestion et de Formation</p>
            <div className="mt-8 space-y-4 text-sm text-emerald-50">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <i className="fas fa-users text-2xl mb-2"></i>
                <h3 className="font-semibold mb-2">Écosystème Unique</h3>
                <p className="text-xs">Rejoignez une plateforme centralisée avec des rôles adaptés à vos besoins</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <i className="fas fa-shield-alt text-2xl mb-2"></i>
                <h3 className="font-semibold mb-2">Permissions Granulaires</h3>
                <p className="text-xs">Votre accès est personnalisé selon votre rôle</p>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="md:w-1/2 p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900">{t('signup_title')}</h2>
            <form className="mt-8 space-y-6" onSubmit={handleSignup}>
              {/* Bannière informative */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <i className="fas fa-info-circle text-emerald-600 text-xl mt-1"></i>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Plateforme Unifiée SENEGEL</h3>
                    <p className="text-xs text-gray-700">
                      Choisissez votre rôle parmi nos 30+ rôles spécialisés. Votre accès sera personnalisé selon votre profil.
                    </p>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  {t('full_name')}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="Votre nom complet"
                />
              </div>

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
                <p className="mt-1 text-xs text-gray-500">
                  ⚠️ Certains domaines peuvent être bloqués. Utilisez un email valide (Gmail, Outlook, etc.)
                </p>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  {t('phone_number')}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="+221 XX XXX XX XX"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  {t('user_role')}
                </label>
                <select
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md"
                >
                  <optgroup label="👨‍🎓 Académique">
                    <option value="student">{t('student')}</option>
                    <option value="learner">{t('learner')}</option>
                    <option value="alumni">{t('alumni')}</option>
                  </optgroup>
                  <optgroup label="🏢 Gestion">
                    <option value="intern">{t('intern')}</option>
                    <option value="supervisor">{t('supervisor')}</option>
                    <option value="manager">{t('manager')}</option>
                    <option value="administrator">{t('administrator')}</option>
                  </optgroup>
                  <optgroup label="🎓 Formation">
                    <option value="trainer">{t('trainer')}</option>
                    <option value="professor">{t('professor')}</option>
                    <option value="facilitator">{t('facilitator')}</option>
                    <option value="coach">{t('coach')}</option>
                    <option value="mentor">{t('mentor')}</option>
                  </optgroup>
                  <optgroup label="💼 Professionnel">
                    <option value="entrepreneur">{t('entrepreneur')}</option>
                    <option value="employer">{t('employer')}</option>
                    <option value="funder">{t('funder')}</option>
                    <option value="implementer">{t('implementer')}</option>
                  </optgroup>
                  <optgroup label="🎨 Créatif">
                    <option value="artist">{t('artist')}</option>
                    <option value="producer">{t('producer')}</option>
                    <option value="editor">{t('editor')}</option>
                    <option value="publisher">{t('publisher')}</option>
                  </optgroup>
                  <optgroup label="🤖 IA & Tech">
                    <option value="ai_coach">{t('ai_coach')}</option>
                    <option value="ai_developer">{t('ai_developer')}</option>
                    <option value="ai_analyst">{t('ai_analyst')}</option>
                  </optgroup>
                  <optgroup label="🤝 Partenaires">
                    <option value="partner">{t('partner')}</option>
                    <option value="supplier">{t('supplier')}</option>
                    <option value="service_provider">{t('service_provider')}</option>
                  </optgroup>
                </select>
                {role && ['intern', 'supervisor', 'manager', 'administrator'].includes(role) && (
                  <p className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
                    <i className="fas fa-shield-alt mr-2"></i>
                    <strong>Accès Management Panel</strong><br/>
                    Vous aurez accès aux modules de gestion et à toutes les données SENEGEL.
                  </p>
                )}
                {role && !['intern', 'supervisor', 'manager', 'administrator', 'super_administrator'].includes(role) && (
                  <p className="mt-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                    <i className="fas fa-user-check mr-2"></i>
                    <strong>Accès Standard</strong><br/>
                    Votre accès sera personnalisé selon les permissions de votre rôle.
                  </p>
                )}
                {role && !isRoleAvailable(role) && (
                  <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded">
                    ⚠️ {getRoleReason(role) || `Un compte avec le rôle "${role}" existe déjà. Ce rôle est limité à un seul compte.`}
                  </p>
                )}
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
                <PasswordStrengthMeter password={password} />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  {t('confirm_password')}
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Inscription...' : t('signup_button')}
                </button>
              </div>

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  {t('signup_prompt')}{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-emerald-600 hover:text-emerald-500 font-medium"
                  >
                    {t('login_prompt')}
                  </button>
                </span>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => openAssistant(t('auth_ai_prompt_roles'))}
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
    </>
  );
};

export default Signup;