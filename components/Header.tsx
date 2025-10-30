import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContextSupabase';
import { useLocalization } from '../contexts/LocalizationContext';
import { Language, AppNotification } from '../types';
import NexusFlowIcon from './icons/NexusFlowIcon';

interface HeaderProps {
  toggleSidebar: () => void;
  setView: (view: string) => void;
  notifications: AppNotification[];
  onMarkNotificationAsRead: (id: string) => void;
  onClearAllNotifications: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar, setView, notifications, onMarkNotificationAsRead, onClearAllNotifications }) => {
  const { user, signOut } = useAuth();
  const { language, setLanguage, t } = useLocalization();
  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isLangOpen, setLangOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);

  const handleNavigate = (view: string) => {
    setView(view);
    setProfileOpen(false);
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-white shadow-md sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side: Hamburger and Logo */}
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="text-gray-500 lg:hidden mr-4 focus:outline-none">
                <i className="fas fa-bars fa-lg"></i>
            </button>
             <div className="flex-shrink-0 flex items-center space-x-2">
                <NexusFlowIcon className="h-8 w-auto" />
                <span className="font-bold text-lg text-gray-800 hidden sm:block">{t('senegel_workflow_platform')}</span>
            </div>
          </div>
          
          {/* Right side: Language and Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setNotificationsOpen(!isNotificationsOpen)} className="text-gray-600 hover:text-emerald-600 relative">
                <i className="fas fa-bell fa-lg"></i>
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50">
                  <div className="p-3 border-b flex justify-between items-center">
                    <h3 className="font-semibold text-sm">{t('notifications')}</h3>
                    <button onClick={onClearAllNotifications} className="text-xs text-blue-600 hover:underline">{t('clear_all')}</button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 text-sm text-gray-700 flex items-start space-x-3 hover:bg-gray-100 ${!n.isRead ? 'bg-blue-50' : ''}`}>
                          <i className={`fas ${n.entityType === 'invoice' ? 'fa-file-invoice-dollar' : 'fa-money-bill-wave'} text-emerald-500 mt-1`}></i>
                          <div className="flex-grow">
                            <p>{n.message}</p>
                            <span className="text-xs text-gray-400">{new Date(n.date).toLocaleDateString()}</span>
                          </div>
                          {!n.isRead && (
                            <button onClick={() => onMarkNotificationAsRead(n.id)} title={t('mark_as_read')} className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                              <i className="far fa-circle text-blue-500 hover:fa-check-circle"></i>
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                       <p className="text-center text-gray-500 text-sm py-4">{t('no_notifications')}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Language Switcher */}
            <div className="relative">
              <button onClick={() => setLangOpen(!isLangOpen)} className="flex items-center text-gray-600 hover:text-emerald-600">
                <i className="fas fa-globe mr-1"></i>
                <span className="hidden sm:inline">{language.toUpperCase()}</span>
                <i className="fas fa-chevron-down text-xs ml-1"></i>
              </button>
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-md shadow-lg py-1">
                  <button onClick={() => { setLanguage(Language.EN); setLangOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('english')}</button>
                  <button onClick={() => { setLanguage(Language.FR); setLangOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('french')}</button>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button onClick={() => setProfileOpen(!isProfileOpen)} className="flex items-center space-x-2">
                {user?.avatar && !user.avatar.startsWith('data:image') ? (
                  <img 
                    className="h-8 w-8 rounded-full border-2 border-emerald-500 object-cover" 
                    src={user.avatar} 
                    alt={user?.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div 
                  className={`h-8 w-8 rounded-full border-2 border-emerald-500 bg-gradient-to-br from-emerald-500 via-green-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold ${user?.avatar && !user.avatar.startsWith('data:image') ? 'hidden' : ''}`}
                >
                  {user ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">{user?.name}</span>
              </button>
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1">
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('settings'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('profile')}</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate('settings'); }} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('settings')}</a>
                  <button onClick={() => signOut()} className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">{t('logout')}</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;