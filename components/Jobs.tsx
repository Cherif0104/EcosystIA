import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Job, User } from '../types';

const CircularProgress: React.FC<{ score: number }> = ({ score }) => {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  // Clamp score to be between 0 and 100
  const clampedScore = Math.max(0, Math.min(score, 100));
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div className="relative w-16 h-16">
      <svg className="w-full h-full" viewBox="0 0 50 50">
        <circle
          className="text-gray-200"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="25"
          cy="25"
        />
        <circle
          className="text-emerald-500 transition-all duration-500 ease-in-out"
          strokeWidth="4"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="25"
          cy="25"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 25 25)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-emerald-600">
        {Math.round(score)}%
      </span>
    </div>
  );
};


const ApplicantsModal: React.FC<{ job: Job; onClose: () => void }> = ({ job, onClose }) => {
  const { t } = useLocalization();
  
  const calculateMatchScore = (applicantSkills: string[]) => {
    const jobSkills = new Set(job.requiredSkills.map(s => s.toLowerCase()));
    if (jobSkills.size === 0) return 100; // If no skills required, everyone is a match
    const applicantSkillSet = new Set(applicantSkills.map(s => s.toLowerCase()));
    let commonSkills = 0;
    for (const skill of applicantSkillSet) {
        if (jobSkills.has(skill)) {
            commonSkills++;
        }
    }
    return (commonSkills / jobSkills.size) * 100;
  };

  const sortedApplicants = [...job.applicants].sort((a, b) => calculateMatchScore(b.skills) - calculateMatchScore(a.skills));
  const jobSkillsLower = new Set(job.requiredSkills.map(s => s.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">{t('applicants')} for {job.title}</h2>
        </div>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {sortedApplicants.length > 0 ? (
            <ul className="space-y-4">
              {sortedApplicants.map((applicant, index) => {
                const score = calculateMatchScore(applicant.skills);
                const isTopCandidate = index === 0 && score >= 50;
                return (
                    <li key={applicant.id} className={`p-4 rounded-lg border flex items-center space-x-4 relative overflow-hidden transition-all ${isTopCandidate ? 'border-emerald-500 bg-emerald-50 shadow-md' : 'border-gray-200'}`}>
                        {isTopCandidate && (
                            <div className="absolute top-0 left-0">
                                <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-br-lg shadow">
                                    <i className="fas fa-star text-yellow-300"></i>
                                    <span>{t('top_candidate')}</span>
                                </div>
                            </div>
                        )}
                        <img src={applicant.avatar} alt={applicant.name} className="w-16 h-16 rounded-full"/>
                        <div className="flex-grow">
                            <p className="font-bold text-lg text-gray-800">{applicant.name}</p>
                            <p className="text-sm text-gray-500">{applicant.email}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {applicant.skills.map(skill => (
                                    <span key={skill} className={`text-xs px-2 py-1 rounded-full ${jobSkillsLower.has(skill.toLowerCase()) ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'bg-gray-100 text-gray-700'}`}>
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="text-center flex-shrink-0 flex flex-col items-center">
                           <CircularProgress score={score} />
                           <p className="text-xs text-gray-500 mt-1">{t('ai_smart_match')}</p>
                        </div>
                    </li>
                );
            })}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-8">{t('no_applicants')}</p>
          )}
        </div>
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">Close</button>
        </div>
      </div>
    </div>
  );
};


const JobRow: React.FC<{ job: Job, onApply: (jobId: number) => void, onShowApplicants: (job: Job) => void, currentUser: User }> = ({ job, onApply, onShowApplicants, currentUser }) => {
  const { t } = useLocalization();
  const hasApplied = job.applicants.some(app => app.id === currentUser.id);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
      <div className="flex-grow pr-4">
        <h3 className="font-bold text-emerald-700">{job.title}</h3>
        <p className="text-sm text-gray-600">{job.company}</p>
        <p className="text-sm text-gray-500 mt-2">{job.description}</p>
        <p className="text-xs text-gray-500 mt-2"><b>{t('required_skills')}:</b> {job.requiredSkills.join(', ')}</p>
      </div>
      <div className="text-sm text-gray-500 w-full sm:w-auto sm:text-right">
        <p><i className="fas fa-map-marker-alt mr-2 text-gray-400"></i>{job.location}</p>
        <p><i className="fas fa-briefcase mr-2 text-gray-400"></i>{job.type}</p>
        <p><i className="far fa-calendar-alt mr-2 text-gray-400"></i>{job.postedDate}</p>
      </div>
       <div className="w-full sm:w-auto mt-2 sm:mt-0 sm:ml-4 flex-shrink-0">
        {currentUser.role === 'employer' || currentUser.role === 'administrator' ? (
          <button onClick={() => onShowApplicants(job)} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
            {t('view_applicants')} ({job.applicants.length})
          </button>
        ) : (
          <button 
            onClick={() => onApply(job.id)} 
            disabled={hasApplied}
            className="w-full sm:w-auto bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors">
            {hasApplied ? t('applied') : t('apply_now')}
          </button>
        )}
      </div>
    </div>
  );
};

interface JobsProps {
    jobs: Job[];
    setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
    setView: (view: string) => void;
}

const Jobs: React.FC<JobsProps> = ({ jobs, setJobs, setView }) => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [modalJob, setModalJob] = useState<Job | null>(null);

  const handleApply = (jobId: number) => {
    if(!user) return;
    setJobs(prevJobs => prevJobs.map(job => 
        job.id === jobId && !job.applicants.some(app => app.id === user.id) 
        ? { ...job, applicants: [...job.applicants, user] }
        : job
    ));
  };

  const handleShowApplicants = (job: Job) => {
    setModalJob(job);
  };
  
  if (!user) return null;
  
  const isPrivilegedUser = user.role === 'employer' || user.role === 'administrator';

  return (
    <div>
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">{isPrivilegedUser ? t('my_job_postings') : t('job_openings')}</h1>
                <p className="mt-1 text-gray-600">{t('view_all_jobs')}</p>
            </div>
            {isPrivilegedUser && (
                 <button onClick={() => setView('create_job')} className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 flex items-center">
                    <i className="fas fa-plus mr-2"></i>
                    {t('create_new_job')}
                </button>
            )}
        </div>
      
      {jobs.length > 0 ? (
        <div className="mt-6 space-y-4">
            {jobs.map(job => (
            <JobRow key={job.id} job={job} onApply={handleApply} onShowApplicants={handleShowApplicants} currentUser={user} />
            ))}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white mt-8 rounded-lg shadow-md">
            <i className="fas fa-briefcase fa-4x text-gray-400"></i>
            <h3 className="mt-6 text-xl font-semibold text-gray-800">{t('no_jobs_found')}</h3>
            <p className="mt-2 text-gray-500">
                {isPrivilegedUser ? "Create a new job posting to attract talent." : "Please check back later for new opportunities."}
            </p>
        </div>
      )}

      {modalJob && <ApplicantsModal job={modalJob} onClose={() => setModalJob(null)} />}
    </div>
  );
};

export default Jobs;