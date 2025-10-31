import React, { useState, useMemo, useEffect } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Project, Objective, KeyResult } from '../types';
import { generateOKRs } from '../services/geminiService';
import ConfirmationModal from './common/ConfirmationModal';

// Composant modal pour création/modification (temporaire, sera remplacé par GoalCreatePage)
const ObjectiveFormModal: React.FC<{
    objective: Objective | null;
    projectId: string | null;
    projects: Project[];
    onClose: () => void;
    onSave: (objective: Objective | Omit<Objective, 'id'>) => Promise<void>;
}> = ({ objective, projectId, projects, onClose, onSave }) => {
    const { t } = useLocalization();
    const isEditMode = objective !== null;
    const [selectedProjectId, setSelectedProjectId] = useState<string>(projectId || projects[0]?.id?.toString() || '');

    const [formData, setFormData] = useState<Omit<Objective, 'id'>>(
        objective || {
            title: '',
            projectId: selectedProjectId,
            keyResults: [{ id: `kr-${Date.now()}`, title: '', target: 100, current: 0, unit: '%' }]
        }
    );

    useEffect(() => {
        if (objective) {
            setFormData(objective);
            setSelectedProjectId(objective.projectId);
        } else {
            setFormData({
                title: '',
                projectId: selectedProjectId,
                keyResults: [{ id: `kr-${Date.now()}`, title: '', target: 100, current: 0, unit: '%' }]
            });
        }
    }, [objective, selectedProjectId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, title: e.target.value }));
    };

    const handleKrChange = (index: number, field: string, value: string | number) => {
        const newKrs = [...formData.keyResults];
        (newKrs[index] as any)[field] = value;
        setFormData(prev => ({...prev, keyResults: newKrs}));
    };

    const addKr = () => {
        const newKr: KeyResult = { id: `kr-${Date.now()}`, title: '', target: 100, current: 0, unit: '%' };
        setFormData(prev => ({...prev, keyResults: [...prev.keyResults, newKr]}));
    };
    
    const removeKr = (index: number) => {
        setFormData(prev => ({...prev, keyResults: prev.keyResults.filter((_, i) => i !== index)}));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = {
            ...formData,
            projectId: selectedProjectId,
            ...(isEditMode && { id: objective!.id })
        };
        await onSave(dataToSave as Objective);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 border-b">
                        <h2 className="text-xl font-bold">{isEditMode ? t('edit_objective') : t('create_objective')}</h2>
                    </div>
                    <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                        {!isEditMode && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Projet</label>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => {
                                        setSelectedProjectId(e.target.value);
                                        setFormData(prev => ({...prev, projectId: e.target.value}));
                                    }}
                                    className="w-full p-2 border rounded-md"
                                    required
                                >
                                    <option value="">Sélectionner un projet</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id.toString()}>{p.title}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('objective')}</label>
                            <input type="text" value={formData.title} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required />
                        </div>
                        <hr />
                        <h3 className="text-lg font-semibold">{t('key_results')}</h3>
                        <div className="space-y-3">
                            {formData.keyResults.map((kr, index) => (
                                <div key={kr.id} className="p-3 border rounded-md bg-gray-50 space-y-2">
                                    <div className="flex items-center">
                                        <input placeholder={t('key_results')} value={kr.title} onChange={e => handleKrChange(index, 'title', e.target.value)} className="flex-grow p-1 border-b" />
                                        <button type="button" onClick={() => removeKr(index)} className="ml-2 text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <span>{t('current_value')}: <input type="number" value={kr.current} onChange={e => handleKrChange(index, 'current', Number(e.target.value))} className="w-20 p-1 border-b"/></span>
                                        <span>{t('target')}: <input type="number" value={kr.target} onChange={e => handleKrChange(index, 'target', Number(e.target.value))} className="w-20 p-1 border-b"/></span>
                                        <span>{t('unit')}: <input value={kr.unit} onChange={e => handleKrChange(index, 'unit', e.target.value)} className="w-20 p-1 border-b"/></span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addKr} className="text-sm text-emerald-600 hover:text-emerald-800"><i className="fas fa-plus mr-1"></i> {t('add_key_result')}</button>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">{t('cancel')}</button>
                        <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700">{t('save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface GoalsProps {
    projects: Project[];
    objectives: Objective[];
    setObjectives: (objectives: Objective[]) => void;
    onAddObjective: (objective: Omit<Objective, 'id'>) => Promise<void>;
    onUpdateObjective: (objective: Objective) => Promise<void>;
    onDeleteObjective: (objectiveId: string) => Promise<void>;
    isLoading?: boolean;
    loadingOperation?: string | null;
    isDataLoaded?: boolean;
}

const Goals: React.FC<GoalsProps> = ({
    projects,
    objectives,
    setObjectives,
    onAddObjective,
    onUpdateObjective,
    onDeleteObjective,
    isLoading = false,
    loadingOperation = null,
    isDataLoaded = true
}) => {
    const { t } = useLocalization();
    const { user: currentUser } = useAuth();
    
    // États pour recherche, filtres et vue
    const [searchQuery, setSearchQuery] = useState('');
    const [projectFilter, setProjectFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'title' | 'progress'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
    
    // États pour modals et édition
    const [isCreatePageOpen, setIsCreatePageOpen] = useState(false);
    const [isDetailPageOpen, setIsDetailPageOpen] = useState(false);
    const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
    const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
    const [objectiveToDelete, setObjectiveToDelete] = useState<Objective | null>(null);
    const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
    const [suggestedOKRs, setSuggestedOKRs] = useState<Objective[]>([]);
    const [isGeneratingOKRs, setIsGeneratingOKRs] = useState(false);
    const [selectedProjectForOKRs, setSelectedProjectForOKRs] = useState<Project | null>(null);

    const canManage = currentUser?.role === 'administrator' || 
                      currentUser?.role === 'manager' || 
                      currentUser?.role === 'super_administrator';

    // Calculer la progression globale d'un objectif
    const calculateOverallProgress = (keyResults: KeyResult[]): number => {
        if (keyResults.length === 0) return 0;
        const totalProgress = keyResults.reduce((sum, kr) => {
            if (kr.target === 0) return sum;
            return sum + Math.min((kr.current / kr.target), 1);
        }, 0);
        return Math.min((totalProgress / keyResults.length) * 100, 100);
    };

    // Filtrage et tri
    const filteredObjectives = useMemo(() => {
        let filtered = objectives.filter(objective => {
            // Filtre de recherche
            const matchesSearch = searchQuery === '' || 
                objective.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                objective.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                objective.keyResults.some(kr => 
                    kr.title.toLowerCase().includes(searchQuery.toLowerCase())
                );

            // Filtre par projet
            const matchesProject = projectFilter === 'all' || objective.projectId === projectFilter;

            // Filtre par statut
            const matchesStatus = statusFilter === 'all' || objective.status === statusFilter;

            return matchesSearch && matchesProject && matchesStatus;
        });

        // Tri
        filtered.sort((a, b) => {
            let compareValue = 0;
            
            switch (sortBy) {
                case 'title':
                    compareValue = a.title.localeCompare(b.title);
                    break;
                case 'progress':
                    const progressA = calculateOverallProgress(a.keyResults);
                    const progressB = calculateOverallProgress(b.keyResults);
                    compareValue = progressA - progressB;
                    break;
                case 'date':
                default:
                    const dateA = a.endDate ? new Date(a.endDate).getTime() : 0;
                    const dateB = b.endDate ? new Date(b.endDate).getTime() : 0;
                    compareValue = dateA - dateB;
                    break;
            }

            return sortOrder === 'asc' ? compareValue : -compareValue;
        });

        return filtered;
    }, [objectives, searchQuery, projectFilter, statusFilter, sortBy, sortOrder]);

    // Calculer les métriques globales
    const totalObjectives = objectives.length;
    const objectivesInProgress = objectives.filter(o => {
        const progress = calculateOverallProgress(o.keyResults);
        return progress > 0 && progress < 100;
    }).length;
    const completedObjectives = objectives.filter(o => {
        const progress = calculateOverallProgress(o.keyResults);
        return progress >= 100;
    }).length;
    const totalKeyResults = objectives.reduce((sum, o) => sum + o.keyResults.length, 0);
    const avgProgress = objectives.length > 0
        ? Math.round(objectives.reduce((sum, o) => sum + calculateOverallProgress(o.keyResults), 0) / objectives.length)
        : 0;

    // Gestion CRUD
    const handleSaveObjective = async (objectiveData: Objective | Omit<Objective, 'id'>) => {
        const isEditMode = editingObjective !== null || ('id' in objectiveData && objectiveData.id !== undefined);

        if (isEditMode) {
            const objectiveId = editingObjective?.id || (objectiveData as Objective).id;
            if (!objectiveId) {
                alert('Erreur: Impossible de mettre à jour l\'objectif. ID manquant.');
                return;
            }
            
            const objectiveToUpdate: Objective = {
                ...editingObjective!,
                ...objectiveData,
                id: objectiveId,
                keyResults: (objectiveData as Objective).keyResults || editingObjective?.keyResults || [],
                progress: calculateOverallProgress((objectiveData as Objective).keyResults || editingObjective?.keyResults || [])
            };
            
            await onUpdateObjective(objectiveToUpdate);
        } else {
            await onAddObjective(objectiveData as Omit<Objective, 'id'>);
        }
        
        setIsCreatePageOpen(false);
        setEditingObjective(null);
    };

    const handleDeleteObjective = async () => {
        if (objectiveToDelete) {
            await onDeleteObjective(objectiveToDelete.id);
            setObjectiveToDelete(null);
        }
    };

    const handleGenerateOKRs = async (project: Project) => {
        if (!project) return;
        
        setSelectedProjectForOKRs(project);
        setIsSuggestionModalOpen(true);
        setIsGeneratingOKRs(true);
        setSuggestedOKRs([]);

        try {
            const generated = await generateOKRs(project.description || '');
            const newObjectives: Objective[] = generated.map((obj: any, index: number) => ({
                id: `gen-obj-${Date.now()}-${index}`,
                projectId: project.id.toString(),
                title: obj.title,
                keyResults: obj.keyResults.map((kr: any, krIndex: number) => ({
                    id: `gen-kr-${Date.now()}-${krIndex}`,
                    title: kr.title,
                    target: kr.target,
                    current: 0,
                    unit: kr.unit || '%'
                })),
                progress: 0
            }));
            
            setSuggestedOKRs(newObjectives);
        } catch (error) {
            console.error('Erreur génération OKRs:', error);
            alert('Erreur lors de la génération des OKRs. Veuillez réessayer.');
        } finally {
            setIsGeneratingOKRs(false);
        }
    };

    const handleAddSuggestedOKRs = async (suggestions: Objective[]) => {
        for (const suggestion of suggestions) {
            await onAddObjective({
                ...suggestion,
                id: undefined as any
            } as Omit<Objective, 'id'>);
        }
        setIsSuggestionModalOpen(false);
        setSuggestedOKRs([]);
        setSelectedProjectForOKRs(null);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header moderne avec gradient */}
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2">{t('goals_okrs_title')}</h1>
                            <p className="text-emerald-50 text-sm">
                                Définissez et suivez vos objectifs et résultats clés (OKRs)
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {isLoading && (
                                <div className="flex items-center text-white">
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    <span className="text-sm">
                                        {loadingOperation === 'create' && 'Création...'}
                                        {loadingOperation === 'update' && 'Mise à jour...'}
                                        {loadingOperation === 'delete' && 'Suppression...'}
                                        {!loadingOperation && 'Chargement...'}
                                    </span>
                                </div>
                            )}
                            {canManage && projects.length > 0 && (
                                <button
                                    onClick={() => {
                                        setEditingObjective(null);
                                        setIsCreatePageOpen(true);
                                    }}
                                    disabled={isLoading}
                                    className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center transition-all shadow-md hover:shadow-lg"
                                >
                                    <i className="fas fa-plus mr-2"></i>
                                    {t('create_objective')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Section Métriques - Style Power BI */}
                {objectives.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Carte Objectifs totaux */}
                        <div className="bg-white rounded-xl shadow-lg border-l-4 border-blue-500 p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Objectifs totaux</p>
                                    <p className="text-3xl font-bold text-gray-900">{totalObjectives}</p>
                                </div>
                                <div className="bg-blue-100 rounded-full p-4">
                                    <i className="fas fa-bullseye text-blue-600 text-2xl"></i>
                                </div>
                            </div>
                        </div>

                        {/* Carte Objectifs en cours */}
                        <div className="bg-white rounded-xl shadow-lg border-l-4 border-emerald-500 p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">En cours</p>
                                    <p className="text-3xl font-bold text-gray-900">{objectivesInProgress}</p>
                                </div>
                                <div className="bg-emerald-100 rounded-full p-4">
                                    <i className="fas fa-play-circle text-emerald-600 text-2xl"></i>
                                </div>
                            </div>
                        </div>

                        {/* Carte Key Results */}
                        <div className="bg-white rounded-xl shadow-lg border-l-4 border-purple-500 p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Key Results</p>
                                    <p className="text-3xl font-bold text-gray-900">{totalKeyResults}</p>
                                </div>
                                <div className="bg-purple-100 rounded-full p-4">
                                    <i className="fas fa-tasks text-purple-600 text-2xl"></i>
                                </div>
                            </div>
                        </div>

                        {/* Carte Progression moyenne */}
                        <div className="bg-white rounded-xl shadow-lg border-l-4 border-orange-500 p-6 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Progression moyenne</p>
                                    <p className="text-3xl font-bold text-gray-900">{avgProgress}%</p>
                                </div>
                                <div className="bg-orange-100 rounded-full p-4">
                                    <i className="fas fa-chart-line text-orange-600 text-2xl"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Barre de recherche, filtres et sélecteur de vue */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Barre de recherche */}
                        <div className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Rechercher un objectif par titre, description ou Key Result..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                                />
                                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filtres */}
                        <div className="flex flex-wrap gap-3">
                            {/* Filtre par projet */}
                            {projects.length > 0 && (
                                <select
                                    value={projectFilter}
                                    onChange={(e) => setProjectFilter(e.target.value)}
                                    className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                >
                                    <option value="all">Tous les projets</option>
                                    {projects.map(project => (
                                        <option key={project.id} value={project.id.toString()}>
                                            {project.title}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Filtre par statut */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="active">Actif</option>
                                <option value="completed">Terminé</option>
                                <option value="cancelled">Annulé</option>
                            </select>

                            {/* Tri */}
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'date' | 'title' | 'progress')}
                                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            >
                                <option value="date">Trier par date</option>
                                <option value="title">Trier par titre</option>
                                <option value="progress">Trier par progression</option>
                            </select>

                            {/* Ordre de tri */}
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                                title={sortOrder === 'asc' ? 'Ordre croissant' : 'Ordre décroissant'}
                            >
                                <i className={`fas ${sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down'} mr-2`}></i>
                                {sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
                            </button>
                        </div>
                    </div>

                    {/* Sélecteur de vue */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-600">
                            {filteredObjectives.length} {filteredObjectives.length > 1 ? 'objectifs trouvés' : 'objectif trouvé'}
                            {searchQuery && (
                                <span className="ml-2">
                                    pour "{searchQuery}"
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 mr-2">Vue :</span>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === 'grid'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Vue en grille"
                            >
                                <i className="fas fa-th"></i>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === 'list'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Vue en liste"
                            >
                                <i className="fas fa-list"></i>
                            </button>
                            <button
                                onClick={() => setViewMode('compact')}
                                className={`p-2 rounded-lg transition-all ${
                                    viewMode === 'compact'
                                        ? 'bg-emerald-600 text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Vue compacte"
                            >
                                <i className="fas fa-grip-lines"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Liste des objectifs */}
                {filteredObjectives.length > 0 ? (
                    <>
                        {/* Vue Grille */}
                        {viewMode === 'grid' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredObjectives.map(objective => {
                                    const progress = calculateOverallProgress(objective.keyResults);
                                    const project = projects.find(p => p.id.toString() === objective.projectId);
                                    
                                    return (
                                        <div 
                                            key={objective.id} 
                                            className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group"
                                        >
                                            {/* Header de la carte avec gradient */}
                                            <div className={`bg-gradient-to-r ${
                                                progress >= 100 ? 'from-emerald-500 to-teal-500' :
                                                progress > 0 ? 'from-blue-500 to-cyan-500' :
                                                'from-gray-400 to-gray-500'
                                            } p-4 text-white`}>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-bold mb-1 truncate">{objective.title}</h3>
                                                        {project && (
                                                            <p className="text-xs text-white text-opacity-90 mt-1 truncate">
                                                                {project.title}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6">
                                                {/* Barre de progression */}
                                                <div className="mb-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-medium text-gray-600">Progression</span>
                                                        <span className="text-xs font-bold text-gray-900">{Math.round(progress)}%</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                
                                                {/* Key Results */}
                                                <div className="space-y-2 mb-6">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Results ({objective.keyResults.length})</p>
                                                    {objective.keyResults.slice(0, 3).map(kr => {
                                                        const krProgress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
                                                        return (
                                                            <div key={kr.id} className="text-sm">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-gray-700 truncate flex-1">{kr.title}</span>
                                                                    <span className="text-gray-500 ml-2 text-xs">{Math.round(krProgress)}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-100 rounded-full h-1">
                                                                    <div 
                                                                        className="bg-blue-500 h-1 rounded-full"
                                                                        style={{ width: `${Math.min(krProgress, 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {objective.keyResults.length > 3 && (
                                                        <p className="text-xs text-gray-500 text-center">
                                                            +{objective.keyResults.length - 3} autre(s)
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedObjective(objective);
                                                            setIsDetailPageOpen(true);
                                                        }}
                                                        disabled={isLoading}
                                                        className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm disabled:text-gray-400 disabled:cursor-not-allowed flex items-center transition-colors"
                                                    >
                                                        <i className="fas fa-eye mr-2"></i>
                                                        Voir détails
                                                    </button>
                                                    {canManage && (
                                                        <div className="flex space-x-3">
                                                            <button
                                                                onClick={() => {
                                                                    setEditingObjective(objective);
                                                                    setIsCreatePageOpen(true);
                                                                }}
                                                                disabled={isLoading}
                                                                className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors p-2 rounded hover:bg-blue-50"
                                                                title="Modifier"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                onClick={() => setObjectiveToDelete(objective)}
                                                                disabled={isLoading}
                                                                className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors p-2 rounded hover:bg-red-50"
                                                                title="Supprimer"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Vue Liste - À implémenter */}
                        {viewMode === 'list' && (
                            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                <div className="divide-y divide-gray-200">
                                    {filteredObjectives.map(objective => {
                                        const progress = calculateOverallProgress(objective.keyResults);
                                        const project = projects.find(p => p.id.toString() === objective.projectId);
                                        
                                        return (
                                            <div 
                                                key={objective.id} 
                                                className="p-6 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-4 mb-3">
                                                            <div className={`flex-shrink-0 w-1 h-16 rounded ${
                                                                progress >= 100 ? 'bg-emerald-500' :
                                                                progress > 0 ? 'bg-blue-500' :
                                                                'bg-gray-400'
                                                            }`}></div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-3 mb-2">
                                                                    <h3 className="text-lg font-bold text-gray-900 truncate">{objective.title}</h3>
                                                                    {project && (
                                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                                            {project.title}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {objective.description && (
                                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                                                                        {objective.description}
                                                                    </p>
                                                                )}
                                                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                                                    <div className="flex items-center">
                                                                        <i className="fas fa-tasks mr-2"></i>
                                                                        <span>{objective.keyResults.length} Key Result(s)</span>
                                                                    </div>
                                                                    <div className="flex items-center flex-1 min-w-48">
                                                                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                                                                            <div 
                                                                                className="bg-emerald-600 h-2 rounded-full transition-all"
                                                                                style={{ width: `${progress}%` }}
                                                                            ></div>
                                                                        </div>
                                                                        <span className="text-xs font-bold text-gray-700">{Math.round(progress)}%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 ml-4">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedObjective(objective);
                                                                setIsDetailPageOpen(true);
                                                            }}
                                                            disabled={isLoading}
                                                            className="text-emerald-600 hover:text-emerald-700 font-semibold text-sm disabled:text-gray-400 disabled:cursor-not-allowed flex items-center transition-colors px-4 py-2 rounded-lg hover:bg-emerald-50"
                                                        >
                                                            <i className="fas fa-eye mr-2"></i>
                                                            Voir détails
                                                        </button>
                                                        {canManage && (
                                                            <>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingObjective(objective);
                                                                        setIsCreatePageOpen(true);
                                                                    }}
                                                                    disabled={isLoading}
                                                                    className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors p-2 rounded hover:bg-blue-50"
                                                                    title="Modifier"
                                                                >
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => setObjectiveToDelete(objective)}
                                                                    disabled={isLoading}
                                                                    className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors p-2 rounded hover:bg-red-50"
                                                                    title="Supprimer"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Vue Compacte - À implémenter */}
                        {viewMode === 'compact' && (
                            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Objectif</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projet</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key Results</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progression</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredObjectives.map(objective => {
                                            const progress = calculateOverallProgress(objective.keyResults);
                                            const project = projects.find(p => p.id.toString() === objective.projectId);
                                            
                                            return (
                                                <tr key={objective.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">{objective.title}</div>
                                                            {objective.description && (
                                                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                    {objective.description}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {project?.title || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {objective.keyResults.length} KR
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-24">
                                                                <div 
                                                                    className="bg-emerald-600 h-2 rounded-full transition-all"
                                                                    style={{ width: `${progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-bold text-gray-700">{Math.round(progress)}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedObjective(objective);
                                                                    setIsDetailPageOpen(true);
                                                                }}
                                                                disabled={isLoading}
                                                                className="text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                                title="Voir détails"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            {canManage && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingObjective(objective);
                                                                            setIsCreatePageOpen(true);
                                                                        }}
                                                                        disabled={isLoading}
                                                                        className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                                        title="Modifier"
                                                                    >
                                                                        <i className="fas fa-edit"></i>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setObjectiveToDelete(objective)}
                                                                        disabled={isLoading}
                                                                        className="text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                                        title="Supprimer"
                                                                    >
                                                                        <i className="fas fa-trash"></i>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    !isDataLoaded ? (
                        // Afficher un spinner pendant le chargement initial des données
                        <div className="text-center py-20 px-4 bg-white rounded-xl shadow-lg">
                            <div className="mb-6">
                                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-500 mx-auto"></div>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                                Chargement des objectifs...
                            </h3>
                            <p className="text-gray-600">
                                Veuillez patienter pendant le chargement des données
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-20 px-4 bg-white rounded-xl shadow-lg">
                            <div className="mb-6">
                                <i className={`fas ${searchQuery || projectFilter !== 'all' || statusFilter !== 'all' ? 'fa-search' : 'fa-bullseye'} fa-5x text-gray-300`}></i>
                            </div>
                            <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                                {searchQuery || projectFilter !== 'all' || statusFilter !== 'all'
                                    ? 'Aucun objectif ne correspond à vos critères' 
                                    : 'Aucun objectif créé pour le moment'
                                }
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchQuery || projectFilter !== 'all' || statusFilter !== 'all'
                                    ? 'Essayez de modifier vos critères de recherche ou de filtrage'
                                    : 'Commencez par créer votre premier objectif ou générez-en avec l\'IA'
                                }
                            </p>
                        {(searchQuery || projectFilter !== 'all' || statusFilter !== 'all') && (
                            <button 
                                onClick={() => {
                                    setSearchQuery('');
                                    setProjectFilter('all');
                                    setStatusFilter('all');
                                }}
                                className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-semibold shadow-md hover:shadow-lg mr-3"
                            >
                                <i className="fas fa-times mr-2"></i>
                                Réinitialiser les filtres
                            </button>
                        )}
                        {canManage && projects.length > 0 && (
                            <button 
                                onClick={() => setIsCreatePageOpen(true)}
                                className="bg-emerald-600 text-white px-8 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                            >
                                <i className="fas fa-plus mr-2"></i>
                                Créer un objectif
                            </button>
                        )}
                        </div>
                    )
                )}
            </div>

            {/* Bouton flottant IA pour générer OKRs */}
            {projects.length > 0 && canManage && (
                <div className="fixed bottom-6 right-6 z-50">
                    <div className="relative">
                        <button
                            onClick={() => {
                                if (projects.length === 1) {
                                    handleGenerateOKRs(projects[0]);
                                } else {
                                    // Afficher un menu pour sélectionner le projet
                                    // Pour l'instant, on prend le premier projet
                                    handleGenerateOKRs(projects[0]);
                                }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                            title="Générer des OKRs avec l'IA"
                        >
                            <i className="fas fa-robot text-xl"></i>
                        </button>
                    </div>
                </div>
            )}

            {/* Pages */}
            {isCreatePageOpen && (
                <ObjectiveFormModal
                    objective={editingObjective}
                    projectId={editingObjective?.projectId || null}
                    projects={projects}
                    onClose={() => {
                        setIsCreatePageOpen(false);
                        setEditingObjective(null);
                    }}
                    onSave={handleSaveObjective}
                />
            )}

            {isDetailPageOpen && selectedObjective && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold">{selectedObjective.title}</h2>
                                <button onClick={() => {
                                    setIsDetailPageOpen(false);
                                    setSelectedObjective(null);
                                }} className="text-gray-500 hover:text-gray-700">
                                    <i className="fas fa-times text-xl"></i>
                                </button>
                            </div>
                        </div>
                        <div className="p-6 flex-grow overflow-y-auto">
                            <div className="space-y-6">
                                {/* Key Results */}
                                {selectedObjective.keyResults.map(kr => {
                                    const progress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
                                    return (
                                        <div key={kr.id} className="p-4 border rounded-lg">
                                            <p className="font-semibold text-gray-700 mb-2">{kr.title}</p>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                                    <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                                </div>
                                                <span className="text-sm font-medium text-gray-600">
                                                    {kr.current} / {kr.target} {kr.unit}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Confirmation Suppression */}
            {objectiveToDelete && (
                <ConfirmationModal
                    title="Supprimer l'objectif"
                    message={`Êtes-vous sûr de vouloir supprimer l'objectif "${objectiveToDelete.title}" ? Cette action est irréversible.`}
                    onConfirm={handleDeleteObjective}
                    onCancel={() => setObjectiveToDelete(null)}
                    confirmText="Supprimer"
                    cancelText="Annuler"
                    confirmButtonClass="bg-red-600 hover:bg-red-700"
                />
            )}

            {/* Modal Suggestions OKRs */}
            {isSuggestionModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b">
                            <h2 className="text-2xl font-bold">{t('ai_okr_suggestions')}</h2>
                            {selectedProjectForOKRs && (
                                <p className="text-sm text-gray-600 mt-1">Pour le projet: {selectedProjectForOKRs.title}</p>
                            )}
                        </div>
                        <div className="p-6 flex-grow overflow-y-auto">
                            {isGeneratingOKRs ? (
                                <div className="flex justify-center items-center h-48">
                                    <i className="fas fa-spinner fa-spin text-3xl text-emerald-500"></i>
                                </div>
                            ) : suggestedOKRs.length > 0 ? (
                                <div className="space-y-6">
                                    {suggestedOKRs.map(obj => (
                                        <div key={obj.id} className="p-4 border rounded-md bg-gray-50">
                                            <h3 className="font-bold text-lg text-gray-800">{obj.title}</h3>
                                            <div className="mt-2 pl-4 border-l-2 border-emerald-200 space-y-2">
                                                {obj.keyResults.map(kr => (
                                                    <div key={kr.id}>
                                                        <p className="font-semibold text-gray-700">{kr.title}</p>
                                                        <p className="text-sm text-gray-500">Objectif : {kr.target} {kr.unit}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500">Aucune suggestion générée. Veuillez réessayer.</p>
                            )}
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
                            <button onClick={() => {
                                setIsSuggestionModalOpen(false);
                                setSuggestedOKRs([]);
                                setSelectedProjectForOKRs(null);
                            }} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300">{t('cancel')}</button>
                            <button 
                                onClick={() => handleAddSuggestedOKRs(suggestedOKRs)} 
                                disabled={isGeneratingOKRs || suggestedOKRs.length === 0}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:bg-emerald-300"
                            >
                                {t('add_to_project')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Goals;
