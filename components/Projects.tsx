import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Project, User, TimeLog } from '../types';
import LogTimeModal from './LogTimeModal';
import ConfirmationModal from './common/ConfirmationModal';
import TeamSelector from './common/TeamSelector';

const statusStyles = {
    'Not Started': 'bg-gray-200 text-gray-800',
    'In Progress': 'bg-blue-200 text-blue-800',
    'Completed': 'bg-emerald-200 text-emerald-800',
};

const ProjectFormModal: React.FC<{
    project: Omit<Project, 'id' | 'tasks' | 'risks'> | Project | null;
    users: User[];
    onClose: () => void;
    onSave: (project: Omit<Project, 'id' | 'tasks' | 'risks'> | Project) => void;
}> = ({ project, users, onClose, onSave }) => {
    const { t } = useLocalization();
    const isEditMode = project && 'id' in project;
    const [formData, setFormData] = useState({
        title: project?.title || '',
        description: project?.description || '',
        status: project?.status || 'Not Started',
        dueDate: project?.dueDate || '',
        team: project?.team || [],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const projectData = {
            ...project,
            ...formData,
            team: formData.team // formData.team contient déjà les objets User complets
        };
        onSave(projectData as Project);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                 <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 border-b">
                        <h2 className="text-2xl font-bold">{isEditMode ? t('edit_project') : t('create_new_project')}</h2>
                    </div>
                    <div className="p-6 flex-grow overflow-y-auto space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('project_title')}</label>
                            <input type="text" name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">{t('project_description')}</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('status')}</label>
                                <select name="status" value={formData.status} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                                    <option value="Not Started">{t('not_started')}</option>
                                    <option value="In Progress">{t('in_progress')}</option>
                                    <option value="Completed">{t('completed')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('due_date')}</label>
                                <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                            </div>
                        </div>
                        <div>
                            <TeamSelector
                                selectedUsers={formData.team}
                                onUsersChange={(users) => setFormData(prev => ({...prev, team: users}))}
                                placeholder={t('search_team_members')}
                            />
                        </div>
                    </div>
                    <div className="p-6 border-t flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">{t('cancel')}</button>
                        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ProjectDetailModal: React.FC<{
    project: Project;
    onClose: () => void;
    onUpdateProject: (project: Project) => void;
    onDeleteProject: (projectId: number) => void;
    onAddTimeLog: (log: Omit<TimeLog, 'id' | 'userId'>) => void;
    timeLogs: TimeLog[];
}> = ({ project, onClose, onUpdateProject, onDeleteProject, onAddTimeLog, timeLogs }) => {
    const { t } = useLocalization();
    const { user: currentUser } = useAuth();
    const [currentProject, setCurrentProject] = useState(project);
    const [activeTab, setActiveTab] = useState<'tasks' | 'risks' | 'report'>('tasks');
    const [isLogTimeModalOpen, setLogTimeModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // États pour la gestion des tâches
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
    const [newTaskAssignee, setNewTaskAssignee] = useState<string>('');

    useEffect(() => {
        setCurrentProject(project);
    }, [project]);

    const handleSaveTimeLog = (log: Omit<TimeLog, 'id' | 'userId'>) => {
        onAddTimeLog(log);
        setLogTimeModalOpen(false);
    };

    const projectTimeLogs = timeLogs.filter(log => 
        log.entityType === 'project' && log.entityId === project.id
    );

    const totalTimeSpent = projectTimeLogs.reduce((total, log) => total + log.duration, 0);

    const canManage = currentUser?.role === 'manager' || currentUser?.role === 'administrator' || currentUser?.role === 'super_administrator';

    const handleAddTask = () => {
        if (!newTaskText.trim()) return;
        
        const newTask = {
            id: `task-${Date.now()}`,
            text: newTaskText,
            status: 'To Do',
            priority: newTaskPriority,
            dueDate: newTaskDueDate || undefined,
            assignee: currentProject.team.find(m => m.id === newTaskAssignee),
            estimatedHours: 8,
            loggedHours: 0
        };

        const updatedProject = {
            ...currentProject,
            tasks: [...(currentProject.tasks || []), newTask]
        };
        
        setCurrentProject(updatedProject);
        onUpdateProject(updatedProject);
        
        // Reset form
        setNewTaskText('');
        setNewTaskDueDate('');
        setNewTaskPriority('Medium');
        setNewTaskAssignee('');
    };

    const handleUpdateTask = (taskId: string, updates: any) => {
        const updatedTasks = (currentProject.tasks || []).map(task =>
            task.id === taskId ? { ...task, ...updates } : task
        );
        
        const updatedProject = { ...currentProject, tasks: updatedTasks };
        setCurrentProject(updatedProject);
        onUpdateProject(updatedProject);
    };

    const handleDeleteTask = (taskId: string) => {
        const updatedTasks = (currentProject.tasks || []).filter(task => task.id !== taskId);
        const updatedProject = { ...currentProject, tasks: updatedTasks };
        setCurrentProject(updatedProject);
        onUpdateProject(updatedProject);
    };

    const getRiskLevel = (likelihood: 'High' | 'Medium' | 'Low', impact: 'High' | 'Medium' | 'Low'): 'High' | 'Medium' | 'Low' => {
        if (likelihood === 'High' && impact === 'High') return 'High';
        if (likelihood === 'High' && impact === 'Medium') return 'High';
        if (likelihood === 'Medium' && impact === 'High') return 'High';
        if (likelihood === 'Medium' && impact === 'Medium') return 'Medium';
        if (likelihood === 'High' && impact === 'Low') return 'Medium';
        if (likelihood === 'Low' && impact === 'High') return 'Medium';
        return 'Low';
    };

    const handleUpdateRisk = (riskId: string, updates: any) => {
        const updatedRisks = (currentProject.risks || []).map(risk =>
            risk.id === riskId ? { ...risk, ...updates } : risk
        );
        
        const updatedProject = { ...currentProject, risks: updatedRisks };
        setCurrentProject(updatedProject);
        onUpdateProject(updatedProject);
    };

    const handleDeleteRisk = (riskId: string) => {
        const updatedRisks = (currentProject.risks || []).filter(risk => risk.id !== riskId);
        const updatedProject = { ...currentProject, risks: updatedRisks };
        setCurrentProject(updatedProject);
        onUpdateProject(updatedProject);
    };

    const handleIdentifyRisksWithAI = async () => {
        setIsLoading(true);
        // Simulation de génération de risques par IA
        setTimeout(() => {
            const aiRisks = [
                {
                    id: `ai-risk-${Date.now()}-1`,
                    description: 'Retard dans la livraison des contenus créatifs due aux changements de dernière minute',
                    likelihood: 'High' as const,
                    impact: 'Medium' as const,
                    mitigationStrategy: 'Établir des deadlines fermes et un processus d\'approbation accéléré pour les révisions mineures'
                },
                {
                    id: `ai-risk-${Date.now()}-2`,
                    description: 'Dépassement du budget publicitaire dû à l\'augmentation des coûts des plateformes',
                    likelihood: 'Medium' as const,
                    impact: 'High' as const,
                    mitigationStrategy: 'Surveiller quotidiennement les dépenses et ajuster les enchères en temps réel'
                },
                {
                    id: `ai-risk-${Date.now()}-3`,
                    description: 'Faible engagement sur les réseaux sociaux due à la saturation du marché',
                    likelihood: 'Medium' as const,
                    impact: 'Medium' as const,
                    mitigationStrategy: 'Diversifier les canaux de communication et tester de nouveaux formats créatifs'
                },
                {
                    id: `ai-risk-${Date.now()}-4`,
                    description: 'Problèmes techniques lors du webinar de lancement',
                    likelihood: 'Low' as const,
                    impact: 'High' as const,
                    mitigationStrategy: 'Effectuer des tests techniques complets et avoir un plan de secours avec une plateforme alternative'
                },
                {
                    id: `ai-risk-${Date.now()}-5`,
                    description: 'Conflit de calendrier avec les membres de l\'équipe sur des tâches critiques',
                    likelihood: 'Medium' as const,
                    impact: 'Medium' as const,
                    mitigationStrategy: 'Établir des priorités claires et avoir des ressources de secours identifiées'
                }
            ];

            const updatedProject = {
                ...currentProject,
                risks: [...(currentProject.risks || []), ...aiRisks]
            };
            
            setCurrentProject(updatedProject);
            onUpdateProject(updatedProject);
            setIsLoading(false);
        }, 2500);
    };

    const handleSummarizeTasks = async () => {
        setIsLoading(true);
        // Simulation de génération de résumé par IA
        setTimeout(() => {
            const tasks = currentProject.tasks || [];
            const completedTasks = tasks.filter(task => task.status === 'Completed');
            const inProgressTasks = tasks.filter(task => task.status === 'In Progress');
            const todoTasks = tasks.filter(task => task.status === 'To Do');
            const overdueTasks = tasks.filter(task => task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed');
            
            const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
            const totalLoggedHours = tasks.reduce((sum, task) => sum + (task.loggedHours || 0), 0);
            
            const summary = {
                id: `summary-${Date.now()}`,
                projectTitle: currentProject.title,
                totalTasks: tasks.length,
                completedTasks: completedTasks.length,
                inProgressTasks: inProgressTasks.length,
                todoTasks: todoTasks.length,
                overdueTasks: overdueTasks.length,
                totalEstimatedHours,
                totalLoggedHours,
                progressPercentage: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
                generatedAt: new Date().toLocaleString('fr-FR')
            };

            // Afficher le résumé dans une alerte pour l'instant
            alert(`📊 RÉSUMÉ DES TÂCHES - ${summary.projectTitle}

✅ Tâches terminées: ${summary.completedTasks}/${summary.totalTasks} (${summary.progressPercentage}%)
🔄 Tâches en cours: ${summary.inProgressTasks}
📋 Tâches à faire: ${summary.todoTasks}
⚠️ Tâches en retard: ${summary.overdueTasks}

⏱️ Heures estimées: ${summary.totalEstimatedHours}h
⏱️ Heures enregistrées: ${summary.totalLoggedHours}h

📅 Résumé généré le: ${summary.generatedAt}`);

            setIsLoading(false);
        }, 1500);
    };

    const handleGenerateStatusReport = async () => {
        setIsLoading(true);
        // Simulation de génération de rapport d'état par IA
        setTimeout(() => {
            const tasks = currentProject.tasks || [];
            const risks = currentProject.risks || [];
            const completedTasks = tasks.filter(task => task.status === 'Completed');
            const highPriorityTasks = tasks.filter(task => task.priority === 'High');
            const highRiskItems = risks.filter(risk => getRiskLevel(risk.likelihood, risk.impact) === 'High');
            
            const report = {
                id: `report-${Date.now()}`,
                projectTitle: currentProject.title,
                status: currentProject.status,
                dueDate: currentProject.dueDate,
                teamSize: currentProject.team.length,
                totalTasks: tasks.length,
                completedTasks: completedTasks.length,
                progressPercentage: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
                highPriorityTasks: highPriorityTasks.length,
                totalRisks: risks.length,
                highRiskItems: highRiskItems.length,
                generatedAt: new Date().toLocaleString('fr-FR')
            };

            // Afficher le rapport dans une alerte pour l'instant
            alert(`📋 RAPPORT D'ÉTAT - ${report.projectTitle}

📊 ÉTAT DU PROJET
• Statut: ${report.status}
• Date d'échéance: ${report.dueDate ? new Date(report.dueDate).toLocaleDateString('fr-FR') : 'Non définie'}
• Équipe: ${report.teamSize} membres

📈 PROGRESSION
• Progression: ${report.progressPercentage}%
• Tâches terminées: ${report.completedTasks}/${report.totalTasks}
• Tâches prioritaires: ${report.highPriorityTasks}

⚠️ RISQUES
• Total des risques: ${report.totalRisks}
• Risques élevés: ${report.highRiskItems}

📅 Rapport généré le: ${report.generatedAt}`);

            setIsLoading(false);
        }, 2000);
    };

    const handleGenerateTasksWithAI = async () => {
        setIsLoading(true);
        // Simulation de génération de tâches par IA
        setTimeout(() => {
            const aiTasks = [
                {
                    id: `ai-task-${Date.now()}-1`,
                    text: 'Finalize key messaging and positioning strategy',
                    status: 'Completed',
                    priority: 'High' as const,
                    dueDate: '2024-10-15',
                    assignee: currentProject.team[0],
                    estimatedHours: 8,
                    loggedHours: 6
                },
                {
                    id: `ai-task-${Date.now()}-2`,
                    text: 'Develop social media content calendar',
                    status: 'Completed',
                    priority: 'High' as const,
                    dueDate: '2024-10-20',
                    assignee: currentProject.team[1] || currentProject.team[0],
                    estimatedHours: 12,
                    loggedHours: 15
                },
                {
                    id: `ai-task-${Date.now()}-3`,
                    text: 'Create video testimonials and case studies',
                    status: 'To Do',
                    priority: 'Medium' as const,
                    dueDate: '2024-11-05',
                    assignee: currentProject.team[2] || currentProject.team[0],
                    estimatedHours: 16,
                    loggedHours: 4.5
                },
                {
                    id: `ai-task-${Date.now()}-4`,
                    text: 'Organize launch webinar and virtual event',
                    status: 'To Do',
                    priority: 'High' as const,
                    dueDate: '2024-12-01',
                    assignee: undefined,
                    estimatedHours: 40,
                    loggedHours: 0
                },
                {
                    id: `ai-task-${Date.now()}-5`,
                    text: 'Develop core messaging and value propositions',
                    status: 'To Do',
                    priority: 'High' as const,
                    dueDate: undefined,
                    assignee: currentProject.team[0],
                    estimatedHours: 0,
                    loggedHours: 0
                },
                {
                    id: `ai-task-${Date.now()}-6`,
                    text: 'Design campaign visual assets and graphics',
                    status: 'To Do',
                    priority: 'High' as const,
                    dueDate: undefined,
                    assignee: currentProject.team[1] || currentProject.team[0],
                    estimatedHours: 0,
                    loggedHours: 0
                },
                {
                    id: `ai-task-${Date.now()}-7`,
                    text: 'Create content for social media platforms',
                    status: 'To Do',
                    priority: 'Medium' as const,
                    dueDate: undefined,
                    assignee: currentProject.team[0],
                    estimatedHours: 0,
                    loggedHours: 0
                },
                {
                    id: `ai-task-${Date.now()}-8`,
                    text: 'Plan and execute paid digital advertising campaigns',
                    status: 'To Do',
                    priority: 'High' as const,
                    dueDate: undefined,
                    assignee: currentProject.team[0],
                    estimatedHours: 0,
                    loggedHours: 0
                },
                {
                    id: `ai-task-${Date.now()}-9`,
                    text: 'Research target audience and market segments',
                    status: 'To Do',
                    priority: 'Medium' as const,
                    dueDate: undefined,
                    assignee: currentProject.team[2] || currentProject.team[0],
                    estimatedHours: 0,
                    loggedHours: 0
                },
                {
                    id: `ai-task-${Date.now()}-10`,
                    text: 'Set up and monitor campaign analytics and KPIs',
                    status: 'To Do',
                    priority: 'Medium' as const,
                    dueDate: undefined,
                    assignee: currentProject.team[2] || currentProject.team[0],
                    estimatedHours: 0,
                    loggedHours: 0
                }
            ];

            const updatedProject = {
                ...currentProject,
                tasks: [...(currentProject.tasks || []), ...aiTasks]
            };
            
            setCurrentProject(updatedProject);
            onUpdateProject(updatedProject);
            setIsLoading(false);
        }, 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-2xl font-bold">{currentProject.title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div className="flex-1 overflow-hidden flex">
                    {/* Sidebar */}
                    <div className="w-80 bg-gray-50 border-r p-6 flex flex-col">
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Statut</h3>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusStyles[currentProject.status]}`}>
                                    {currentProject.status === 'In Progress' ? 'En cours' : 
                                     currentProject.status === 'Completed' ? 'Terminé' : 'Non démarré'}
                                </span>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Date d'échéance</h3>
                                <p className="text-gray-600">{currentProject.dueDate ? new Date(currentProject.dueDate).toLocaleDateString('fr-FR') : 'Aucune date'}</p>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Membres de l'équipe</h3>
                                <div className="space-y-2">
                                    {currentProject.team.map(member => (
                                        <div key={member.id} className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                {member.fullName?.charAt(0) || member.email?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{member.fullName || member.email}</p>
                                                <p className="text-xs text-gray-500">{member.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Time Tracking</h3>
                                <p className="text-gray-600">{totalTimeSpent}h enregistré</p>
                            </div>
                            
                            <div>
                                <h3 className="font-semibold text-gray-700 mb-2">Charge de travail de l'équipe</h3>
                                <div className="space-y-2">
                                    {currentProject.team.length > 0 ? (
                                        currentProject.team.map(member => (
                                            <div key={member.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                                                        {(member.fullName || member.email)?.charAt(0)}
                                                    </div>
                                                    <span className="text-sm text-gray-700 truncate">
                                                        {member.fullName || member.email}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 bg-blue-100 px-2 py-1 rounded">
                                                    {member.role}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-400">Aucune charge de travail assignée</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {canManage && (
                            <div className="mt-6 space-y-2">
                                {activeTab === 'tasks' && (
                                    <>
                                <button 
                                    onClick={handleGenerateTasksWithAI}
                                    disabled={isLoading}
                                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-300 flex items-center justify-center text-sm"
                                >
                                    <i className="fas fa-magic mr-2"></i>
                                    {isLoading ? 'Génération...' : 'Générer des tâches avec l\'IA'}
                                </button>
                                <button onClick={() => setLogTimeModalOpen(true)} className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center text-sm">
                                    <i className="fas fa-clock mr-2"></i>
                                            Heure du journal
                                </button>
                                <button onClick={() => setDeleteModalOpen(true)} className="w-full text-red-600 py-2 px-4 rounded-lg font-semibold hover:bg-red-100 flex items-center justify-center text-sm">
                                    <i className="fas fa-trash mr-2"></i>
                                            Supprimer le projet
                                </button>
                                    </>
                                )}
                                
                                {activeTab === 'risks' && (
                                    <>
                                        <button 
                                            onClick={handleIdentifyRisksWithAI}
                                            disabled={isLoading}
                                            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:bg-green-300 flex items-center justify-center text-sm"
                                        >
                                            <i className="fas fa-bolt mr-2"></i>
                                            {isLoading ? 'Analyse en cours...' : 'Identifier les risques avec l\'IA'}
                                        </button>
                                        <button onClick={() => setLogTimeModalOpen(true)} className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center text-sm">
                                            <i className="fas fa-clock mr-2"></i>
                                            Heure du journal
                                        </button>
                                        <button onClick={() => setDeleteModalOpen(true)} className="w-full text-red-600 py-2 px-4 rounded-lg font-semibold hover:bg-red-100 flex items-center justify-center text-sm">
                                            <i className="fas fa-trash mr-2"></i>
                                            Supprimer le projet
                                        </button>
                                    </>
                                )}
                                
                                {activeTab === 'report' && (
                                    <>
                                        <button 
                                            onClick={handleGenerateStatusReport}
                                            disabled={isLoading}
                                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 flex items-center justify-center text-sm"
                                        >
                                            <i className="fas fa-file-alt mr-2"></i>
                                            {isLoading ? 'Génération...' : 'Générer un rapport d\'état'}
                                        </button>
                                        <button 
                                            onClick={handleSummarizeTasks}
                                            disabled={isLoading}
                                            className="w-full bg-gray-800 text-white py-2 px-4 rounded-lg font-semibold hover:bg-gray-900 disabled:bg-gray-400 flex items-center justify-center text-sm"
                                        >
                                            <i className="fas fa-list mr-2"></i>
                                            {isLoading ? 'Analyse...' : 'Résumer les tâches'}
                                        </button>
                                        <button onClick={() => setLogTimeModalOpen(true)} className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center text-sm">
                                            <i className="fas fa-clock mr-2"></i>
                                            Heure du journal
                                        </button>
                                        <button onClick={() => setDeleteModalOpen(true)} className="w-full text-red-600 py-2 px-4 rounded-lg font-semibold hover:bg-red-100 flex items-center justify-center text-sm">
                                            <i className="fas fa-trash mr-2"></i>
                                            Supprimer le projet
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold mb-3">{t('description')}</h3>
                                <p className="text-gray-700 whitespace-pre-wrap">{currentProject.description}</p>
                            </div>
                            
                            {/* Tabs */}
                            <div className="border-b border-gray-200 mb-6">
                                <nav className="-mb-px flex space-x-8">
                                    <button
                                        onClick={() => setActiveTab('tasks')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'tasks'
                                                ? 'border-green-500 text-green-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Tâches ({(currentProject.tasks || []).length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('risks')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'risks'
                                                ? 'border-green-500 text-green-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Gestion des risques
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('report')}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'report'
                                                ? 'border-green-500 text-green-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Générer un rapport d'état
                                    </button>
                                </nav>
                            </div>
                            
                            {/* Tab Content */}
                            {activeTab === 'tasks' && (
                                <div className="space-y-6">
                                    {/* Tasks Table */}
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            <input type="checkbox" className="rounded" />
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Nom de la tâche
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Statut
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Date d'échéance
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Est. (h)
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Enregistré (h)
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Priorité
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Assigné à
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {(currentProject.tasks || []).map(task => {
                                                        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                                                        return (
                                                        <tr key={task.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={task.status === 'Completed'}
                                                                    onChange={(e) => handleUpdateTask(task.id, { 
                                                                        status: e.target.checked ? 'Completed' : 'To Do' 
                                                                    })}
                                                                    className="rounded"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    <div className="flex items-center">
                                                                        <input
                                                                            type="text"
                                                                            value={task.text}
                                                                            onChange={(e) => handleUpdateTask(task.id, { text: e.target.value })}
                                                                            className="w-full max-w-xs text-sm border border-gray-300 rounded px-2 py-1"
                                                                        />
                                                                    </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center space-x-2">
                                                                        <select
                                                                            value={task.status}
                                                                            onChange={(e) => handleUpdateTask(task.id, { status: e.target.value as 'To Do' | 'In Progress' | 'Completed' })}
                                                                            className="text-xs border border-gray-300 rounded px-2 py-1"
                                                                        >
                                                                            <option value="To Do">À faire</option>
                                                                            <option value="In Progress">En cours</option>
                                                                            <option value="Completed">Terminé</option>
                                                                        </select>
                                                                        {isOverdue && (
                                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                                <i className="fas fa-exclamation-circle mr-1"></i>
                                                                                En retard
                                                                </span>
                                                                        )}
                                                                    </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    <div className="flex items-center">
                                                                        <input
                                                                            type="date"
                                                                            value={task.dueDate || ''}
                                                                            onChange={(e) => handleUpdateTask(task.id, { dueDate: e.target.value || undefined })}
                                                                            className="w-28 text-sm border border-gray-300 rounded px-2 py-1"
                                                                        />
                                                                        <i className="fas fa-calendar text-gray-400 ml-1"></i>
                                                                    </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    <input
                                                                        type="text"
                                                                        value={task.estimatedHours || ''}
                                                                        onChange={(e) => handleUpdateTask(task.id, { estimatedHours: parseInt(e.target.value) || 0 })}
                                                                        className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
                                                                    />
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    <input
                                                                        type="text"
                                                                        value={task.loggedHours || ''}
                                                                        onChange={(e) => handleUpdateTask(task.id, { loggedHours: parseFloat(e.target.value) || 0 })}
                                                                        className="w-16 text-sm border border-gray-300 rounded px-2 py-1"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <select
                                                                        value={task.priority}
                                                                        onChange={(e) => handleUpdateTask(task.id, { priority: e.target.value as 'Low' | 'Medium' | 'High' })}
                                                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                                                    >
                                                                        <option value="Low">Faible</option>
                                                                        <option value="Medium">Moyen</option>
                                                                        <option value="High">Haut</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    <div className="flex items-center">
                                                                        <select
                                                                            value={task.assignee?.id || ''}
                                                                            onChange={(e) => {
                                                                                const assigneeId = e.target.value;
                                                                                const assignee = assigneeId ? currentProject.team.find(m => m.id === assigneeId) : undefined;
                                                                                handleUpdateTask(task.id, { assignee });
                                                                            }}
                                                                            className="text-xs border border-gray-300 rounded px-2 py-1 min-w-24"
                                                                        >
                                                                            <option value="">Non attribué</option>
                                                                            {currentProject.team.map(member => (
                                                                                <option key={member.id} value={member.id}>
                                                                                    {member.fullName || member.email}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {activeTab === 'risks' && (
                                <div className="space-y-6">
                                    {/* Risks Table */}
                                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Description du risque
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Probabilité
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Impact
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Niveau de risque
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Stratégie d'atténuation
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {(currentProject.risks || []).map(risk => {
                                                        const riskLevel = getRiskLevel(risk.likelihood, risk.impact);
                                                        return (
                                                            <tr key={risk.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    <div className="flex items-center">
                                                                        <input
                                                                            type="text"
                                                                            value={risk.description}
                                                                            onChange={(e) => handleUpdateRisk(risk.id, { description: e.target.value })}
                                                                            className="w-full max-w-xs text-sm border border-gray-300 rounded px-2 py-1"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <select
                                                                        value={risk.likelihood}
                                                                        onChange={(e) => handleUpdateRisk(risk.id, { likelihood: e.target.value as 'High' | 'Medium' | 'Low' })}
                                                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                                                    >
                                                                        <option value="Low">Faible</option>
                                                                        <option value="Medium">Moyenne</option>
                                                                        <option value="High">Élevée</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <select
                                                                        value={risk.impact}
                                                                        onChange={(e) => handleUpdateRisk(risk.id, { impact: e.target.value as 'High' | 'Medium' | 'Low' })}
                                                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                                                    >
                                                                        <option value="Low">Faible</option>
                                                                        <option value="Medium">Moyen</option>
                                                                        <option value="High">Élevé</option>
                                                                    </select>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                        riskLevel === 'High' ? 'bg-red-100 text-red-800' :
                                                                        riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                    'bg-green-100 text-green-800'
                                                                }`}>
                                                                        {riskLevel === 'High' ? 'Élevé' :
                                                                         riskLevel === 'Medium' ? 'Moyen' : 'Faible'}
                                                                </span>
                                                            </td>
                                                                <td className="px-4 py-4 text-sm text-gray-500">
                                                                    <div className="max-w-xs">
                                                                        <textarea
                                                                            value={risk.mitigationStrategy}
                                                                            onChange={(e) => handleUpdateRisk(risk.id, { mitigationStrategy: e.target.value })}
                                                                            className="w-full text-sm border border-gray-300 rounded px-2 py-1 resize-none"
                                                                            rows={2}
                                                                        />
                                                                        </div>
                                                            </td>
                                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {canManage && (
                                                                    <button
                                                                            onClick={() => handleDeleteRisk(risk.id)}
                                                                        className="text-red-600 hover:text-red-800"
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        );
                                                    })}
                                                    {(!currentProject.risks || currentProject.risks.length === 0) && (
                                                        <tr>
                                                            <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                                                <i className="fas fa-exclamation-triangle text-4xl text-gray-300 mb-4"></i>
                                                                <p>Aucun risque identifié pour ce projet</p>
                                                                <p className="text-sm mt-2">Cliquez sur "Identifier les risques avec l'IA" pour analyser le projet</p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {activeTab === 'report' && (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="fas fa-file-alt text-6xl text-gray-300 mb-4"></i>
                                    <p className="text-lg">Générer un rapport d'état ou un résumé des tâches.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {isLogTimeModalOpen && currentUser && (
                 <LogTimeModal
                    onClose={() => setLogTimeModalOpen(false)}
                    onSave={handleSaveTimeLog}
                    projects={[currentProject]}
                    courses={[]}
                    user={currentUser}
                    initialEntity={{ type: 'project', id: currentProject.id }}
                />
            )}
            {isDeleteModalOpen && (
                <ConfirmationModal 
                    title={t('delete_project')}
                    message={t('confirm_delete_message')}
                    onConfirm={() => { onDeleteProject(project.id); onClose(); }}
                    onCancel={() => setDeleteModalOpen(false)}
                />
            )}
        </div>
    );
};

interface ProjectsProps {
    projects: Project[];
    users: User[];
    timeLogs: TimeLog[];
    onUpdateProject: (project: Project) => void;
    onAddProject: (project: Omit<Project, 'id' | 'tasks' | 'risks'>) => void;
    onDeleteProject: (projectId: number) => void;
    onAddTimeLog: (log: Omit<TimeLog, 'id' | 'userId'>) => void;
    isLoading?: boolean;
    loadingOperation?: string | null;
}

const Projects: React.FC<ProjectsProps> = ({ projects, users, timeLogs, onUpdateProject, onAddProject, onDeleteProject, onAddTimeLog, isLoading = false, loadingOperation = null }) => {
    const { t } = useLocalization();
    const { user: currentUser } = useAuth();
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const validateProject = (projectData: Project | Omit<Project, 'id' | 'tasks' | 'risks'>): string | null => {
        if (!projectData.title?.trim()) {
            return 'Le titre du projet est requis';
        }
        if (!projectData.description?.trim()) {
            return 'La description du projet est requise';
        }
        if (projectData.dueDate && new Date(projectData.dueDate) < new Date()) {
            return 'La date d\'échéance ne peut pas être dans le passé';
        }
        return null;
    };

    const handleSaveProject = (projectData: Project | Omit<Project, 'id' | 'tasks' | 'risks'>) => {
        const validationError = validateProject(projectData);
        if (validationError) {
            alert(validationError);
            return;
        }

        if ('id' in projectData) {
            onUpdateProject(projectData);
        } else {
            onAddProject(projectData);
        }
        setFormModalOpen(false);
        setEditingProject(null);
    };

    const handleDeleteProject = () => {
        if (projectToDelete) {
            onDeleteProject(projectToDelete.id);
            setProjectToDelete(null);
        }
    };

    const handleOpenForm = (project: Project | null = null) => {
        setEditingProject(project);
        setFormModalOpen(true);
    };

    const filteredProjects = useMemo(() => {
        return projects.filter(project => {
            // Filtrer par utilisateur connecté si nécessaire
            return true; // Pour l'instant, afficher tous les projets
        });
    }, [projects]);

    const canManage = useMemo(() => {
        return currentUser?.role === 'manager' || 
               currentUser?.role === 'administrator' || 
               currentUser?.role === 'super_administrator';
    }, [currentUser?.role]);

    // Calculer la charge de travail de l'équipe (version simplifiée pour MVP)
    const teamWorkload = useMemo(() => {
        const teamMembers = new Map();
        
        // Collecter tous les membres d'équipe de tous les projets
        projects.forEach(project => {
            project.team.forEach(member => {
                if (!teamMembers.has(member.id)) {
                    teamMembers.set(member.id, {
                        ...member,
                        projectCount: 0,
                        totalProjects: 0,
                        estimatedHours: 0
                    });
                }
                
                const current = teamMembers.get(member.id);
                current.projectCount += 1;
                current.totalProjects = projects.filter(p => 
                    p.team.some(tm => tm.id === member.id)
                ).length;
                
                // Estimation simple des heures (8h par projet en moyenne)
                current.estimatedHours = current.projectCount * 8;
            });
        });
        
        return Array.from(teamMembers.values()).slice(0, 3); // Limiter à 3 membres
    }, [projects]);

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                    <h1 className="text-3xl font-bold text-gray-800">{t('projects')}</h1>
                    {isLoading && (
                        <div className="ml-4 flex items-center text-blue-600">
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            <span className="text-sm">
                                {loadingOperation === 'create' && 'Création...'}
                                {loadingOperation === 'update' && 'Mise à jour...'}
                                {loadingOperation === 'delete' && 'Suppression...'}
                                {!loadingOperation && 'Chargement...'}
                            </span>
                        </div>
                    )}
                </div>
                {canManage && (
                    <button
                        onClick={() => handleOpenForm()}
                        disabled={isLoading}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        {t('create_new_project')}
                    </button>
                )}
            </div>

            {/* Section Charge de travail de l'équipe */}
            {teamWorkload.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('team_workload')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {teamWorkload.map(member => (
                            <div key={member.id} className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                                        {member.fullName?.charAt(0) || member.email?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{member.fullName || member.email}</h3>
                                        <p className="text-sm text-gray-500">{t(member.role)}</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{t('projects')}</span>
                                        <span className="font-medium">{member.totalProjects} {t('projects')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{t('active_projects')}</span>
                                        <span className="font-medium">{member.projectCount} {t('active')}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">{t('estimated_hours')}</span>
                                        <span className="font-medium text-blue-600">{member.estimatedHours}h</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map(project => (
                        <div key={project.id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-gray-800 truncate">{project.title}</h3>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusStyles[project.status]}`}>
                                        {t(project.status.toLowerCase().replace(' ', '_'))}
                                    </span>
                                </div>
                                
                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{project.description}</p>
                                
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <i className="fas fa-calendar mr-2"></i>
                                        <span>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : t('no_due_date')}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <i className="fas fa-users mr-2"></i>
                                        <span>{project.team.length} {t('team_members')}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <i className="fas fa-clock mr-2"></i>
                                        <span>Charge de travail: {project.team.length > 0 ? 'Assignée' : 'Non assignée'}</span>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <button
                                        onClick={() => setSelectedProject(project)}
                                        disabled={isLoading}
                                        className="text-blue-600 hover:text-blue-800 font-medium text-sm disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {t('view_details')}
                                    </button>
                                    {canManage && (
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleOpenForm(project)}
                                                disabled={isLoading}
                                                className="text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => setProjectToDelete(project)}
                                                disabled={isLoading}
                                                className="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 px-4 bg-white mt-8 rounded-lg shadow-md">
                    <i className="fas fa-folder-open fa-4x text-gray-400"></i>
                    <h3 className="mt-6 text-xl font-semibold text-gray-800">Aucun projet créé pour le moment</h3>
                    <p className="mt-2 text-gray-600">Commencez par créer votre premier projet pour organiser votre travail</p>
                    {canManage && (
                        <button 
                            onClick={() => setFormModalOpen(true)}
                            className="mt-6 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Créer un nouveau projet
                        </button>
                    )}
                </div>
            )}

            {/* Modals */}
            {isFormModalOpen && (
                <ProjectFormModal
                    project={editingProject}
                    users={users}
                    onClose={() => {
                        setFormModalOpen(false);
                        setEditingProject(null);
                    }}
                    onSave={handleSaveProject}
                />
            )}

            {selectedProject && (
                <ProjectDetailModal
                    project={selectedProject}
                    onClose={() => setSelectedProject(null)}
                    onUpdateProject={onUpdateProject}
                    onDeleteProject={onDeleteProject}
                    onAddTimeLog={onAddTimeLog}
                    timeLogs={timeLogs}
                />
            )}

            {projectToDelete && (
                <ConfirmationModal
                    title={t('delete_project')}
                    message={t('confirm_delete_message')}
                    onConfirm={handleDeleteProject}
                    onCancel={() => setProjectToDelete(null)}
                />
            )}
        </div>
    );
};

export default Projects;