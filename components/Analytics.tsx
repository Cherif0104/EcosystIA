import React, { useMemo } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { User, Project, Course, Job } from '../types';

interface AnalyticsProps {
    setView: (view: string) => void;
    users: User[];
    projects: Project[];
    courses: Course[];
    jobs: Job[];
}

const ChartCard: React.FC<{ title: string; children: React.ReactNode; viewMoreLink?: () => void; viewMoreText?: string }> = ({ title, children, viewMoreLink, viewMoreText }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
        <h3 className="text-lg font-bold text-gray-800 mb-4">{title}</h3>
        <div>{children}</div>
        {viewMoreLink && viewMoreText && (
            <div className="mt-4 text-right">
                <button onClick={viewMoreLink} className="text-sm font-medium text-emerald-600 hover:text-emerald-800 transition-colors">
                    {viewMoreText} &rarr;
                </button>
            </div>
        )}
    </div>
);

const BarChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    
    return (
        <div className="flex items-end h-48 space-x-2 px-4 py-4">
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                        className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer relative group"
                        style={{ 
                            height: `${(item.value / maxValue) * 100}%`,
                            backgroundColor: item.color
                        }}
                        title={`${item.label}: ${item.value}`}
                    >
                        <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            {item.label}: {item.value}
                        </div>
                    </div>
                    <span className="text-xs text-gray-600 mt-2 text-center">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

const PieChart: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
        <div className="h-48 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                {data.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3">
                        <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: item.color }}
                        ></div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">{item.label}</p>
                            <p className="text-xs text-gray-500">
                                {item.value} ({((item.value / total) * 100).toFixed(1)}%)
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const Analytics: React.FC<AnalyticsProps> = ({ setView, users, projects, courses, jobs }) => {
    const { t } = useLocalization();
    const { user: currentUser } = useAuth();

    // Calcul des métriques
    const metrics = useMemo(() => {
        const activeUsers = users.filter(u => u.isActive !== false).length;
        const completedProjects = projects.filter(p => p.status === 'completed').length;
        const publishedCourses = courses.filter(c => c.status === 'published').length;
        const activeJobs = jobs.filter(j => j.status === 'published').length;

        return {
            totalUsers: users.length,
            activeUsers,
            completedProjects,
            publishedCourses,
            activeJobs
        };
    }, [users, projects, courses, jobs]);

    // Données pour le graphique de croissance des utilisateurs (simulé par mois)
    const userGrowthData = [
        { label: 'Jan', value: 10, color: '#10b981' },
        { label: 'Fév', value: 15, color: '#10b981' },
        { label: 'Mar', value: 18, color: '#10b981' },
        { label: 'Avr', value: 22, color: '#10b981' },
        { label: 'Mai', value: 25, color: '#10b981' },
        { label: 'Juin', value: metrics.activeUsers, color: '#059669' }
    ];

    // Données pour le graphique des inscriptions
    const enrollmentData = [
        { label: 'Cours 1', value: 45, color: '#10b981' },
        { label: 'Cours 2', value: 32, color: '#34d399' },
        { label: 'Cours 3', value: 28, color: '#6ee7b7' },
        { label: 'Cours 4', value: 15, color: '#a7f3d0' }
    ];

    // Données pour le graphique des postes
    const jobsBySector = [
        { label: 'IT & Tech', value: 35, color: '#10b981' },
        { label: 'Marketing', value: 20, color: '#34d399' },
        { label: 'Finance', value: 15, color: '#6ee7b7' },
        { label: 'Autres', value: 10, color: '#a7f3d0' }
    ];

    if (!currentUser) return null;

    const hasAccess = currentUser.role === 'administrator' || 
                     currentUser.role === 'super_administrator' || 
                     currentUser.role === 'manager';

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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header avec gradient */}
            <div className="bg-gradient-to-r from-emerald-600 via-green-500 to-blue-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">📊 Analytics</h1>
                            <p className="text-emerald-50 text-sm">
                                Analysez les performances de votre plateforme
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-8">
                {/* Métriques Power BI style */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Utilisateurs Actifs</span>
                            <i className="fas fa-users text-2xl text-blue-500"></i>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{metrics.activeUsers}</p>
                        <p className="text-xs text-gray-500 mt-1">sur {metrics.totalUsers} total</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Projets Complétés</span>
                            <i className="fas fa-check-circle text-2xl text-green-500"></i>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{metrics.completedProjects}</p>
                        <p className="text-xs text-gray-500 mt-1">projets terminés</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Cours Publiés</span>
                            <i className="fas fa-graduation-cap text-2xl text-purple-500"></i>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{metrics.publishedCourses}</p>
                        <p className="text-xs text-gray-500 mt-1">cours disponibles</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Offres Actives</span>
                            <i className="fas fa-briefcase text-2xl text-orange-500"></i>
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{metrics.activeJobs}</p>
                        <p className="text-xs text-gray-500 mt-1">postes disponibles</p>
                    </div>
                </div>

                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ChartCard title="Croissance des Utilisateurs">
                        <BarChart data={userGrowthData} />
                    </ChartCard>

                    <ChartCard title="Inscriptions aux Cours">
                        <BarChart data={enrollmentData} />
                    </ChartCard>

                    <ChartCard 
                        title="Talent Analytics"
                        viewMoreLink={() => setView('talent_analytics')}
                        viewMoreText="Voir l'analyse des talents"
                    >
                        <div className="text-center py-8">
                            <i className="fas fa-user-astronaut text-5xl text-emerald-500 mb-4"></i>
                            <p className="text-gray-600">{t('talent_analytics_subtitle')}</p>
                        </div>
                    </ChartCard>

                    <ChartCard title="Postes par Secteur">
                        <PieChart data={jobsBySector} />
                    </ChartCard>
                </div>

                {/* Section des tendances */}
                <div className="mt-8 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Tendances Récentes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <i className="fas fa-chart-line text-3xl text-emerald-500 mb-2"></i>
                            <p className="font-semibold text-gray-800">Croissance</p>
                            <p className="text-2xl font-bold text-emerald-600">+{((metrics.activeUsers / userGrowthData[0].value - 1) * 100).toFixed(1)}%</p>
                        </div>
                        <div className="text-center">
                            <i className="fas fa-user-check text-3xl text-blue-500 mb-2"></i>
                            <p className="font-semibold text-gray-800">Engagement</p>
                            <p className="text-2xl font-bold text-blue-600">85%</p>
                        </div>
                        <div className="text-center">
                            <i className="fas fa-trophy text-3xl text-orange-500 mb-2"></i>
                            <p className="font-semibold text-gray-800">Réussite</p>
                            <p className="text-2xl font-bold text-orange-600">92%</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
