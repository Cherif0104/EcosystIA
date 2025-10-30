import React, { useState, useMemo } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Job } from '../types';

interface JobManagementProps {
  jobs: Job[];
  onAddJob: (job: Job) => void;
  onUpdateJob: (job: Job) => void;
  onDeleteJob: (jobId: number) => void;
  onNavigate?: (view: string) => void;
}

const JobManagement: React.FC<JobManagementProps> = ({
  jobs,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  onNavigate
}) => {
  const { t } = useLocalization();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deletingJobId, setDeletingJobId] = useState<number | null>(null);

  if (!user) return null;

  const hasAccess = user.role === 'administrator' || user.role === 'super_administrator' || user.role === 'employer';

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-md">
          <i className="fas fa-lock text-6xl text-red-500 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Accès Refusé</h2>
          <p className="text-gray-600">Vous n'avez pas les permissions nécessaires pour accéder à ce module.</p>
        </div>
      </div>
    );
  }

  // Filtrer les jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = searchQuery === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchesType = typeFilter === 'all' || job.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [jobs, searchQuery, statusFilter, typeFilter]);

  // Extraire tous les types uniques
  const jobTypes = [...new Set(jobs.map(job => job.type).filter(Boolean))].sort();

  // Métriques
  const totalJobs = jobs.length;
  const publishedJobs = jobs.filter(j => j.status === 'published').length;
  const draftJobs = jobs.filter(j => j.status === 'draft').length;
  const totalApplicants = jobs.reduce((sum, job) => sum + (job.applicants?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Gestion des Offres d'Emploi</h1>
              <p className="text-emerald-50 text-sm">
                Gérez, modifiez et surveillez toutes vos offres d'emploi
              </p>
            </div>
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('create_job');
                } else {
                  // Fallback si onNavigate n'est pas fourni
                  const event = new CustomEvent('navigate', { detail: { view: 'create_job' } });
                  window.dispatchEvent(event);
                }
              }}
              className="bg-white text-emerald-600 font-bold py-2 px-4 rounded-lg hover:bg-emerald-50 flex items-center shadow-md transition-all"
            >
              <i className="fas fa-plus mr-2"></i>
              Nouvelle Offre
            </button>
          </div>
        </div>
      </div>

      {/* Métriques Power BI style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total Offres</span>
              <i className="fas fa-briefcase text-2xl text-blue-500"></i>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalJobs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Publiées</span>
              <i className="fas fa-globe text-2xl text-green-500"></i>
            </div>
            <p className="text-3xl font-bold text-gray-900">{publishedJobs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Brouillons</span>
              <i className="fas fa-save text-2xl text-yellow-500"></i>
            </div>
            <p className="text-3xl font-bold text-gray-900">{draftJobs}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Candidats Total</span>
              <i className="fas fa-users text-2xl text-purple-500"></i>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalApplicants}</p>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Rechercher une offre..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="published">Publié</option>
              <option value="draft">Brouillon</option>
              <option value="archived">Archivé</option>
            </select>

            {jobTypes.length > 0 && (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Tous les types</option>
                {jobTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            )}
          </div>

          {/* Compteur de résultats */}
          <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-600">
            {filteredJobs.length} {filteredJobs.length > 1 ? 'offres trouvées' : 'offre trouvée'}
          </div>
        </div>

        {/* Liste des jobs */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <i className="fas fa-briefcase text-6xl text-gray-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune offre trouvée</h3>
            <p className="text-gray-500">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' 
                ? 'Aucune offre ne correspond aux critères de recherche' 
                : 'Créez votre première offre d\'emploi'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map(job => (
              <div key={job.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-800">{job.title}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        job.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : job.status === 'draft' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {job.status === 'published' ? 'Publié' : job.status === 'draft' ? 'Brouillon' : 'Archivé'}
                      </span>
                    </div>
                    <p className="text-lg text-gray-600 mb-1">{job.company}</p>
                    <p className="text-sm text-gray-500 mb-3">{job.description?.substring(0, 150)}...</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      <span><i className="fas fa-map-marker-alt mr-1"></i>{job.location}</span>
                      <span><i className="fas fa-briefcase mr-1"></i>{job.type}</span>
                      <span><i className="far fa-calendar-alt mr-1"></i>{job.postedDate}</span>
                      {job.applicants && job.applicants.length > 0 && (
                        <span className="text-emerald-600 font-semibold">
                          <i className="fas fa-users mr-1"></i>{job.applicants.length} candidat(s)
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {/* Toggle Actif/Inactif */}
                    <button
                      onClick={async () => {
                        const newStatus = job.status === 'published' ? 'draft' : 'published';
                        console.log('🔄 Changement de statut:', job.title, 'de', job.status, 'vers', newStatus);
                        try {
                          await onUpdateJob({ ...job, status: newStatus as any });
                          console.log('✅ Statut mis à jour avec succès');
                        } catch (error: any) {
                          console.error('❌ Erreur lors de la mise à jour du statut:', error);
                          alert('Erreur lors de la mise à jour du statut de l\'offre');
                        }
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        job.status === 'published'
                          ? 'text-green-600 hover:bg-green-50'
                          : 'text-gray-400 hover:bg-gray-50'
                      }`}
                      title={job.status === 'published' ? 'Désactiver l\'offre (passer en brouillon)' : 'Activer l\'offre (publier)'}
                    >
                      <i className={`fas ${job.status === 'published' ? 'fa-toggle-on' : 'fa-toggle-off'} text-xl`}></i>
                    </button>
                    <button
                      onClick={() => setDeletingJobId(job.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {deletingJobId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Confirmer la suppression</h3>
            <p className="text-gray-600 mb-4">Êtes-vous sûr de vouloir supprimer cette offre d'emploi ?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingJobId(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteJob(deletingJobId);
                  setDeletingJobId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;

