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
    <div onClick={() => onToggle(lesson.id)} className="flex items-center p-3 hover:bg-gray-100 rounded-md transition-colors duration-200 cursor-pointer">
        <i className={`w-6 text-center mr-4 ${isCompleted ? 'fas fa-check-circle text-emerald-500' : 'far fa-circle text-gray-400'}`}></i>
        <div className="flex-grow">
            <p className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>{lesson.title}</p>
        </div>
        <p className="text-sm text-gray-500">{lesson.duration}</p>
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

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
            <h3 className="text-lg font-bold text-gray-800 mb-3">{module.title}</h3>
            <div className="space-y-2">
                {module.lessons.map(lesson => <LessonItem key={lesson.id} lesson={lesson} isCompleted={completedLessons.includes(lesson.id)} onToggle={onToggleLesson} />)}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">{t('evidence_documents')}</h4>
                <div className="space-y-2">
                    {module.evidenceDocuments && module.evidenceDocuments.length > 0 ? (
                        module.evidenceDocuments.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                                <span className="text-sm text-gray-700 truncate">{doc.fileName}</span>
                                <div className="space-x-3">
                                    <a href={doc.dataUrl} download={doc.fileName} className="text-emerald-600 hover:text-emerald-800" title={t('download_evidence')}><i className="fas fa-download"></i></a>
                                    <button onClick={() => handleRemoveDocument(index)} className="text-red-500 hover:text-red-700" title={t('remove_evidence')}><i className="fas fa-trash"></i></button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400">{t('no_evidence_uploaded')}</p>
                    )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="mt-3 w-full text-sm border-dashed border-2 p-2 rounded-md hover:bg-gray-100 text-emerald-600 border-emerald-300">
                    <i className="fas fa-upload mr-2"></i>{t('upload_evidence')}
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

    return (
        <>
            <div>
                <button onClick={onBack} className="flex items-center text-emerald-600 font-semibold mb-6 hover:text-emerald-800">
                    <i className="fas fa-arrow-left mr-2"></i>
                    {t('back_to_courses')}
                </button>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left side - Syllabus */}
                    <div className="lg:col-span-2">
                        <h1 className="text-3xl font-bold text-gray-800">{course.title}</h1>
                        <p className="mt-2 text-gray-600 text-lg">{course.description}</p>

                        <div className="mt-8">
                            <h2 className="text-2xl font-bold text-gray-700 mb-4">{t('modules')}</h2>
                            {course.modules.map((module, index) => <ModuleItem key={module.id} module={module} moduleIndex={index} course={course} onUpdateCourse={onUpdateCourse} completedLessons={course.completedLessons || []} onToggleLesson={handleToggleLesson} />)}
                        </div>
                    </div>

                    {/* Right side - Info Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
                            <div className="bg-emerald-100 text-emerald-600 rounded-lg p-4 mb-4 inline-block">
                                <i className={`${course.icon} fa-2x`}></i>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('course_detail')}</h3>
                            
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600">{t('instructor')}:</span>
                                    <span className="text-gray-800">{course.instructor}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600">{t('course_duration')}:</span>
                                    <span className="text-gray-800">{course.duration}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-gray-600">{t('total_time_logged')}:</span>
                                    <span className="text-gray-800 font-bold">{formatMinutes(totalMinutesLogged)}</span>
                                </div>
                            </div>
                            
                            <div className="mt-6">
                                <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>{t('course_progress')}</span>
                                    <span>{course.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2.5 rounded-full" style={{ width: `${course.progress}%` }}></div>
                                </div>
                            </div>

                            <button onClick={() => setLogTimeModalOpen(true)} className="mt-4 w-full border border-emerald-600 text-emerald-600 py-2 rounded-md font-semibold hover:bg-emerald-50 transition-colors">
                                {t('log_time')}
                            </button>
                            <button onClick={handleStartLearning} className="mt-2 w-full bg-emerald-600 text-white py-3 rounded-md font-semibold hover:bg-emerald-700 transition-colors">
                                {t(course.progress > 0 ? 'continue_learning' : 'start_learning')}
                            </button>
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
        </>
    );
};

export default CourseDetail;