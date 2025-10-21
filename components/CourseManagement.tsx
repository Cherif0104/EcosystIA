import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Course, Module, Lesson, EvidenceDocument } from '../types';
import ConfirmationModal from './common/ConfirmationModal';

const CourseFormModal: React.FC<{
    course: Course | null;
    onClose: () => void;
    onSave: (course: Course | Omit<Course, 'id' | 'progress'>) => void;
}> = ({ course, onClose, onSave }) => {
    const { t } = useLocalization();
    const isEditMode = course !== null;
    const [formData, setFormData] = useState<Course | Omit<Course, 'id' | 'progress'>>(
        course || {
            title: '',
            instructor: '',
            duration: '',
            icon: 'fas fa-book',
            description: '',
            modules: []
        }
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
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


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 border-b">
                        <h2 className="text-2xl font-bold">{isEditMode ? t('edit_course') : t('add_new_course')}</h2>
                    </div>
                    <div className="p-6 flex-grow overflow-y-auto space-y-4">
                        {/* Course Details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('project_title')}</label>
                                <input name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('instructor')}</label>
                                <input name="instructor" value={formData.instructor} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('course_duration')}</label>
                                <input name="duration" value={formData.duration} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('course_icon')}</label>
                                <input name="icon" value={formData.icon} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">{t('project_description')}</label>
                             <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 border rounded-md" required />
                        </div>
                        <hr/>
                        {/* Modules & Lessons */}
                        <h3 className="text-lg font-bold">{t('modules')}</h3>
                        <div className="space-y-4">
                            {formData.modules.map((module, mIndex) => (
                                <div key={module.id} className="p-4 border rounded-md bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <input value={module.title} onChange={(e) => handleModuleChange(mIndex, 'title', e.target.value)} className="text-md font-semibold p-1 border-b w-full bg-transparent" />
                                        <button type="button" onClick={() => removeModule(mIndex)} className="text-red-500 hover:text-red-700 ml-4"><i className="fas fa-trash"></i></button>
                                    </div>
                                    <div className="mt-2 pl-4 space-y-2">
                                        {module.lessons.map((lesson, lIndex) => (
                                            <div key={lesson.id} className="flex items-center gap-2">
                                                <input value={lesson.title} onChange={(e) => handleLessonChange(mIndex, lIndex, 'title', e.target.value)} className="p-1 border-b text-sm flex-grow bg-transparent"/>
                                                <input value={lesson.duration} onChange={(e) => handleLessonChange(mIndex, lIndex, 'duration', e.target.value)} className="p-1 border-b text-sm w-20 bg-transparent"/>
                                                <button type="button" onClick={() => removeLesson(mIndex, lIndex)} className="text-red-500 hover:text-red-700"><i className="fas fa-times-circle"></i></button>
                                            </div>
                                        ))}
                                         <button type="button" onClick={() => addLesson(mIndex)} className="text-sm text-emerald-600 hover:text-emerald-800 mt-2"><i className="fas fa-plus mr-1"></i> {t('add_lesson')}</button>
                                    </div>
                                    <div className="mt-3 pt-3 border-t">
                                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">{t('evidence_documents')}</h4>
                                         {module.evidenceDocuments?.map((doc, dIndex) => (
                                            <div key={dIndex} className="flex items-center justify-between text-sm py-1">
                                                <span className="truncate">{doc.fileName}</span>
                                                <button type="button" onClick={() => removeEvidenceDocument(mIndex, dIndex)} className="text-red-500 hover:text-red-700"><i className="fas fa-times"></i></button>
                                            </div>
                                        ))}
                                        <label className="text-sm text-emerald-600 hover:text-emerald-800 mt-2 cursor-pointer w-full text-center block border border-dashed py-1 rounded-md">
                                            <i className="fas fa-upload mr-1"></i> {t('upload_evidence')}
                                            <input type="file" className="hidden" onChange={(e) => handleEvidenceUpload(e, mIndex)} />
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addModule} className="w-full border-dashed border-2 p-2 rounded-md hover:bg-gray-100"><i className="fas fa-plus mr-2"></i>{t('add_module')}</button>
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


interface CourseManagementProps {
    courses: Course[];
    onAddCourse: (courseData: Omit<Course, 'id' | 'progress'>) => void;
    onUpdateCourse: (course: Course) => void;
    onDeleteCourse: (courseId: number) => void;
}

const CourseManagement: React.FC<CourseManagementProps> = ({ courses, onAddCourse, onUpdateCourse, onDeleteCourse }) => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [deletingCourseId, setDeletingCourseId] = useState<number | null>(null);

    const canManage = user?.role === 'administrator' || user?.role === 'manager' || user?.role === 'supervisor';

    const handleOpenModal = (course: Course | null = null) => {
        setEditingCourse(course);
        setModalOpen(true);
    };

    const handleSaveCourse = (courseData: Course | Omit<Course, 'id' | 'progress'>) => {
        if ('id' in courseData) {
            onUpdateCourse(courseData);
        } else {
            onAddCourse(courseData);
        }
        setModalOpen(false);
        setEditingCourse(null);
    };
    
    const handleDelete = (courseId: number) => {
        onDeleteCourse(courseId);
        setDeletingCourseId(null);
    };

    if (!canManage) {
        return <div>Access Denied</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">{t('course_management')}</h1>
                    <p className="mt-1 text-gray-600">{t('course_management_subtitle')}</p>
                </div>
                <button onClick={() => handleOpenModal(null)} className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 flex items-center">
                    <i className="fas fa-plus mr-2"></i>
                    {t('add_new_course')}
                </button>
            </div>

            <div className="mt-8 space-y-4">
                {courses.map(course => (
                    <div key={course.id} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="bg-emerald-100 text-emerald-600 rounded-lg p-3">
                                <i className={`${course.icon} fa-lg`}></i>
                            </div>
                            <div>
                                <p className="font-bold text-gray-800">{course.title}</p>
                                <p className="text-sm text-gray-500">{course.instructor}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => handleOpenModal(course)} className="text-blue-600 hover:text-blue-800 font-semibold px-3 py-1 text-sm">
                                {t('edit')}
                            </button>
                             <button onClick={() => setDeletingCourseId(course.id)} className="text-red-600 hover:text-red-800 font-semibold px-3 py-1 text-sm">
                                {t('delete')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {isModalOpen && (
                <CourseFormModal
                    course={editingCourse}
                    onClose={() => setModalOpen(false)}
                    onSave={handleSaveCourse}
                />
            )}
            {deletingCourseId !== null && (
                <ConfirmationModal 
                    title={t('edit_course')}
                    message={t('confirm_delete_message')}
                    onConfirm={() => handleDelete(deletingCourseId)}
                    onCancel={() => setDeletingCourseId(null)}
                />
            )}
        </div>
    );
};

export default CourseManagement;