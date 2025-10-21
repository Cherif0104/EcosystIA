import React, { useMemo } from 'react';
import { Project, User } from '../types';

interface TeamWorkloadMetricsProps {
    projects: Project[];
    users: User[];
}

interface RoleWorkload {
    role: string;
    users: User[];
    totalProjects: number;
    activeProjects: number;
    totalTasks: number;
    totalEstimatedHours: number;
    totalLoggedHours: number;
}

const TeamWorkloadMetrics: React.FC<TeamWorkloadMetricsProps> = ({ projects, users }) => {
    
    const roleWorkloads = useMemo(() => {
        const roleMap = new Map<string, RoleWorkload>();

        // Initialiser les rôles
        users.forEach(user => {
            const role = user.role || 'employee';
            if (!roleMap.has(role)) {
                roleMap.set(role, {
                    role,
                    users: [],
                    totalProjects: 0,
                    activeProjects: 0,
                    totalTasks: 0,
                    totalEstimatedHours: 0,
                    totalLoggedHours: 0
                });
            }
            roleMap.get(role)!.users.push(user);
        });

        // Calculer les métriques pour chaque rôle
        roleMap.forEach((roleData, role) => {
            roleData.users.forEach(user => {
                // Compter les projets où l'utilisateur est membre
                const userProjects = projects.filter(project => 
                    project.team.some(member => member.id === user.id)
                );

                roleData.totalProjects += userProjects.length;
                roleData.activeProjects += userProjects.filter(p => p.status === 'In Progress').length;

                // Compter les tâches et heures
                userProjects.forEach(project => {
                    const userTasks = project.tasks?.filter(task => task.assignee?.id === user.id) || [];
                    roleData.totalTasks += userTasks.length;
                    
                    userTasks.forEach(task => {
                        roleData.totalEstimatedHours += task.estimatedHours || 0;
                        roleData.totalLoggedHours += task.loggedHours || 0;
                    });
                });
            });
        });

        return Array.from(roleMap.values()).sort((a, b) => b.totalEstimatedHours - a.totalEstimatedHours);
    }, [projects, users]);

    const getRoleColor = (role: string) => {
        const colors: { [key: string]: string } = {
            'super_administrator': 'bg-red-500',
            'administrator': 'bg-purple-500',
            'manager': 'bg-blue-500',
            'supervisor': 'bg-green-500',
            'trainer': 'bg-yellow-500',
            'mentor': 'bg-indigo-500',
            'entrepreneur': 'bg-pink-500',
            'facilitator': 'bg-orange-500',
            'publisher': 'bg-teal-500',
            'producer': 'bg-cyan-500',
            'funder': 'bg-emerald-500',
            'artist': 'bg-violet-500',
            'editor': 'bg-rose-500',
            'student': 'bg-gray-500',
            'intern': 'bg-gray-400'
        };
        return colors[role] || 'bg-gray-500';
    };

    const getRoleDisplayName = (role: string) => {
        const names: { [key: string]: string } = {
            'super_administrator': 'Super Administrateur',
            'administrator': 'Administrateur',
            'manager': 'Manager',
            'supervisor': 'Superviseur',
            'trainer': 'Formateur',
            'mentor': 'Mentor',
            'entrepreneur': 'Entrepreneur',
            'facilitator': 'Facilitateur',
            'publisher': 'Éditeur',
            'producer': 'Producteur',
            'funder': 'Financeur',
            'artist': 'Artiste',
            'editor': 'Rédacteur',
            'student': 'Étudiant',
            'intern': 'Stagiaire',
            'employee': 'Employé'
        };
        return names[role] || role;
    };

    if (roleWorkloads.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <i className="fas fa-users text-blue-600 mr-2"></i>
                    Charge de travail de l'équipe
                </h3>
                <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-chart-bar text-4xl text-gray-300 mb-4"></i>
                    <p>Aucune donnée de charge de travail disponible</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <i className="fas fa-chart-pie text-blue-600 mr-2"></i>
                    Charge de travail de l'équipe
                </h3>
                <div className="text-sm text-gray-500">
                    {roleWorkloads.length} rôle{roleWorkloads.length > 1 ? 's' : ''} • {users.length} utilisateur{users.length > 1 ? 's' : ''}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roleWorkloads.map((roleData) => (
                    <div key={roleData.role} className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200">
                        {/* Header du rôle */}
                        <div className="p-4 border-b border-gray-200">
                            <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 ${getRoleColor(roleData.role)} rounded-lg flex items-center justify-center text-white font-bold text-lg`}>
                                    {getRoleDisplayName(roleData.role).charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{getRoleDisplayName(roleData.role)}</h4>
                                    <p className="text-sm text-gray-500">{roleData.users.length} membre{roleData.users.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        </div>

                        {/* Métriques */}
                        <div className="p-4 space-y-4">
                            {/* Projets */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">{roleData.totalProjects}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Projets</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{roleData.activeProjects}</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Actifs</div>
                                </div>
                            </div>

                            {/* Tâches */}
                            <div className="text-center">
                                <div className="text-3xl font-bold text-purple-600">{roleData.totalTasks}</div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Tâches</div>
                            </div>

                            {/* Heures */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-orange-600">{roleData.totalEstimatedHours}h</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Estimées</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-teal-600">{roleData.totalLoggedHours}h</div>
                                    <div className="text-xs text-gray-500 uppercase tracking-wide">Enregistrées</div>
                                </div>
                            </div>

                            {/* Barre de progression */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Progression</span>
                                    <span>{roleData.totalEstimatedHours > 0 ? Math.round((roleData.totalLoggedHours / roleData.totalEstimatedHours) * 100) : 0}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                                        style={{ 
                                            width: `${roleData.totalEstimatedHours > 0 ? Math.min((roleData.totalLoggedHours / roleData.totalEstimatedHours) * 100, 100) : 0}%` 
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Membres du rôle */}
                            <div className="space-y-2">
                                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Membres</div>
                                <div className="flex flex-wrap gap-1">
                                    {roleData.users.slice(0, 3).map(user => (
                                        <div key={user.id} className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1">
                                            <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs text-gray-700 truncate max-w-16">
                                                {user.fullName || user.email}
                                            </span>
                                        </div>
                                    ))}
                                    {roleData.users.length > 3 && (
                                        <div className="flex items-center space-x-1 bg-gray-100 rounded-full px-2 py-1">
                                            <span className="text-xs text-gray-500">+{roleData.users.length - 3}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Résumé global */}
            <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {roleWorkloads.reduce((sum, role) => sum + role.totalProjects, 0)}
                        </div>
                        <div className="text-sm text-gray-500">Total Projets</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {roleWorkloads.reduce((sum, role) => sum + role.totalTasks, 0)}
                        </div>
                        <div className="text-sm text-gray-500">Total Tâches</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {roleWorkloads.reduce((sum, role) => sum + role.totalEstimatedHours, 0)}h
                        </div>
                        <div className="text-sm text-gray-500">Heures Estimées</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                            {roleWorkloads.reduce((sum, role) => sum + role.totalLoggedHours, 0)}h
                        </div>
                        <div className="text-sm text-gray-500">Heures Loggées</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamWorkloadMetrics;
