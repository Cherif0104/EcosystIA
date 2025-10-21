import React, { useState, useEffect } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Project, TimeLog } from '../types';
import LogTimeModal from './LogTimeModal';
import ConfirmationModal from './common/ConfirmationModal';

interface ProjectDetailPageProps {
    project: Project;
    onClose: () => void;
    onUpdateProject: (project: Project) => void;
    onDeleteProject: (projectId: string) => void;
    onAddTimeLog: (log: Omit<TimeLog, 'id' | 'userId'>) => void;
    timeLogs: TimeLog[];
}

const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
    project,
    onClose,
    onUpdateProject,
    onDeleteProject,
    onAddTimeLog,
    timeLogs
}) => {
    const { t } = useLocalization();
    const { user: currentUser } = useAuth();
    const [currentProject, setCurrentProject] = useState(project);
    const [activeTab, setActiveTab] = useState<'tasks' | 'risks' | 'report'>('tasks');
    const [isLogTimeModalOpen, setLogTimeModalOpen] = useState(false);
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingTasks, setPendingTasks] = useState<any[]>([]);
    const [pendingRisks, setPendingRisks] = useState<any[]>([]);
    const [hasPendingChanges, setHasPendingChanges] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<string>('');
    const [taskSummary, setTaskSummary] = useState<string>('');
    const [savedReports, setSavedReports] = useState<any[]>([]);
    const [savedTaskSummaries, setSavedTaskSummaries] = useState<any[]>([]);

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

    const totalLoggedHours = projectTimeLogs.reduce((sum, log) => sum + log.hours, 0);

    const handleUpdateTask = (taskId: string, updates: any) => {
        const updatedTasks = (currentProject.tasks || []).map(task =>
            task.id === taskId ? { ...task, ...updates } : task
        );
        
        const updatedProject = {
            ...currentProject,
            tasks: updatedTasks
        };
        
        setCurrentProject(updatedProject);
        onUpdateProject(updatedProject);
    };

    const handleDeleteTask = (taskId: string) => {
        const updatedTasks = (currentProject.tasks || []).filter(task => task.id !== taskId);
        const updatedProject = { ...currentProject, tasks: updatedTasks };
        setCurrentProject(updatedProject);
        onUpdateProject(updatedProject);
    };

    const handleUpdateRisk = (riskId: string, updates: any) => {
        const updatedRisks = (currentProject.risks || []).map(risk =>
            risk.id === riskId ? { ...risk, ...updates } : risk
        );
        
        const updatedProject = {
            ...currentProject,
            risks: updatedRisks
        };
        
        setCurrentProject(updatedProject);
        onUpdateProject(updatedProject);
    };

    const handleDeleteRisk = (riskId: string) => {
        const updatedRisks = (currentProject.risks || []).filter(risk => risk.id !== riskId);
        const updatedProject = { ...currentProject, risks: updatedRisks };
        setCurrentProject(updatedProject);
        onUpdateProject(updatedProject);
    };

    const getRiskLevel = (likelihood: string, impact: string) => {
        if (likelihood === 'High' && impact === 'High') return 'High';
        if (likelihood === 'High' || impact === 'High') return 'Medium';
        return 'Low';
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

            // Stocker les risques générés temporairement
            setPendingRisks(aiRisks);
            setHasPendingChanges(true);
            setIsLoading(false);
        }, 2500);
    };

    const handleSavePendingRisks = async () => {
        if (pendingRisks.length > 0) {
            const updatedProject = {
                ...currentProject,
                risks: [...(currentProject.risks || []), ...pendingRisks]
            };
            
            setCurrentProject(updatedProject);
            await onUpdateProject(updatedProject);
            
            // Nettoyer les données temporaires
            setPendingRisks([]);
            setHasPendingChanges(false);
        }
    };

    const handleCancelPendingRisks = () => {
        setPendingRisks([]);
        setHasPendingChanges(false);
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

            // Stocker le résumé dans l'état pour l'afficher dans l'interface
            const summaryText = `📊 RÉSUMÉ DES TÂCHES - ${summary.projectTitle}

✅ Tâches terminées: ${summary.completedTasks}/${summary.totalTasks} (${summary.progressPercentage}%)
🔄 Tâches en cours: ${summary.inProgressTasks}
📋 Tâches à faire: ${summary.todoTasks}
⚠️ Tâches en retard: ${summary.overdueTasks}

⏱️ Heures estimées: ${summary.totalEstimatedHours}h
⏱️ Heures enregistrées: ${summary.totalLoggedHours}h

📅 Résumé généré le: ${summary.generatedAt}`;

            setTaskSummary(summaryText);
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

            // Stocker le rapport dans l'état pour l'afficher dans l'interface
            const reportText = `📋 RAPPORT D'ÉTAT - ${report.projectTitle}

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

📅 Rapport généré le: ${report.generatedAt}`;

            setGeneratedReport(reportText);
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
                    assignee: currentProject.team[2] || currentProject.team[0],
                    estimatedHours: 0,
                    loggedHours: 0
                }
            ];

            // Stocker les tâches générées temporairement
            setPendingTasks(aiTasks);
            setHasPendingChanges(true);
            setIsLoading(false);
        }, 2000);
    };

    const handleSavePendingTasks = async () => {
        if (pendingTasks.length > 0) {
            const updatedProject = {
                ...currentProject,
                tasks: [...(currentProject.tasks || []), ...pendingTasks]
            };
            
            setCurrentProject(updatedProject);
            await onUpdateProject(updatedProject);
            
            // Nettoyer les données temporaires
            setPendingTasks([]);
            setHasPendingChanges(false);
        }
    };

    const handleCancelPendingTasks = () => {
        setPendingTasks([]);
        setHasPendingChanges(false);
    };

    // Fonctions pour la gestion des rapports
    const handleSaveReport = () => {
        if (generatedReport) {
            const newReport = {
                id: `report-${Date.now()}`,
                title: `Rapport d'état - ${new Date().toLocaleDateString('fr-FR')}`,
                content: generatedReport,
                createdAt: new Date().toLocaleString('fr-FR'),
                type: 'status_report'
            };
            setSavedReports(prev => [newReport, ...prev]);
            setGeneratedReport('');
        }
    };

    const handleSaveTaskSummary = () => {
        if (taskSummary) {
            const newSummary = {
                id: `summary-${Date.now()}`,
                title: `Résumé des tâches - ${new Date().toLocaleDateString('fr-FR')}`,
                content: taskSummary,
                createdAt: new Date().toLocaleString('fr-FR'),
                type: 'task_summary'
            };
            setSavedTaskSummaries(prev => [newSummary, ...prev]);
            setTaskSummary('');
        }
    };

    const handleDeleteReport = (reportId: string) => {
        setSavedReports(prev => prev.filter(report => report.id !== reportId));
    };

    const handleDeleteTaskSummary = (summaryId: string) => {
        setSavedTaskSummaries(prev => prev.filter(summary => summary.id !== summaryId));
    };

    const handleExportToPDF = (content: string, title: string) => {
        // Simulation d'export PDF - dans une vraie app, vous utiliseriez une librairie comme jsPDF
        const element = document.createElement('a');
        const file = new Blob([content], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header avec bouton de retour */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={onClose}
                                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
                            >
                                <i className="fas fa-arrow-left mr-2"></i>
                                Retour aux projets
                            </button>
                            <h1 className="text-2xl font-bold text-gray-900">{currentProject.title}</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                                Statut: <span className="font-medium">{currentProject.status}</span>
                            </span>
                            <span className="text-sm text-gray-500">
                                Échéance: <span className="font-medium">
                                    {currentProject.dueDate ? new Date(currentProject.dueDate).toLocaleDateString('fr-FR') : 'Non définie'}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenu principal */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar avec informations du projet */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du projet</h2>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={currentProject.description || ''}
                                        onChange={(e) => {
                                            const updatedProject = { ...currentProject, description: e.target.value };
                                            setCurrentProject(updatedProject);
                                            onUpdateProject(updatedProject);
                                        }}
                                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        rows={3}
                                        placeholder="Description du projet"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Membres de l'équipe</label>
                                    <div className="mt-2 space-y-2">
                                        {currentProject.team.map(member => (
                                            <div key={member.id} className="flex items-center space-x-2">
                                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                                    {(member.fullName || member.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {member.fullName || member.email}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{member.role}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Suivi du temps</label>
                                    <p className="mt-1 text-sm text-gray-900">{totalLoggedHours}h enregistrées</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-6 space-y-3">
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
                        </div>
                    </div>

                    {/* Contenu principal avec onglets */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow">
                            {/* Onglets */}
                            <div className="border-b border-gray-200">
                                <nav className="-mb-px flex space-x-8 px-6">
                                    <button
                                        onClick={() => setActiveTab('tasks')}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'tasks'
                                                ? 'border-green-500 text-green-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Tâches ({(currentProject.tasks || []).length})
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('risks')}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'risks'
                                                ? 'border-green-500 text-green-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Gestion des risques
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('report')}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                            activeTab === 'report'
                                                ? 'border-green-500 text-green-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        Générer un rapport d'état
                                    </button>
                                </nav>
                            </div>

                            {/* Contenu des onglets */}
                            <div className="p-6">
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
                                                        {/* Afficher les tâches existantes */}
                                                        {(currentProject.tasks || []).map(task => {
                                                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                                                            return (
                                                            <tr key={task.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={task.status === 'Completed'}
                                                                        onChange={(e) => {
                                                                            const newStatus = e.target.checked ? 'Completed' : 'To Do';
                                                                            handleUpdateTask(task.id, { status: newStatus });
                                                                        }}
                                                                        className="rounded"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    <div className="flex items-center">
                                                        <input
                                                            type="text"
                                                            value={task.text}
                                                            onChange={(e) => handleUpdateTask(task.id, { text: e.target.value })}
                                                            className="w-full min-w-64 text-sm border border-gray-300 rounded px-3 py-2"
                                                            placeholder="Nom de la tâche"
                                                        />
                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center space-x-2">
                                                                        <select
                                                                            value={task.status}
                                                                            onChange={(e) => handleUpdateTask(task.id, { status: e.target.value })}
                                                                            className="text-xs border border-gray-300 rounded px-2 py-1"
                                                                        >
                                                                            <option value="To Do">À faire</option>
                                                                            <option value="In Progress">En cours</option>
                                                                            <option value="Completed">Terminé</option>
                                                                        </select>
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center space-x-2">
                                                                        <input
                                                                            type="date"
                                                                            value={task.dueDate || ''}
                                                                            onChange={(e) => handleUpdateTask(task.id, { dueDate: e.target.value })}
                                                                            className="text-xs border border-gray-300 rounded px-2 py-1"
                                                                        />
                                                                        {isOverdue && <span className="ml-2 text-xs text-red-600">En retard</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <input
                                                                        type="number"
                                                                        value={task.estimatedHours || 0}
                                                                        onChange={(e) => handleUpdateTask(task.id, { estimatedHours: Number(e.target.value) })}
                                                                        className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
                                                                        min="0"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <input
                                                                        type="number"
                                                                        value={task.loggedHours || 0}
                                                                        onChange={(e) => handleUpdateTask(task.id, { loggedHours: Number(e.target.value) })}
                                                                        className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
                                                                        min="0"
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
                                                        
                                                        {/* Afficher les tâches temporaires générées par l'IA */}
                                                        {pendingTasks.map(task => {
                                                            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Completed';
                                                            return (
                                                            <tr key={task.id} className="hover:bg-gray-50 bg-yellow-50 border-l-4 border-yellow-400">
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={task.status === 'Completed'}
                                                                        onChange={(e) => {
                                                                            const newStatus = e.target.checked ? 'Completed' : 'To Do';
                                                                            const updatedTasks = pendingTasks.map(t => 
                                                                                t.id === task.id ? { ...t, status: newStatus } : t
                                                                            );
                                                                            setPendingTasks(updatedTasks);
                                                                        }}
                                                                        className="rounded"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <input
                                                                        type="text"
                                                                        value={task.text}
                                                                        onChange={(e) => {
                                                                            const updatedTasks = pendingTasks.map(t => 
                                                                                t.id === task.id ? { ...t, text: e.target.value } : t
                                                                            );
                                                                            setPendingTasks(updatedTasks);
                                                                        }}
                                                                        className="w-full min-w-64 text-sm border border-gray-300 rounded px-3 py-2 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                        placeholder="Nom de la tâche"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <select
                                                                        value={task.status}
                                                                        onChange={(e) => {
                                                                            const updatedTasks = pendingTasks.map(t => 
                                                                                t.id === task.id ? { ...t, status: e.target.value } : t
                                                                            );
                                                                            setPendingTasks(updatedTasks);
                                                                        }}
                                                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                                                    >
                                                                        <option value="To Do">À faire</option>
                                                                        <option value="In Progress">En cours</option>
                                                                        <option value="Completed">Terminé</option>
                                                                    </select>
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <input
                                                                        type="date"
                                                                        value={task.dueDate || ''}
                                                                        onChange={(e) => {
                                                                            const updatedTasks = pendingTasks.map(t => 
                                                                                t.id === task.id ? { ...t, dueDate: e.target.value } : t
                                                                            );
                                                                            setPendingTasks(updatedTasks);
                                                                        }}
                                                                        className="text-xs border border-gray-300 rounded px-2 py-1"
                                                                    />
                                                                    {isOverdue && <span className="ml-2 text-xs text-red-600">En retard</span>}
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <input
                                                                        type="number"
                                                                        value={task.estimatedHours || 0}
                                                                        onChange={(e) => {
                                                                            const updatedTasks = pendingTasks.map(t => 
                                                                                t.id === task.id ? { ...t, estimatedHours: Number(e.target.value) } : t
                                                                            );
                                                                            setPendingTasks(updatedTasks);
                                                                        }}
                                                                        className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
                                                                        min="0"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <input
                                                                        type="number"
                                                                        value={task.loggedHours || 0}
                                                                        onChange={(e) => {
                                                                            const updatedTasks = pendingTasks.map(t => 
                                                                                t.id === task.id ? { ...t, loggedHours: Number(e.target.value) } : t
                                                                            );
                                                                            setPendingTasks(updatedTasks);
                                                                        }}
                                                                        className="w-16 text-xs border border-gray-300 rounded px-2 py-1"
                                                                        min="0"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <select
                                                                        value={task.priority}
                                                                        onChange={(e) => {
                                                                            const updatedTasks = pendingTasks.map(t => 
                                                                                t.id === task.id ? { ...t, priority: e.target.value } : t
                                                                            );
                                                                            setPendingTasks(updatedTasks);
                                                                        }}
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
                                                                                const updatedTasks = pendingTasks.map(t => 
                                                                                    t.id === task.id ? { ...t, assignee } : t
                                                                                );
                                                                                setPendingTasks(updatedTasks);
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
                                                
                                                {/* Boutons CTA pour les tâches temporaires */}
                                                {pendingTasks.length > 0 && (
                                                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <i className="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                                                                <span className="text-sm text-yellow-800">
                                                                    {pendingTasks.length} tâche(s) générée(s) par l'IA en attente de sauvegarde
                                                                </span>
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={handleCancelPendingTasks}
                                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                                >
                                                                    Annuler
                                                                </button>
                                                                <button
                                                                    onClick={handleSavePendingTasks}
                                                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                                                                >
                                                                    Sauvegarder
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
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
                                                        {/* Afficher les risques existants */}
                                                        {(currentProject.risks || []).map(risk => {
                                                            const riskLevel = getRiskLevel(risk.likelihood, risk.impact);
                                                            return (
                                                            <tr key={risk.id} className="hover:bg-gray-50">
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                                    <div className="flex items-center">
                                                                <textarea
                                                                    value={risk.description}
                                                                    onChange={(e) => handleUpdateRisk(risk.id, { description: e.target.value })}
                                                                    className="w-full min-w-80 text-sm border border-gray-300 rounded px-3 py-2"
                                                                    rows={2}
                                                                    placeholder="Description du risque"
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
                                                                    <button
                                                                            onClick={() => handleDeleteRisk(risk.id)}
                                                                        className="text-red-600 hover:text-red-800"
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                            );
                                                        })}
                                                        
                                                        {/* Afficher les risques temporaires générés par l'IA */}
                                                        {pendingRisks.map(risk => {
                                                            const riskLevel = getRiskLevel(risk.likelihood, risk.impact);
                                                            return (
                                                            <tr key={risk.id} className="hover:bg-gray-50 bg-yellow-50 border-l-4 border-yellow-400">
                                                                <td className="px-4 py-4">
                                                                    <textarea
                                                                        value={risk.description}
                                                                        onChange={(e) => {
                                                                            const updatedRisks = pendingRisks.map(r => 
                                                                                r.id === risk.id ? { ...r, description: e.target.value } : r
                                                                            );
                                                                            setPendingRisks(updatedRisks);
                                                                        }}
                                                                        className="w-full min-w-80 text-sm border border-gray-300 rounded px-3 py-2 resize-none"
                                                                        rows={2}
                                                                        placeholder="Description du risque"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap">
                                                                    <select
                                                                        value={risk.likelihood}
                                                                        onChange={(e) => {
                                                                            const updatedRisks = pendingRisks.map(r => 
                                                                                r.id === risk.id ? { ...r, likelihood: e.target.value } : r
                                                                            );
                                                                            setPendingRisks(updatedRisks);
                                                                        }}
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
                                                                        onChange={(e) => {
                                                                            const updatedRisks = pendingRisks.map(r => 
                                                                                r.id === risk.id ? { ...r, impact: e.target.value } : r
                                                                            );
                                                                            setPendingRisks(updatedRisks);
                                                                        }}
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
                                                                            onChange={(e) => {
                                                                                const updatedRisks = pendingRisks.map(r => 
                                                                                    r.id === risk.id ? { ...r, mitigationStrategy: e.target.value } : r
                                                                                );
                                                                                setPendingRisks(updatedRisks);
                                                                            }}
                                                                            className="w-full text-sm border border-gray-300 rounded px-3 py-2 resize-none"
                                                                            rows={2}
                                                                            placeholder="Description du risque"
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    <button
                                                                        onClick={() => {
                                                                            const updatedRisks = pendingRisks.filter(r => r.id !== risk.id);
                                                                            setPendingRisks(updatedRisks);
                                                                        }}
                                                                        className="text-red-600 hover:text-red-800"
                                                                        title="Supprimer ce risque temporaire"
                                                                    >
                                                                        <i className="fas fa-times"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                            );
                                                        })}
                                                        
                                                        {(!currentProject.risks || currentProject.risks.length === 0) && pendingRisks.length === 0 && (
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
                                                
                                                {/* Boutons CTA pour les risques temporaires */}
                                                {pendingRisks.length > 0 && (
                                                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <i className="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                                                                <span className="text-sm text-yellow-800">
                                                                    {pendingRisks.length} risque(s) généré(s) par l'IA en attente de sauvegarde
                                                                </span>
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={handleCancelPendingRisks}
                                                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                                                >
                                                                    Annuler
                                                                </button>
                                                                <button
                                                                    onClick={handleSavePendingRisks}
                                                                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                                                                >
                                                                    Sauvegarder
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {activeTab === 'report' && (
                                    <div className="space-y-6">
                                        {!generatedReport && !taskSummary && savedReports.length === 0 && savedTaskSummaries.length === 0 && (
                                            <div className="text-center py-8 text-gray-500">
                                                <i className="fas fa-file-alt text-6xl text-gray-300 mb-4"></i>
                                                <p className="text-lg">Générer un rapport d'état ou un résumé des tâches.</p>
                                            </div>
                                        )}
                                        
                                        {/* Rapport d'état généré */}
                                        {generatedReport && (
                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                        <i className="fas fa-file-alt text-blue-600 mr-2"></i>
                                                        Rapport d'état généré
                                                    </h3>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleSaveReport()}
                                                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                            title="Sauvegarder le rapport"
                                                        >
                                                            <i className="fas fa-save mr-1"></i>Sauvegarder
                                                        </button>
                                                        <button
                                                            onClick={() => handleExportToPDF(generatedReport, 'rapport_etat')}
                                                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                                            title="Exporter en PDF"
                                                        >
                                                            <i className="fas fa-file-pdf mr-1"></i>PDF
                                                        </button>
                                                        <button
                                                            onClick={() => setGeneratedReport('')}
                                                            className="text-gray-400 hover:text-gray-600"
                                                            title="Effacer le rapport"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                                                        {generatedReport}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Résumé des tâches généré */}
                                        {taskSummary && (
                                            <div className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                        <i className="fas fa-list text-green-600 mr-2"></i>
                                                        Résumé des tâches généré
                                                    </h3>
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleSaveTaskSummary()}
                                                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                            title="Sauvegarder le résumé"
                                                        >
                                                            <i className="fas fa-save mr-1"></i>Sauvegarder
                                                        </button>
                                                        <button
                                                            onClick={() => handleExportToPDF(taskSummary, 'resume_taches')}
                                                            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                                            title="Exporter en PDF"
                                                        >
                                                            <i className="fas fa-file-pdf mr-1"></i>PDF
                                                        </button>
                                                        <button
                                                            onClick={() => setTaskSummary('')}
                                                            className="text-gray-400 hover:text-gray-600"
                                                            title="Effacer le résumé"
                                                        >
                                                            <i className="fas fa-times"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-lg">
                                                    <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                                                        {taskSummary}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}

                                        {/* Rapports sauvegardés */}
                                        {savedReports.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                    <i className="fas fa-archive text-blue-600 mr-2"></i>
                                                    Rapports sauvegardés ({savedReports.length})
                                                </h3>
                                                {savedReports.map(report => (
                                                    <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h4 className="font-medium text-gray-900">{report.title}</h4>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleExportToPDF(report.content, report.title)}
                                                                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                                                    title="Exporter en PDF"
                                                                >
                                                                    <i className="fas fa-file-pdf mr-1"></i>PDF
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteReport(report.id)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                    title="Supprimer le rapport"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mb-2">Créé le: {report.createdAt}</p>
                                                        <div className="bg-gray-50 p-3 rounded text-sm">
                                                            <pre className="whitespace-pre-wrap text-gray-700 font-mono text-xs">
                                                                {report.content.substring(0, 200)}...
                                                            </pre>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Résumés sauvegardés */}
                                        {savedTaskSummaries.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                    <i className="fas fa-archive text-green-600 mr-2"></i>
                                                    Résumés sauvegardés ({savedTaskSummaries.length})
                                                </h3>
                                                {savedTaskSummaries.map(summary => (
                                                    <div key={summary.id} className="bg-white border border-gray-200 rounded-lg p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h4 className="font-medium text-gray-900">{summary.title}</h4>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleExportToPDF(summary.content, summary.title)}
                                                                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                                                    title="Exporter en PDF"
                                                                >
                                                                    <i className="fas fa-file-pdf mr-1"></i>PDF
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTaskSummary(summary.id)}
                                                                    className="text-red-600 hover:text-red-800"
                                                                    title="Supprimer le résumé"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mb-2">Créé le: {summary.createdAt}</p>
                                                        <div className="bg-gray-50 p-3 rounded text-sm">
                                                            <pre className="whitespace-pre-wrap text-gray-700 font-mono text-xs">
                                                                {summary.content.substring(0, 200)}...
                                                            </pre>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            {isLogTimeModalOpen && currentUser && (
                <LogTimeModal
                    isOpen={isLogTimeModalOpen}
                    onClose={() => setLogTimeModalOpen(false)}
                    onSave={handleSaveTimeLog}
                    entityType="project"
                    entityId={currentProject.id}
                    entityName={currentProject.title}
                />
            )}

            {isDeleteModalOpen && (
                <ConfirmationModal
                    title="Supprimer le projet"
                    message={`Êtes-vous sûr de vouloir supprimer le projet "${currentProject.title}" ? Cette action est irréversible.`}
                    onConfirm={() => {
                        onDeleteProject(currentProject.id);
                        onClose();
                    }}
                    onCancel={() => setDeleteModalOpen(false)}
                    confirmText="Supprimer"
                    cancelText="Annuler"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            )}
        </div>
    );
};

export default ProjectDetailPage;
