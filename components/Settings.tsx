import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Language } from '../types';

interface SettingsProps {
  reminderDays: number;
  onSetReminderDays: (days: number) => void;
}

const Settings: React.FC<SettingsProps> = ({ reminderDays, onSetReminderDays }) => {
  const { t, language, setLanguage } = useLocalization();
  const { user } = useAuth();
  const [skills, setSkills] = useState(user?.skills || []);
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
      // In a real app, you would call an API to save this.
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">{t('settings_title')}</h1>
      
      <div className="mt-8 max-w-2xl space-y-8">
        {/* Profile Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">{t('profile')}</h2>
          <div className="flex items-center space-x-4">
            <img src={user?.avatar} alt={user?.name} className="w-20 h-20 rounded-full"/>
            <div>
              <p className="font-bold text-xl">{user?.name}</p>
              <p className="text-gray-500">{user?.email}</p>
              <p className="text-sm capitalize text-emerald-600 font-semibold mt-1">{t(user!.role)}</p>
            </div>
          </div>
        </div>

        {/* Skill Passport */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">{t('my_skills')}</h2>
          <p className="text-sm text-gray-500 mb-4">{t('skill_passport_subtitle')}</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map(skill => (
              <span key={skill} className="bg-emerald-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full flex items-center">
                {skill}
                <button onClick={() => handleRemoveSkill(skill)} className="ml-2 text-emerald-600 hover:text-emerald-800">
                  <i className="fas fa-times-circle text-xs"></i>
                </button>
              </span>
            ))}
          </div>
          <form onSubmit={handleAddSkill} className="flex gap-2">
            <input 
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder={t('enter_skill')}
              className="flex-grow p-2 border rounded-md"
            />
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-emerald-700 transition-colors">
              {t('add_skill')}
            </button>
          </form>
        </div>

        {/* Reminder Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">{t('reminder_settings')}</h2>
          <div className="flex items-center justify-between">
            <label htmlFor="reminder-days" className="text-sm text-gray-600">{t('remind_days_before')}:</label>
            <input
              id="reminder-days"
              type="number"
              value={reminderDays}
              onChange={(e) => onSetReminderDays(Math.max(0, Number(e.target.value)))}
              className="w-24 p-2 border rounded-md text-center"
              min="0"
            />
          </div>
        </div>
        
        {/* Language Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-3 mb-4">{t('language')}</h2>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setLanguage(Language.EN)}
              className={`px-4 py-2 rounded-md font-medium ${language === Language.EN ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {t('english')}
            </button>
            <button 
              onClick={() => setLanguage(Language.FR)}
              className={`px-4 py-2 rounded-md font-medium ${language === Language.FR ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              {t('french')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;