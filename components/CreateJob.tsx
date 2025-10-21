
import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Job } from '../types';

interface CreateJobProps {
  onAddJob: (job: Job) => void;
  onBack: () => void;
}

const CreateJob: React.FC<CreateJobProps> = ({ onAddJob, onBack }) => {
  const { t } = useLocalization();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<'Full-time' | 'Part-time' | 'Contract'>('Full-time');
  const [description, setDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company || !description) return;

    const newJob: Job = {
      id: Date.now(),
      title,
      company,
      location,
      type,
      description,
      requiredSkills: requiredSkills.split(',').map(skill => skill.trim()).filter(Boolean),
      postedDate: 'Just now',
      applicants: []
    };
    onAddJob(newJob);
  };

  return (
    <div>
      <button onClick={onBack} className="flex items-center text-emerald-600 font-semibold mb-6 hover:text-emerald-800">
        <i className="fas fa-arrow-left mr-2"></i>
        {t('back_to_jobs')}
      </button>

      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('create_new_job')}</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="job-title" className="block text-sm font-medium text-gray-700">{t('job_title')}</label>
            <input type="text" id="job-title" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/>
          </div>
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">{t('company_name')}</label>
            <input type="text" id="company-name" value={company} onChange={e => setCompany(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/>
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">{t('job_location')}</label>
            <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} required className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/>
          </div>
          <div>
            <label htmlFor="job-type" className="block text-sm font-medium text-gray-700">{t('job_type')}</label>
            <select id="job-type" value={type} onChange={e => setType(e.target.value as any)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500">
              <option value="Full-time">{t('full_time')}</option>
              <option value="Part-time">{t('part_time')}</option>
              <option value="Contract">{t('contract')}</option>
            </select>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">{t('job_description')}</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} required rows={5} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"></textarea>
          </div>
          <div>
            <label htmlFor="required-skills" className="block text-sm font-medium text-gray-700">{t('required_skills')}</label>
            <input type="text" id="required-skills" value={requiredSkills} onChange={e => setRequiredSkills(e.target.value)} placeholder={t('required_skills_placeholder')} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500"/>
          </div>
          <div>
            <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500">
              {t('post_job')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;
