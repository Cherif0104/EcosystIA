import React, { useState, useRef } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { Course, Lesson, Module, TimeLog, Project, EvidenceDocument } from '../types';
import LogTimeModal from './LogTimeModal';

interface CourseDetailProps {
    course: Course;
    onBack: () => void;
    timeLogs: TimeLog[];
    onAddTimeLog: (log: Omit<TimeLog, 'id' | 'userId'>) => void;
    projects: Project[];
    onUpdateCourse: (course: Course) => void;
}

const LessonItem: React.FC<{ lesson: Lesson; isCompleted: boolean; onToggle: (id: string) => void; }> = ({ lesson, isCompleted, onToggle }) => (
    <div onClick={() => onToggle(lesson.id)} className="flex items-center p-4 hover:bg-emerald-50 rounded-lg transition-colors duration-200 cursor-pointer border border-gray-200">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-4 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-200'}`}>
            <i className={`${isCompleted ? 'fas fa-check text-white' : 'far fa-circle text-gray-400'}`}></i>
        </div>
        <div className="flex-grow">
            <p className={`font-semibold ${isCompleted ? 'text-emerald-600' : 'text-gray-800'}`}>
                {lesson.title}
            </p>
            <p className="text-xs text-gray-500 mt-1">
                {lesson.type === 'video' ? '📹 Vidéo' : lesson.type === 'reading' ? '📖 Lecture' : '❓ Quiz'}
            </p>
        </div>
        <div className="bg-gray-100 px-3 py-1 rounded-full">
            <p className="text-sm font-medium text-gray-700">{lesson.duration}</p>
        </div>
    </div>
);

const ModuleItem: React.FC<{ module: Module; moduleIndex: number; course: Course; onUpdateCourse: (course: Course) => void; completedLessons: string[]; onToggleLesson: (id: string) => void; }> = ({ module, moduleIndex, course, onUpdateCourse, completedLessons, onToggleLesson }) => {
    const { t } = useLocalization();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                const newDocument: EvidenceDocument = {
                    fileName: file.name,
                    dataUrl: loadEvent.target?.result as string,
                };
                const updatedModules = [...course.modules];
                const currentModule = { ...updatedModules[moduleIndex] };
                currentModule.evidenceDocuments = [...(currentModule.evidenceDocuments || []), newDocument];
                updatedModules[moduleIndex] = currentModule;
                onUpdateCourse({ ...course, modules: updatedModules });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveDocument = (docIndex: number) => {
        const updatedModules = [...course.modules];
        const currentModule = { ...updatedModules[moduleIndex] };
        const updatedDocs = currentModule.evidenceDocuments?.filter((_, i) => i !== docIndex);
        currentModule.evidenceDocuments = updatedDocs;
        updatedModules[moduleIndex] = currentModule;
        onUpdateCourse({ ...course, modules: updatedModules });
    };

    const moduleProgress = module.lessons.length > 0 
        ? Math.round((completedLessons.filter(id => module.lessons.some(l => l.id === id)).length / module.lessons.length) * 100)
        : 0;

    return (
        <div className="bg-white p-6 rounded-xl shadow-md mb-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">{module.title}</h3>
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{moduleProgress}%</span>
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                            className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${moduleProgress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
            
            <div className="space-y-3 mb-4">
                {module.lessons.map(lesson => (
                    <LessonItem 
                        key={lesson.id} 
                        lesson={lesson} 
                        isCompleted={completedLessons.includes(lesson.id)} 
                        onToggle={onToggleLesson} 
                    />
                ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <i className="fas fa-file-alt mr-2 text-emerald-600"></i>
                    {t('evidence_documents')}
                </h4>
                <div className="space-y-2">
                    {module.evidenceDocuments && module.evidenceDocuments.length > 0 ? (
                        module.evidenceDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <span className="text-sm text-gray-700 truncate flex items-center">
                                    <i className="fas fa-file-pdf mr-2 text-red-500"></i>
                                    {doc.fileName}
                                </span>
                                <div className="space-x-3">
                                    <a 
                                        href={doc.dataUrl} 
                                        download={doc.fileName} 
                                        className="text-emerald-600 hover:text-emerald-800 transition-colors" 
                                        title={t('download_evidence')}
                                    >
                                        <i className="fas fa-download"></i>
                                    </a>
                                    <button 
                                        onClick={() => handleRemoveDocument(index)} 
                                        className="text-red-500 hover:text-red-700 transition-colors" 
                                        title={t('remove_evidence')}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 italic">{t('no_evidence_uploaded')}</p>
                    )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="mt-3 w-full text-sm border-dashed border-2 p-3 rounded-lg hover:bg-emerald-50 text-emerald-600 border-emerald-300 transition-colors font-medium"
                >
                    <i className="fas fa-upload mr-2"></i>
                    {t('upload_evidence')}
                </button>
            </div>
        </div>
    );
};

const CourseDetail: React.FC<CourseDetailProps> = ({ course, onBack, timeLogs, onAddTimeLog, projects, onUpdateCourse }) => {
    const { t } = useLocalization();
    const { user } = useAuth();
    const [isLogTimeModalOpen, setLogTimeModalOpen] = useState(false);

    if (!user) return null;
    
    const handleStartLearning = () => {
        if (course.progress === 0) {
            onUpdateCourse({ ...course, progress: 5 });
        }
        // In a more complex app, this might navigate to the first lesson page
    };

    const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0);

    const handleToggleLesson = (lessonId: string) => {
        const completed = new Set(course.completedLessons || []);
        if (completed.has(lessonId)) {
            completed.delete(lessonId);
        } else {
            completed.add(lessonId);
        }
        const newCompletedLessons = Array.from(completed);
        let newProgress = totalLessons > 0 ? Math.round((newCompletedLessons.length / totalLessons) * 100) : 0;
        
        // If un-completing all lessons, but course was started, keep minimal progress
        if (newProgress === 0 && course.progress > 0) {
            newProgress = 5;
        }

        onUpdateCourse({
            ...course,
            completedLessons: newCompletedLessons,
            progress: newProgress,
        });
    };

    const totalMinutesLogged = timeLogs
        .filter(log => log.entityType === 'course' && log.entityId === course.id && log.userId === user.id)
        .reduce((sum, log) => sum + log.duration, 0);

    const formatMinutes = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const handleSaveTimeLog = (logData: Omit<TimeLog, 'id' | 'userId'>) => {
        onAddTimeLog(logData);
        setLogTimeModalOpen(false);
    };

    const completedLessonsCount = (course.completedLessons || []).length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header avec gradient */}
            <div className="bg-gradient-to-r from-emerald-600 via-green-500 to-blue-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <button 
                        onClick={onBack} 
                        className="flex items-center text-white hover:text-emerald-100 transition-colors mb-4"
                    >
                        <i className="fas fa-arrow-left mr-2"></i>
                        {t('back_to_courses')}
                    </button>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
                            <p className="text-emerald-50 text-sm">{course.description}</p>
                        </div>
                        <div className="hidden md:flex items-center space-x-4 text-right">
                            <div>
                                <p className="text-xs text-emerald-100 uppercase">Progression</p>
                                <p className="text-3xl font-bold">{course.progress}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left side - Content */}
                    <div className="lg:col-span-2">
                        {/* Statistiques rapides */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                                <div className="flex items-center">
                                    <div className="bg-blue-100 p-3 rounded-lg mr-3">
                                        <i className="fas fa-list text-blue-600"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Modules</p>
                                        <p className="text-xl font-bold text-gray-900">{course.modules.length}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                                <div className="flex items-center">
                                    <div className="bg-green-100 p-3 rounded-lg mr-3">
                                        <i className="fas fa-check-circle text-green-600"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Complétés</p>
                                        <p className="text-xl font-bold text-gray-900">{completedLessonsCount}/{totalLessons}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                                <div className="flex items-center">
                                    <div className="bg-purple-100 p-3 rounded-lg mr-3">
                                        <i className="fas fa-clock text-purple-600"></i>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-600">Durée</p>
                                        <p className="text-xl font-bold text-gray-900">{formatMinutes(totalMinutesLogged)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modules */}
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <i className="fas fa-book-open mr-3 text-emerald-600"></i>
                                {t('modules')}
                            </h2>
                            {course.modules.map((module, index) => (
                                <ModuleItem 
                                    key={module.id} 
                                    module={module} 
                                    moduleIndex={index} 
                                    course={course} 
                                    onUpdateCourse={onUpdateCourse} 
                                    completedLessons={course.completedLessons || []} 
                                    onToggleLesson={handleToggleLesson} 
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right side - Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24 border border-gray-100">
                            <div className="text-center mb-6">
                                <div className="bg-emerald-100 p-4 rounded-full inline-block">
                                    <i className={`${course.icon} text-4xl text-emerald-600`}></i>
                                </div>
                            </div>
                            
                            <div className="space-y-4 mb-6">
                                <div className="border-b border-gray-200 pb-4">
                                    <div className="flex items-center mb-2">
                                        <i className="fas fa-user text-emerald-600 mr-2"></i>
                                        <span className="text-sm font-semibold text-gray-600">{t('instructor')}</span>
                                    </div>
                                    <p className="text-gray-800 font-medium">{course.instructor}</p>
                                </div>
                                
                                <div className="border-b border-gray-200 pb-4">
                                    <div className="flex items-center mb-2">
                                        <i className="fas fa-hourglass-half text-emerald-600 mr-2"></i>
                                        <span className="text-sm font-semibold text-gray-600">Durée</span>
                                    </div>
                                    <p className="text-gray-800 font-medium">{course.duration}</p>
                                </div>
                                
                                <div className="border-b border-gray-200 pb-4">
                                    <div className="flex items-center mb-2">
                                        <i className="fas fa-clock text-emerald-600 mr-2"></i>
                                        <span className="text-sm font-semibold text-gray-600">{t('total_time_logged')}</span>
                                    </div>
                                    <p className="text-gray-800 font-medium">{formatMinutes(totalMinutesLogged)}</p>
                                </div>
                            </div>
                            
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-gray-700">{t('course_progress')}</span>
                                    <span className="text-lg font-bold text-emerald-600">{course.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 h-3 rounded-full transition-all duration-500" 
                                        style={{ width: `${course.progress}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-center">
                                    {completedLessonsCount} leçons terminées sur {totalLessons}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button 
                                    onClick={() => setLogTimeModalOpen(true)} 
                                    className="w-full border-2 border-emerald-600 text-emerald-600 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-all flex items-center justify-center"
                                >
                                    <i className="fas fa-stopwatch mr-2"></i>
                                    {t('log_time')}
                                </button>
                                <button 
                                    onClick={handleStartLearning} 
                                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 rounded-lg font-semibold hover:from-emerald-700 hover:to-green-700 transition-all shadow-lg flex items-center justify-center"
                                >
                                    <i className={`fas ${course.progress > 0 ? 'fa-play' : 'fa-play-circle'} mr-2`}></i>
                                    {t(course.progress > 0 ? 'continue_learning' : 'start_learning')}
                                </button>
                            </div>

                            {/* Informations complémentaires */}
                            {course.youtubeUrl && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <a 
                                        href={course.youtubeUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center justify-center"
                                    >
                                        <i className="fab fa-youtube mr-2"></i>
                                        Voir sur YouTube
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isLogTimeModalOpen && (
                <LogTimeModal
                    onClose={() => setLogTimeModalOpen(false)}
                    onSave={handleSaveTimeLog}
                    projects={projects}
                    courses={[course]}
                    user={user}
                    initialEntity={{ type: 'course', id: course.id }}
                />
            )}
        </div>
    );
};

export default CourseDetail;
