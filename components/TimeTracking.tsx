import React, { useState, useMemo } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { useAuth } from '../contexts/AuthContextSupabase';
import { useModulePermissions } from '../hooks/useModulePermissions';
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
  onDeleteTimeLog: (logId: string) => void;
  onAddMeeting: (meeting: Omit<Meeting, 'id'>) => void;
  onUpdateMeeting: (meeting: Meeting) => void;
  onDeleteMeeting: (meetingId: number) => void;
  projects: Project[];
  courses: Course[];
}

const TimeTracking: React.FC<TimeTrackingProps> = ({ timeLogs, meetings, users, onAddTimeLog, onDeleteTimeLog, onAddMeeting, onUpdateMeeting, onDeleteMeeting, projects, courses }) => {
  const { t, language } = useLocalization();
  const { user } = useAuth();
  const { hasPermission } = useModulePermissions();
  const [activeTab, setActiveTab] = useState<'logs' | 'calendar'>('logs');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compact'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntityType, setFilterEntityType] = useState<'all' | 'project' | 'course' | 'task'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'entity'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isLogModalOpen, setLogModalOpen] = useState(false);
  const [isMeetingFormOpen, setMeetingFormOpen] = useState(false);
  const [isMeetingDetailOpen, setMeetingDetailOpen] = useState<Meeting | null>(null);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<number | null>(null);
  const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
  const [logInitialValues, setLogInitialValues] = useState<any>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!user) return null;

  // Filtrer les logs de l'utilisateur
  const userTimeLogs = useMemo(() => {
    // Utiliser profileId si disponible, sinon user.id (compatibilité)
    const userIdToMatch = user.profileId || String(user.id);
    return timeLogs.filter(log => String(log.userId) === userIdToMatch);
  }, [timeLogs, user.id, user.profileId]);

  // Calculer les métriques
  const metrics = useMemo(() => {
    const totalLogs = userTimeLogs.length;
    const totalMinutes = userTimeLogs.reduce((sum, log) => sum + log.duration, 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
    const avgMinutesPerDay = totalLogs > 0 ? Math.round(totalMinutes / 7) : 0; // Moyenne sur 7 jours
    const thisWeekLogs = userTimeLogs.filter(log => {
      const logDate = new Date(log.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return logDate >= weekAgo;
    }).length;

    return {
      totalLogs,
      totalHours,
      avgMinutesPerDay,
      thisWeekLogs
    };
  }, [userTimeLogs]);

  // Recherche et filtres
  const filteredAndSortedLogs = useMemo(() => {
    let filtered = [...userTimeLogs];

    // Filtre par type d'entité
    if (filterEntityType !== 'all') {
      filtered = filtered.filter(log => log.entityType === filterEntityType);
    }

    // Recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.entityTitle.toLowerCase().includes(query) ||
        log.description.toLowerCase().includes(query)
      );
    }

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'entity':
          comparison = a.entityTitle.localeCompare(b.entityTitle);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [userTimeLogs, searchQuery, filterEntityType, sortBy, sortOrder]);

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
      {/* Header avec gradient */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white rounded-xl shadow-lg p-6 mb-6">
        <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold mb-2">{t('time_tracking')}</h1>
            <p className="text-emerald-100">{t('time_tracking_subtitle')}</p>
        </div>
          <button 
            onClick={() => activeTab === 'logs' ? setLogModalOpen(true) : setMeetingFormOpen(true)} 
            className="bg-white text-emerald-600 font-bold py-2 px-4 rounded-lg hover:bg-emerald-50 flex items-center shadow-md"
          >
          <i className="fas fa-plus mr-2"></i>
          {activeTab === 'logs' ? t('log_time') : t('schedule_meeting')}
        </button>
      </div>
      </div>

      {/* Métriques Power BI style */}
      {activeTab === 'logs' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{t('total_logs')}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{metrics.totalLogs}</p>
              </div>
              <div className="bg-emerald-100 rounded-full p-3">
                <i className="fas fa-clock text-emerald-600 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{t('total_hours')}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{metrics.totalHours}h</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <i className="fas fa-hourglass-half text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{t('this_week')}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{metrics.thisWeekLogs}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <i className="fas fa-calendar-week text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{t('daily_average')}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{metrics.avgMinutesPerDay}m</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <i className="fas fa-chart-line text-orange-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
       <div className="mt-8 border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button 
            onClick={() => setActiveTab('logs')} 
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs' 
                ? 'border-emerald-500 text-emerald-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('my_time_logs')}
          </button>
          <button 
            onClick={() => setActiveTab('calendar')} 
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'calendar' 
                ? 'border-emerald-500 text-emerald-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {t('calendar_and_meetings')}
          </button>
            </nav>
       </div>

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="mt-6">
          {/* Recherche et filtres */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder={t('search') + '...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value as any)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">{t('all_types')}</option>
                <option value="project">{t('projects')}</option>
                <option value="course">{t('courses')}</option>
                <option value="task">{t('tasks')}</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500"
              >
                <option value="date">{t('sort_by_date')}</option>
                <option value="duration">{t('sort_by_duration')}</option>
                <option value="entity">{t('sort_by_entity')}</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <i className={`fas fa-sort-${sortOrder === 'asc' ? 'amount-down' : 'amount-up'}`}></i>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  <i className="fas fa-th"></i>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  <i className="fas fa-list"></i>
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`p-2 rounded-md ${viewMode === 'compact' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  <i className="fas fa-grip-lines"></i>
                </button>
              </div>
            </div>
            {searchQuery && (
              <div className="mt-3 text-sm text-gray-600">
                {filteredAndSortedLogs.length} {t('results_found')}
              </div>
            )}
          </div>

          {/* Liste des logs */}
          {filteredAndSortedLogs.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAndSortedLogs.map(log => (
                  <div key={log.id} className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="bg-emerald-100 rounded-full w-12 h-12 flex-shrink-0 flex items-center justify-center">
                        <i className={`${getIconForEntityType(log.entityType)} text-emerald-600 text-lg`}></i>
                      </div>
                      <button
                        onClick={() => setDeletingLogId(log.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                    <h3 className="font-semibold text-gray-800 mb-2">{log.entityTitle}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{log.description}</p>
                    <div className="flex justify-between items-center pt-3 border-t">
                      <span className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</span>
                      <span className="font-bold text-emerald-600">{log.duration} {t('minutes')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : viewMode === 'list' ? (
              <div className="bg-white rounded-lg shadow-md divide-y divide-gray-200">
                {filteredAndSortedLogs.map(log => (
                  <div key={log.id} className="p-4 flex items-start space-x-4 hover:bg-gray-50">
                    <div className="bg-emerald-100 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
                      <i className={`${getIconForEntityType(log.entityType)} text-emerald-600`}></i>
                    </div>
                    <div className="flex-grow">
                    <p className="font-semibold text-gray-800">{log.entityTitle}</p>
                    <p className="text-sm text-gray-600">{log.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(log.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                    <p className="font-bold text-emerald-600">{log.duration} {t('minutes')}</p>
                      <button
                        onClick={() => setDeletingLogId(log.id)}
                        className="text-red-500 hover:text-red-700 text-sm mt-2"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('entity')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('description')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('date')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('duration')}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAndSortedLogs.map(log => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <i className={`${getIconForEntityType(log.entityType)} text-emerald-600 mr-2`}></i>
                            <span className="font-medium">{log.entityTitle}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{log.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{new Date(log.date).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-semibold text-emerald-600">{log.duration} {t('minutes')}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setDeletingLogId(log.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="bg-white rounded-lg shadow-md p-16 text-center">
              <i className="fas fa-clock fa-4x text-gray-300 mb-4"></i>
              <p className="text-gray-500 text-lg">{t('no_time_logs_found')}</p>
              <button
                onClick={() => setLogModalOpen(true)}
                className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
              >
                <i className="fas fa-plus mr-2"></i>
                {t('log_time')}
              </button>
                </div>
            )}
        </div>
      )}
      
      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} 
              className="p-2 text-gray-600 hover:text-emerald-600"
            >
              <i className="fas fa-chevron-left mr-2"></i> {t('previous_week')}
            </button>
                  <h2 className="text-xl font-bold">{startOfWeek.toLocaleDateString(language, {month: 'long', year: 'numeric'})}</h2>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} 
              className="p-2 text-gray-600 hover:text-emerald-600"
            >
              {t('next_week')} <i className="fas fa-chevron-right ml-2"></i>
            </button>
              </div>
          <button 
            onClick={() => setCurrentDate(new Date())} 
            className="block mx-auto text-sm text-emerald-600 font-semibold mb-4"
          >
            {t('today')}
          </button>
              <div className="grid grid-cols-7 border-t border-l">
                  {weekDays.map(day => (
                      <div key={day.toISOString()} className="border-r border-b min-h-[200px]">
                          <div className="p-2 text-center border-b bg-gray-50">
                              <p className="text-xs font-semibold uppercase text-gray-500">{day.toLocaleDateString(language, { weekday: 'short' })}</p>
                              <p className={`font-bold text-lg ${day.toDateString() === new Date().toDateString() ? 'text-emerald-600' : 'text-gray-800'}`}>{day.getDate()}</p>
                          </div>
                          <div className="p-2 space-y-2">
                              {(meetingsByDay[day.toISOString().split('T')[0]] || []).map(meeting => (
                    <button 
                      key={meeting.id} 
                      onClick={() => setMeetingDetailOpen(meeting)} 
                      className="w-full text-left p-2 rounded-md bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                    >
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

      {/* Modals */}
      {isLogModalOpen && (
        <LogTimeModal 
          onClose={() => {
            setLogModalOpen(false); 
            setLogInitialValues(null);
          }} 
          onSave={handleSaveLog} 
          projects={projects} 
          courses={courses} 
          user={user} 
          initialValues={logInitialValues} 
        />
      )}
      {isMeetingFormOpen && (
        <MeetingFormModal 
          meeting={editingMeeting} 
          users={users} 
          onClose={() => {
            setMeetingFormOpen(false); 
            setEditingMeeting(null);
          }} 
          onSave={handleSaveMeeting} 
        />
      )}
      {isMeetingDetailOpen && (
        <MeetingDetailModal 
          meeting={isMeetingDetailOpen} 
          onClose={() => setMeetingDetailOpen(null)} 
          onEdit={handleEditMeeting} 
          onDelete={(id) => {
            setDeletingMeetingId(id); 
            setMeetingDetailOpen(null);
          }} 
          onLogTime={handleLogTimeForMeeting}
        />
      )}
      {deletingMeetingId && (
        <ConfirmationModal 
          title={t('delete_meeting')} 
          message={t('confirm_delete_message')} 
          onConfirm={() => {
            onDeleteMeeting(deletingMeetingId); 
            setDeletingMeetingId(null);
          }} 
          onCancel={() => setDeletingMeetingId(null)} 
        />
      )}
      {deletingLogId && (
        <ConfirmationModal 
          title={t('delete_log')} 
          message={t('confirm_delete_log_message')} 
          onConfirm={() => {
            onDeleteTimeLog(deletingLogId);
            setDeletingLogId(null);
          }} 
          onCancel={() => setDeletingLogId(null)} 
        />
      )}
    </>
  );
};

export default TimeTracking;
