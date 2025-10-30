import React, { useState, useEffect } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Course, User, Module, Lesson, EvidenceDocument } from '../types';

interface CourseCreatePageProps {
    onClose: () => void;
    onSave: (course: Course | Omit<Course, 'id' | 'progress'>) => void;
    users: User[];
    editingCourse?: Course | null;
}

const CourseCreatePage: React.FC<CourseCreatePageProps> = ({
    onClose,
    onSave,
    users,
    editingCourse = null
}) => {
    const { t } = useLocalization();
    const { user: currentUser } = useAuth();
    const isEditMode = editingCourse !== null;
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        instructor: '',
        duration: '',
        level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
        category: '',
        price: 0,
        status: 'draft' as 'draft' | 'published' | 'archived',
        thumbnailUrl: '',
        targetAllUsers: true,
        selectedUserIds: [] as string[],
        youtubeUrl: '',
        driveUrl: '',
        modules: [] as Module[]
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (editingCourse) {
            setFormData({
                title: editingCourse.title,
                description: editingCourse.description || '',
                instructor: editingCourse.instructor || '',
                duration: editingCourse.duration || '',
                level: editingCourse.level || 'beginner',
                category: editingCourse.category || '',
                price: editingCourse.price || 0,
                status: editingCourse.status || 'draft',
                thumbnailUrl: editingCourse.thumbnailUrl || '',
                targetAllUsers: editingCourse.targetStudents === null || editingCourse.targetStudents === undefined,
                selectedUserIds: (editingCourse.targetStudents as string[]) || [],
                youtubeUrl: editingCourse.youtubeUrl || '',
                driveUrl: editingCourse.driveUrl || '',
                modules: editingCourse.modules || []
            });
        }
    }, [editingCourse]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTargetUsersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isAll = e.target.value === 'all';
        setFormData(prev => ({
            ...prev,
            targetAllUsers: isAll,
            selectedUserIds: isAll ? [] : prev.selectedUserIds
        }));
    };

    const handleUserToggle = (userId: string) => {
        setFormData(prev => {
            if (prev.selectedUserIds.includes(userId)) {
                return {
                    ...prev,
                    selectedUserIds: prev.selectedUserIds.filter(id => id !== userId)
                };
            } else {
                return {
                    ...prev,
                    selectedUserIds: [...prev.selectedUserIds, userId]
                };
            }
        });
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Le titre du cours est requis';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'La description du cours est requise';
        }

        if (!formData.instructor.trim()) {
            newErrors.instructor = 'Le nom de l\'instructeur est requis';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        const courseData = {
            ...formData,
            targetStudents: formData.targetAllUsers ? null : formData.selectedUserIds,
            youtubeUrl: formData.youtubeUrl || null,
            driveUrl: formData.driveUrl || null,
        };

        // Si mode édition, conserver l'ID
        if (isEditMode && editingCourse) {
            onSave({ ...courseData, id: editingCourse.id } as Course);
        } else {
            onSave(courseData);
        }
    };

    // Gestion des modules et leçons
    const handleModuleChange = (moduleIndex: number, field: string, value: string) => {
        const newModules = [...formData.modules];
        (newModules[moduleIndex] as any)[field] = value;
        setFormData(prev => ({...prev, modules: newModules}));
    };
    
    const handleLessonChange = (moduleIndex: number, lessonIndex: number, field: string, value: string) => {
        const newModules = [...formData.modules];
        (newModules[moduleIndex].lessons[lessonIndex] as any)[field] = value;
        setFormData(prev => ({...prev, modules: newModules}));
    };

    const addModule = () => {
        const newModule: Module = { id: `m-${Date.now()}`, title: 'New Module', lessons: [], evidenceDocuments: [] };
        setFormData(prev => ({...prev, modules: [...prev.modules, newModule]}));
    };
    
    const addLesson = (moduleIndex: number) => {
        const newLesson: Lesson = { id: `l-${Date.now()}`, title: 'New Lesson', type: 'video', duration: '10 min', icon: 'fas fa-play-circle' };
        const newModules = [...formData.modules];
        newModules[moduleIndex].lessons.push(newLesson);
        setFormData(prev => ({...prev, modules: newModules}));
    };
    
    const removeModule = (moduleIndex: number) => {
         const newModules = formData.modules.filter((_, index) => index !== moduleIndex);
         setFormData(prev => ({...prev, modules: newModules}));
    };
    
    const removeLesson = (moduleIndex: number, lessonIndex: number) => {
        const newModules = [...formData.modules];
        newModules[moduleIndex].lessons = newModules[moduleIndex].lessons.filter((_, index) => index !== lessonIndex);
        setFormData(prev => ({...prev, modules: newModules}));
    };
    
    const handleEvidenceUpload = (e: React.ChangeEvent<HTMLInputElement>, moduleIndex: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const newDocument: EvidenceDocument = {
                    fileName: file.name,
                    dataUrl: loadEvent.target?.result as string,
                };
                const newModules = [...formData.modules];
                const updatedDocs = [...(newModules[moduleIndex].evidenceDocuments || []), newDocument];
                newModules[moduleIndex].evidenceDocuments = updatedDocs;
                setFormData(prev => ({ ...prev, modules: newModules }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const removeEvidenceDocument = (moduleIndex: number, docIndex: number) => {
        const newModules = [...formData.modules];
        const updatedDocs = newModules[moduleIndex].evidenceDocuments?.filter((_, i) => i !== docIndex);
        newModules[moduleIndex].evidenceDocuments = updatedDocs;
        setFormData(prev => ({ ...prev, modules: newModules }));
    };

    return (
        <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
            {/* Header sticky */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-blue-600 text-white shadow-lg z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="text-white hover:text-gray-200 transition-colors"
                            >
                                <i className="fas fa-arrow-left text-xl"></i>
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {isEditMode ? 'Modifier le cours' : 'Nouveau cours'}
                                </h1>
                                <p className="text-emerald-50 text-sm mt-1">
                                    {isEditMode ? 'Modifiez les informations du cours' : 'Créez un nouveau cours de formation'}
                                </p>
                            </div>
                        </div>
                        <button
                            type="submit"
                            form="course-form"
                            className="bg-white text-emerald-600 font-bold py-2 px-6 rounded-lg hover:bg-emerald-50 transition-all shadow-md"
                        >
                            <i className="fas fa-save mr-2"></i>
                            Enregistrer
                        </button>
                    </div>
                </div>
            </div>

            {/* Formulaire scrollable */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form id="course-form" onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8">
                    {/* Course Details */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Titre du cours *
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Ex: Digital Marketing Fundamentals"
                                    required
                                />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Instructeur *
                                </label>
                                <input
                                    type="text"
                                    name="instructor"
                                    value={formData.instructor}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    placeholder="Nom de l'instructeur"
                                    required
                                />
                                {errors.instructor && <p className="text-red-500 text-xs mt-1">{errors.instructor}</p>}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                placeholder="Description détaillée du cours..."
                                required
                            />
                            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Durée</label>
                                <input
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Ex: 6 Weeks"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Niveau</label>
                                <select
                                    name="level"
                                    value={formData.level}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="beginner">Débutant</option>
                                    <option value="intermediate">Intermédiaire</option>
                                    <option value="advanced">Avancé</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                                <input
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Ex: Marketing, Business, Technology"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Prix (XOF)</label>
                                <input
                                    name="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    step="1000"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="draft">Brouillon</option>
                                    <option value="published">Publié</option>
                                    <option value="archived">Archivé</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">URL de l'image de couverture</label>
                                <input
                                    name="thumbnailUrl"
                                    type="url"
                                    value={formData.thumbnailUrl}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                        </div>

                        {/* Ciblage des utilisateurs */}
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                <i className="fas fa-users mr-2 text-emerald-600"></i>
                                Cours destiné à
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input type="radio" name="targetUsers" value="all" checked={formData.targetAllUsers} onChange={handleTargetUsersChange} className="mr-3" />
                                    <label className="text-sm font-medium text-gray-700 cursor-pointer flex-1 flex items-center">
                                        <i className="fas fa-globe text-emerald-600 mr-2"></i>
                                        Tous les utilisateurs
                                    </label>
                                </div>
                                <div className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input type="radio" name="targetUsers" value="specific" checked={!formData.targetAllUsers} onChange={handleTargetUsersChange} className="mr-3" />
                                    <label className="text-sm font-medium text-gray-700 cursor-pointer flex-1 flex items-center">
                                        <i className="fas fa-user-check text-blue-600 mr-2"></i>
                                        Utilisateurs sélectionnés
                                    </label>
                                </div>
                                {!formData.targetAllUsers && (
                                    <div className="ml-6 mt-2 border-2 border-emerald-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-gray-50 shadow-inner">
                                        <p className="text-xs font-semibold text-gray-600 mb-3 uppercase">Sélectionnez les utilisateurs :</p>
                                        {users.filter(u => ['student', 'intern', 'alumni', 'trainer'].includes(u.role)).length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">Aucun utilisateur disponible</p>
                                        ) : (
                                            users.filter(u => ['student', 'intern', 'alumni', 'trainer'].includes(u.role)).map(user => {
                                                const userIdToUse = user.profileId || String(user.id);
                                                return (
                                                    <label key={userIdToUse} className="flex items-center py-2 px-3 hover:bg-white rounded-md cursor-pointer transition-colors mb-1">
                                                        <input type="checkbox" checked={formData.selectedUserIds.includes(userIdToUse)} onChange={() => handleUserToggle(userIdToUse)} className="mr-3 h-4 w-4" />
                                                        <div className="flex-1">
                                                            <span className="text-sm font-medium text-gray-800 block">{user.fullName || user.name}</span>
                                                            <span className="text-xs text-gray-500">{user.email} • {user.role}</span>
                                                        </div>
                                                    </label>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Liens YouTube et Drive */}
                        <div className="space-y-4 border-t pt-6">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center mb-4">
                                <i className="fas fa-link text-emerald-600 mr-2"></i>
                                Ressources et liens externes
                            </h3>
                            
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <p className="text-sm text-blue-800">
                                    <i className="fas fa-info-circle mr-2"></i>
                                    Ajoutez des liens vers des vidéos, documents ou ressources pédagogiques externes
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fab fa-youtube text-red-600 mr-2"></i>
                                    Vidéo YouTube
                                </label>
                                <input 
                                    name="youtubeUrl" 
                                    type="url" 
                                    value={formData.youtubeUrl} 
                                    onChange={handleChange} 
                                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500" 
                                    placeholder="https://www.youtube.com/watch?v=..." 
                                />
                                <p className="text-xs text-gray-500 mt-2">Exemple: https://www.youtube.com/watch?v=dQw4w9WgXcQ</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <i className="fab fa-google-drive text-blue-600 mr-2"></i>
                                    Google Drive / OneDrive
                                </label>
                                <input 
                                    name="driveUrl" 
                                    type="url" 
                                    value={formData.driveUrl} 
                                    onChange={handleChange} 
                                    className="mt-1 block w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                                    placeholder="https://drive.google.com/file/d/..." 
                                />
                                <p className="text-xs text-gray-500 mt-2">Lien vers un dossier ou fichier contenant les ressources du cours</p>
                            </div>
                        </div>

                        {/* Modules & Lessons */}
                        <div className="border-t pt-6">
                            <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <h3 className="text-lg font-bold text-gray-800 flex items-center mb-2">
                                    <i className="fas fa-sitemap text-emerald-600 mr-2"></i>
                                    Modules du Cours
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Organisez votre cours en modules. Chaque module peut contenir plusieurs leçons que les étudiants pourront valider progressivement.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                {formData.modules.map((module, mIndex) => (
                                    <div key={module.id} className="p-5 border-2 border-emerald-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-bold">Module {mIndex + 1}</span>
                                                <input 
                                                    value={module.title} 
                                                    onChange={(e) => handleModuleChange(mIndex, 'title', e.target.value)} 
                                                    placeholder="Titre du module (ex: Introduction au Marketing)" 
                                                    className="text-md font-semibold p-2 border-b-2 border-emerald-300 w-full bg-transparent focus:border-emerald-600 focus:outline-none"
                                                />
                                            </div>
                                            <button 
                                                type="button" 
                                                onClick={() => removeModule(mIndex)} 
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                title="Supprimer ce module"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        
                                        <div className="ml-8 mt-3 space-y-2">
                                            <p className="text-xs font-semibold text-gray-600 uppercase mb-2">Leçons :</p>
                                            {module.lessons.length === 0 && (
                                                <p className="text-xs text-gray-400 italic mb-2">Aucune leçon ajoutée</p>
                                            )}
                                            {module.lessons.map((lesson, lIndex) => (
                                                <div key={lesson.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-md">
                                                    <span className="text-xs font-semibold text-gray-500 w-6">{lIndex + 1}.</span>
                                                    <input 
                                                        value={lesson.title} 
                                                        onChange={(e) => handleLessonChange(mIndex, lIndex, 'title', e.target.value)} 
                                                        placeholder="Titre de la leçon"
                                                        className="p-1 border-b border-gray-300 text-sm flex-grow bg-transparent focus:border-emerald-600 focus:outline-none"
                                                    />
                                                    <input 
                                                        value={lesson.duration} 
                                                        onChange={(e) => handleLessonChange(mIndex, lIndex, 'duration', e.target.value)} 
                                                        placeholder="Durée"
                                                        className="p-1 border-b border-gray-300 text-sm w-24 bg-transparent focus:border-emerald-600 focus:outline-none"
                                                    />
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeLesson(mIndex, lIndex)} 
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                                        title="Supprimer cette leçon"
                                                    >
                                                        <i className="fas fa-times-circle"></i>
                                                    </button>
                                                </div>
                                            ))}
                                            <button 
                                                type="button" 
                                                onClick={() => addLesson(mIndex)} 
                                                className="text-sm text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 p-2 rounded-lg transition-colors font-semibold"
                                            >
                                                <i className="fas fa-plus mr-1"></i> 
                                                Ajouter une leçon
                                            </button>
                                        </div>

                                        {/* Evidence Documents */}
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <h4 className="text-xs font-semibold text-gray-600 uppercase mb-2 flex items-center">
                                                <i className="fas fa-file-alt mr-2"></i>
                                                Documents de preuve
                                            </h4>
                                            {module.evidenceDocuments && module.evidenceDocuments.length > 0 && (
                                                <div className="space-y-2 mb-2">
                                                    {module.evidenceDocuments.map((doc, dIndex) => (
                                                        <div key={dIndex} className="flex items-center justify-between bg-gray-50 p-2 rounded-md text-sm">
                                                            <span className="truncate flex-1">{doc.fileName}</span>
                                                            <button 
                                                                type="button" 
                                                                onClick={() => removeEvidenceDocument(mIndex, dIndex)} 
                                                                className="text-red-500 hover:text-red-700"
                                                            >
                                                                <i className="fas fa-times"></i>
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <label className="text-sm text-emerald-600 hover:text-emerald-800 cursor-pointer inline-flex items-center gap-2 px-3 py-2 border border-emerald-300 rounded-md hover:bg-emerald-50 transition-colors">
                                                <i className="fas fa-upload"></i>
                                                Uploader un document
                                                <input type="file" className="hidden" onChange={(e) => handleEvidenceUpload(e, mIndex)} />
                                            </label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <button 
                                type="button" 
                                onClick={addModule} 
                                className="w-full border-dashed border-2 border-emerald-400 p-4 rounded-lg hover:bg-emerald-50 hover:border-emerald-600 transition-all mt-4"
                            >
                                <i className="fas fa-plus-circle mr-2 text-emerald-600"></i>
                                <span className="font-semibold text-emerald-600">Ajouter un module</span>
                            </button>
                        </div>

                        {/* Boutons d'action */}
                        <div className="flex justify-end gap-4 pt-6 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
                            >
                                <i className="fas fa-save mr-2"></i>
                                {isEditMode ? 'Sauvegarder' : 'Créer le cours'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseCreatePage;

