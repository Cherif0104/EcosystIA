import React, { useState, useMemo } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { TimeLog, Project, Course, Meeting, User } from '../types';
import LogTimeModal from './LogTimeModal';
import ConfirmationModal from './common/ConfirmationModal';

const MeetingFormModal: React.FC<{
    meeting: Meeting | null;
    users: User[];
    onClose: () => void;
    onSave: (meeting: Meeting | Omit<Meeting, 'id'>) => void;
}> = ({ meeting, users, onClose, onSave }) => {
    const { t } = useLocalization();
    const { user: currentUser } = useAuth();
    const isEditMode = meeting !== null;
    
    const [formData, setFormData] = useState({
        title: meeting?.title || '',
        description: meeting?.description || '',
        startDate: meeting ? new Date(meeting.startTime).toISOString().slice(0, 10) : '',
        startTime: meeting ? new Date(meeting.startTime).toTimeString().slice(0, 5) : '',
        endDate: meeting ? new Date(meeting.endTime).toISOString().slice(0, 10) : '',
        endTime: meeting ? new Date(meeting.endTime).toTimeString().slice(0, 5) : '',
        attendees: meeting?.attendees.map(u => u.id) || [currentUser?.id],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = Array.from(e.target.selectedOptions, option => Number(option.value));
        setFormData(prev => ({ ...prev, attendees: selectedIds }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        const attendees = users.filter(u => formData.attendees.includes(u.id));
        const meetingData = {
            title: formData.title,
            description: formData.description,
            startTime: new Date(`${formData.startDate}T${formData.startTime}`).toISOString(),
            endTime: new Date(`${formData.endDate}T${formData.endTime}`).toISOString(),
            attendees,
            organizerId: meeting?.organizerId || currentUser.id,
        };
        onSave(isEditMode ? { ...meeting, ...meetingData } as Meeting : meetingData as Omit<Meeting, 'id'>);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[70] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b"><h2 className="text-xl font-bold">{isEditMode ? t('edit_meeting') : t('new_meeting')}</h2></div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('meeting_title')}</label>
                            <input name="title" value={formData.title} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('start_date')}</label>
                                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('start_time')}</label>
                                <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                            </div>
                        </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('end_date')}</label>
                                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('end_time')}</label>
                                <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className="mt-1 block w-full p-2 border rounded-md" required/>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">{t('attendees')}</label>
                            <select multiple name="attendees" value={formData.attendees.map(String)} onChange={handleTeamChange} className="mt-1 block w-full p-2 border h-32 rounded-md">
                                {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
                            </select>
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-700">{t('description')}</label>
                             <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full p-2 border rounded-md"/>
                        </div>
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

const MeetingDetailModal: React.FC<{
    meeting: Meeting;
    onClose: () => void;
    onEdit: (meeting: Meeting) => void;
    onDelete: (meetingId: number) => void;
    onLogTime: (meeting: Meeting) => void;
}> = ({ meeting, onClose, onEdit, onDelete, onLogTime }) => {
    const { t } = useLocalization();
    const { user: currentUser } = useAuth();
    const canManage = currentUser?.id === meeting.organizerId || currentUser?.role === 'manager' || currentUser?.role === 'administrator' || currentUser?.role === 'super_administrator';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[70] p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-6 border-b flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold">{meeting.title}</h2>
                        <p className="text-sm text-gray-500">{new Date(meeting.startTime).toLocaleString()} - {new Date(meeting.endTime).toLocaleTimeString()}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times fa-lg"></i></button>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {meeting.description && <p>{meeting.description}</p>}
                    <div>
                        <h3 className="font-semibold mb-2">{t('attendees')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {meeting.attendees.map(a => (
                                <div key={a.id} className="flex items-center space-x-2 bg-gray-100 p-1 rounded-full">
                                    <img src={a.avatar} alt={a.name} className="w-6 h-6 rounded-full" />
                                    <span className="text-sm pr-2">{a.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
                    <button onClick={() => onLogTime(meeting)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 text-sm flex items-center"><i className="fas fa-clock mr-2"></i> {t('log_time_for_meeting')}</button>
                    {canManage && (
                        <div className="space-x-2">
                            <button onClick={() => onEdit(meeting)} className="font-medium text-blue-600 hover:text-blue-800">{t('edit')}</button>
                            <button onClick={() => onDelete(meeting.id)} className="font-medium text-red-600 hover:text-red-800">{t('delete')}</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

interface TimeTrackingProps {
  timeLogs: TimeLog[];
  meetings: Meeting[];
  users: User[];
  onAddTimeLog: (log: Omit<TimeLog, 'id' | 'userId'>) => void;
  onAddMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (meetingId: number) => void;
  projects: Project[];
  courses: Course[];
}

const TimeTracking: React.FC<TimeTrackingProps> = ({ timeLogs, meetings, users, onAddTimeLog, onAddMeeting, onUpdateMeeting, onDeleteMeeting, projects, courses }) => {
  const { t, language } = useLocalization();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'logs' | 'calendar'>('logs');

  const [isLogModalOpen, setLogModalOpen] = useState(false);
  const [isMeetingFormOpen, setMeetingFormOpen] = useState(false);
  const [isMeetingDetailOpen, setMeetingDetailOpen] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<number | null>(null);
  const [logInitialValues, setLogInitialValues] = useState<any>(null);

  const [currentDate, setCurrentDate] = useState(new Date());

  if (!user) return null;

  const userTimeLogs = timeLogs.filter(log => log.userId === user.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSaveLog = (logData: Omit<TimeLog, 'id' | 'userId'>) => {
    onAddTimeLog(logData);
    setLogModalOpen(false);
    setLogInitialValues(null);
  };

  const handleSaveMeeting = (data: Meeting | Omit<Meeting, 'id'>) => {
    if ('id' in data) onUpdateMeeting(data);
    else onAddMeeting(data);
    setMeetingFormOpen(false);
    setEditingMeeting(null);
  };
  
  const handleEditMeeting = (meeting: Meeting) => {
      setEditingMeeting(meeting);
      setMeetingDetailOpen(null);
      setMeetingFormOpen(true);
  }

  const handleLogTimeForMeeting = (meeting: Meeting) => {
    const start = new Date(meeting.startTime);
    const end = new Date(meeting.endTime);
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    setLogInitialValues({
        duration: duration.toString(),
        description: `Meeting: ${meeting.title}`,
        date: start.toISOString().slice(0, 10),
    });
    setMeetingDetailOpen(null);
    setLogModalOpen(true);
  };
  
  const getIconForEntityType = (type: 'project' | 'course' | 'task') => {
      switch (type) {
          case 'project': return 'fas fa-project-diagram';
          case 'course': return 'fas fa-book-open';
          case 'task': return 'fas fa-check-circle';
      }
  };

  // Calendar logic
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(day.getDate() + i);
      return day;
  });

  const meetingsByDay = useMemo(() => {
    const grouped: { [key: string]: Meeting[] } = {};
    meetings.forEach(m => {
        const meetingDate = new Date(m.startTime).toISOString().split('T')[0];
        if(!grouped[meetingDate]) grouped[meetingDate] = [];
        grouped[meetingDate].push(m);
    });
    return grouped;
  }, [meetings]);

  return (
    <>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{t('time_tracking')}</h1>
          <p className="mt-1 text-gray-600">{t('time_tracking_subtitle')}</p>
        </div>
        <button onClick={() => activeTab === 'logs' ? setLogModalOpen(true) : setMeetingFormOpen(true)} className="bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-emerald-700 flex items-center">
          <i className="fas fa-plus mr-2"></i>
          {activeTab === 'logs' ? t('log_time') : t('schedule_meeting')}
        </button>
      </div>

       <div className="mt-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('logs')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'logs' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t('my_time_logs')}</button>
                <button onClick={() => setActiveTab('calendar')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'calendar' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>{t('calendar_and_meetings')}</button>
            </nav>
       </div>

      {activeTab === 'logs' && (
        <div className="mt-6 bg-white rounded-lg shadow-lg">
            <div className="divide-y divide-gray-200">
            {userTimeLogs.length > 0 ? (
                userTimeLogs.map(log => (
                <div key={log.id} className="p-4 flex items-start space-x-4">
                    <div className="bg-gray-100 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
                        <i className={`${getIconForEntityType(log.entityType)} text-gray-500`}></i>
                    </div>
                    <div className="flex-grow">
                    <p className="font-semibold text-gray-800">{log.entityTitle}</p>
                    <p className="text-sm text-gray-600">{log.description}</p>
                    </div>
                    <div className="text-right">
                    <p className="font-bold text-emerald-600">{log.duration} {t('minutes')}</p>
                    <p className="text-xs text-gray-400">{new Date(log.date).toLocaleDateString()}</p>
                    </div>
                </div>
                ))
            ) : (
                <div className="text-center py-16 text-gray-500">
                <i className="fas fa-clock fa-3x mb-4"></i>
                <p>{t('no_time_logs_found')}</p>
                </div>
            )}
            </div>
        </div>
      )}
      
      {activeTab === 'calendar' && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                  <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() - 7)))} className="p-2 text-gray-600 hover:text-emerald-600"><i className="fas fa-chevron-left mr-2"></i> {t('previous_week')}</button>
                  <h2 className="text-xl font-bold">{startOfWeek.toLocaleDateString(language, {month: 'long', year: 'numeric'})}</h2>
                  <button onClick={() => setCurrentDate(d => new Date(d.setDate(d.getDate() + 7)))} className="p-2 text-gray-600 hover:text-emerald-600">{t('next_week')} <i className="fas fa-chevron-right ml-2"></i></button>
              </div>
               <button onClick={() => setCurrentDate(new Date())} className="block mx-auto text-sm text-emerald-600 font-semibold mb-4">{t('today')}</button>
              <div className="grid grid-cols-7 border-t border-l">
                  {weekDays.map(day => (
                      <div key={day.toISOString()} className="border-r border-b min-h-[200px]">
                          <div className="p-2 text-center border-b bg-gray-50">
                              <p className="text-xs font-semibold uppercase text-gray-500">{day.toLocaleDateString(language, { weekday: 'short' })}</p>
                              <p className={`font-bold text-lg ${day.toDateString() === new Date().toDateString() ? 'text-emerald-600' : 'text-gray-800'}`}>{day.getDate()}</p>
                          </div>
                          <div className="p-2 space-y-2">
                              {(meetingsByDay[day.toISOString().split('T')[0]] || []).map(meeting => (
                                  <button key={meeting.id} onClick={() => setMeetingDetailOpen(meeting)} className="w-full text-left p-2 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors">
                                      <p className="font-bold text-xs truncate">{meeting.title}</p>
                                      <p className="text-xs">{new Date(meeting.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                  </button>
                              ))}
                              {(meetingsByDay[day.toISOString().split('T')[0]] || []).length === 0 && (
                                  <p className="text-xs text-gray-400 text-center pt-4">{t('no_meetings_today')}</p>
                              )}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {isLogModalOpen && <LogTimeModal onClose={() => {setLogModalOpen(false); setLogInitialValues(null);}} onSave={handleSaveLog} projects={projects} courses={courses} user={user} initialValues={logInitialValues} />}
      {isMeetingFormOpen && <MeetingFormModal meeting={editingMeeting} users={users} onClose={() => {setMeetingFormOpen(false); setEditingMeeting(null);}} onSave={handleSaveMeeting} />}
      {isMeetingDetailOpen && <MeetingDetailModal meeting={isMeetingDetailOpen} onClose={() => setMeetingDetailOpen(null)} onEdit={handleEditMeeting} onDelete={(id) => {setDeletingMeetingId(id); setMeetingDetailOpen(null);}} onLogTime={handleLogTimeForMeeting}/>}
      {deletingMeetingId && <ConfirmationModal title={t('delete_meeting')} message={t('confirm_delete_message')} onConfirm={() => {onDeleteMeeting(deletingMeetingId); setDeletingMeetingId(null);}} onCancel={() => setDeletingMeetingId(null)} />}
    </>
  );
};

export default TimeTracking;
