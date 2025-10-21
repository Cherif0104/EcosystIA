


import React from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import NexusFlowIcon from './icons/NexusFlowIcon';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Role } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  isOpen: boolean;
}

const NavLink: React.FC<{ icon: string; label: string; viewName: string; currentView: string; setView: (view: string) => void }> = 
  ({ icon, label, viewName, currentView, setView }) => {
  const isActive = currentView === viewName;
  const isSubActive = (viewName === 'projects' && currentView.startsWith('project')) ||
                      (viewName === 'courses' && (currentView.startsWith('course') || currentView === 'course_detail'));

  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); setView(viewName); }}
      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
        (isActive || isSubActive)
          ? 'bg-emerald-600 text-white shadow-lg'
          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <i className={`${icon} w-6 text-center`}></i>
      <span className="ml-3">{label}</span>
    </a>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, isOpen }) => {
  const { t } = useLocalization();
  const { user } = useAuth();

  const managementRoles: Role[] = ['supervisor', 'manager', 'administrator', 'super_administrator'];
  const canManage = user && managementRoles.includes(user.role);
  const canAdmin = user?.role === 'super_administrator';

  const workspaceItems = [
    { icon: 'fas fa-th-large', label: t('dashboard'), view: 'dashboard' },
    { icon: 'fas fa-project-diagram', label: t('projects'), view: 'projects' },
    { icon: 'fas fa-bullseye', label: t('goals_okrs'), view: 'goals_okrs' },
    { icon: 'fas fa-clock', label: t('time_tracking'), view: 'time_tracking'},
    { icon: 'fas fa-calendar-alt', label: t('leave_management'), view: 'leave_management'},
    { icon: 'fas fa-file-invoice-dollar', label: t('finance'), view: 'finance'},
    { icon: 'fas fa-database', label: t('knowledge_base'), view: 'knowledge_base' },
  ];

  const developmentItems = [
     { icon: 'fas fa-book-open', label: t('courses'), view: 'courses' },
     { icon: 'fas fa-briefcase', label: t('jobs'), view: 'jobs' },
  ];
  
  const toolsItems = [
    { icon: 'fas fa-robot', label: t('ai_coach'), view: 'ai_coach' },
    { icon: 'fas fa-flask', label: t('gen_ai_lab'), view: 'gen_ai_lab' },
  ]
  
  const adminNavItems = [
    { icon: 'fas fa-users', label: t('crm_sales'), view: 'crm_sales', condition: canManage },
    { icon: 'fas fa-chalkboard-teacher', label: t('course_management'), view: 'course_management', condition: canManage },
    { icon: 'fas fa-chart-pie', label: t('analytics'), view: 'analytics', condition: canAdmin },
    { icon: 'fas fa-user-cog', label: t('user_management'), view: 'user_management', condition: canAdmin },
  ];

  const settingsItem = { icon: 'fas fa-cog', label: t('settings'), view: 'settings' };
  
  return (
    <aside className={`fixed lg:relative inset-y-0 left-0 bg-gray-800 text-white w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 ease-in-out z-50 flex flex-col`}>
      <div className="flex items-center justify-center h-20 border-b border-gray-700 px-4">
        <NexusFlowIcon className="h-10 w-auto" />
        <h1 className="text-xl font-bold ml-2">{t('senegel_workflow_platform')}</h1>
      </div>
      <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto">
        <p className="px-4 pt-4 pb-2 text-xs uppercase text-gray-400">Workspace</p>
        {workspaceItems.map(item => (
          <NavLink key={item.view} icon={item.icon} label={item.label} viewName={item.view} currentView={currentView} setView={setView} />
        ))}

        <p className="px-4 pt-4 pb-2 text-xs uppercase text-gray-400">Development</p>
        {developmentItems.map(item => (
            <NavLink key={item.view} icon={item.icon} label={item.label} viewName={item.view} currentView={currentView} setView={setView} />
        ))}
        
        <p className="px-4 pt-4 pb-2 text-xs uppercase text-gray-400">Tools</p>
         {toolsItems.map(item => (
            <NavLink key={item.view} icon={item.icon} label={item.label} viewName={item.view} currentView={currentView} setView={setView} />
        ))}

        {canManage && (
             <>
                <p className="px-4 pt-4 pb-2 text-xs uppercase text-gray-400">Management Panel</p>
                {adminNavItems.filter(item => item.condition).map(item => (
                    <NavLink key={item.view} icon={item.icon} label={item.label} viewName={item.view} currentView={currentView} setView={setView} />
                ))}
            </>
        )}
      </nav>
      
      <div className="px-4 pb-6 border-t border-gray-700 pt-4">
         <NavLink key={settingsItem.view} icon={settingsItem.icon} label={settingsItem.label} viewName={settingsItem.view} currentView={currentView} setView={setView} />
      </div>

    </aside>
  );
};

export default Sidebar;
