import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContextSupabase';
import { useLocalization } from '../contexts/LocalizationContext';
import { Course, Job, Project, TimeLog, LeaveRequest, Invoice, Expense } from '../types';

interface DashboardProps {
  setView: (view: string) => void;
  projects: Project[];
  courses: Course[];
  jobs: Job[];
  timeLogs: TimeLog[];
  leaveRequests: LeaveRequest[];
  invoices: Invoice[];
  expenses: Expense[];
}

const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
    const { t } = useLocalization();
    return (
        <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center space-x-4">
            <div className="bg-emerald-100 text-emerald-600 rounded-lg p-3">
                <i className={`${course.icon} fa-lg`}></i>
            </div>
            <div className="flex-grow">
                <h3 className="font-bold text-gray-800">{course.title}</h3>
                <p className="text-sm text-gray-500">{course.instructor}</p>
                 <div className="mt-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>{t('course_progress')}</span>
                        <span>{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${course.progress}%` }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const JobCard: React.FC<{ job: Job }> = ({ job }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-gray-800">{job.title}</h3>
                    <p className="text-sm text-gray-600">{job.company}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${job.type === 'Full-time' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {job.type}
                </span>
            </div>
            <p className="text-sm text-gray-500 mt-2"><i className="fas fa-map-marker-alt mr-2"></i>{job.location}</p>
        </div>
    );
};

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
     const statusColor = {
        'In Progress': 'bg-blue-100 text-blue-800',
        'Completed': 'bg-green-100 text-green-800',
        'Not Started': 'bg-gray-100 text-gray-800',
    };
    return (
         <div className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
             <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800">{project.title}</h3>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[project.status]}`}>
                    {project.status}
                </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Due: {project.dueDate}</p>
        </div>
    );
}

const TimeSummaryCard: React.FC<{ timeLogs: TimeLog[]; setView: (view: string) => void; userId: number; }> = ({ timeLogs, setView, userId }) => {
    const { t } = useLocalization();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    
    const userLogs = timeLogs.filter(log => log.userId === userId);

    const timeToday = userLogs
        .filter(log => log.date === todayStr)
        .reduce((sum, log) => sum + log.duration, 0);

    const timeThisWeek = userLogs
        .filter(log => new Date(log.date) >= startOfWeek)
        .reduce((sum, log) => sum + log.duration, 0);
    
    const formatMinutes = (minutes: number) => {
        if (minutes < 60) return `${minutes} ${t('minutes')}`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">{t('time_tracking')}</h2>
                <a href="#" onClick={(e) => { e.preventDefault(); setView('time_tracking'); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-800">{t('view_time_logs')}</a>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold text-emerald-600">{formatMinutes(timeToday)}</p>
                    <p className="text-sm text-gray-500">{t('time_logged_today')}</p>
                </div>
                 <div>
                    <p className="text-2xl font-bold text-emerald-600">{formatMinutes(timeThisWeek)}</p>
                    <p className="text-sm text-gray-500">{t('time_logged_this_week')}</p>
                </div>
            </div>
        </div>
    );
};

const FinanceSummaryCard: React.FC<{ invoices: Invoice[]; expenses: Expense[]; setView: (view: string) => void; }> = ({ invoices, expenses, setView }) => {
    const { t } = useLocalization();

    const outstandingInvoices = useMemo(() => {
        return invoices.reduce((sum, inv) => {
            if (inv.status === 'Sent' || inv.status === 'Overdue') return sum + inv.amount;
            if (inv.status === 'Partially Paid') return sum + (inv.amount - (inv.paidAmount || 0));
            return sum;
        }, 0);
    }, [invoices]);

    const dueExpenses = useMemo(() => {
        return expenses.filter(exp => exp.status === 'Unpaid').reduce((sum, exp) => sum + exp.amount, 0);
    }, [expenses]);

    const formatCurrency = (amount: number) => {
        return `$${amount.toFixed(2)}`;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">{t('finance')}</h2>
                <a href="#" onClick={(e) => { e.preventDefault(); setView('finance'); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-800">{t('view_finance')}</a>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold text-orange-500">{formatCurrency(outstandingInvoices)}</p>
                    <p className="text-sm text-gray-500">{t('total_outstanding_invoices')}</p>
                </div>
                 <div>
                    <p className="text-2xl font-bold text-red-500">{formatCurrency(dueExpenses)}</p>
                    <p className="text-sm text-gray-500">{t('total_due_expenses')}</p>
                </div>
            </div>
        </div>
    );
};

const ProjectStatusPieChart: React.FC<{ projects: Project[] }> = ({ projects }) => {
    const { t } = useLocalization();

    const statusCounts = useMemo(() => {
        const counts: { [key in Project['status']]: number } = {
            'Not Started': 0,
            'In Progress': 0,
            'Completed': 0,
        };
        projects.forEach(p => counts[p.status]++);
        return counts;
    }, [projects]);

    const totalProjects = projects.length;
    if (totalProjects === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-700 mb-4">{t('project_status_overview')}</h2>
                <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                        <i className="fas fa-folder-open text-4xl"></i>
                    </div>
                    <p className="text-gray-600 mb-4">Aucun projet créé pour le moment</p>
                    <button 
                        onClick={() => setView('projects')}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        Créer votre premier projet
                    </button>
                </div>
            </div>
        );
    }

    const percentages = {
        completed: (statusCounts['Completed'] / totalProjects) * 100,
        inProgress: (statusCounts['In Progress'] / totalProjects) * 100,
        notStarted: (statusCounts['Not Started'] / totalProjects) * 100,
    };

    const conicGradient = `conic-gradient(
        #22c55e 0% ${percentages.completed}%,
        #3b82f6 ${percentages.completed}% ${percentages.completed + percentages.inProgress}%,
        #d1d5db ${percentages.completed + percentages.inProgress}% 100%
    )`;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-700 mb-4">{t('project_status_overview')}</h2>
            <div className="flex items-center justify-center space-x-8">
                <div className="relative w-32 h-32">
                    <div
                        className="rounded-full w-full h-full"
                        style={{ background: conicGradient }}
                    ></div>
                     <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold">{totalProjects}</span>
                    </div>
                </div>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span>
                        <span>{t('completed')} ({statusCounts['Completed']})</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                        <span>{t('in_progress')} ({statusCounts['In Progress']})</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-gray-300 mr-2"></span>
                        <span>{t('not_started')} ({statusCounts['Not Started']})</span>
                    </div>
                </div>
            </div>
        </div>
    );
};


const TeamAvailabilityCard: React.FC<{ leaveRequests: LeaveRequest[]; setView: (view: string) => void; }> = ({ leaveRequests, setView }) => {
    const { t } = useLocalization();
    const today = new Date();
    const nextSevenDays = new Date();
    nextSevenDays.setDate(today.getDate() + 7);

    const upcomingLeaves = leaveRequests.filter(req => {
        const startDate = new Date(req.startDate);
        return req.status === 'Approved' && startDate >= today && startDate <= nextSevenDays;
    }).sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">{t('team_availability')}</h2>
                 <a href="#" onClick={(e) => { e.preventDefault(); setView('leave_management'); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-800">{t('manage_leaves')}</a>
            </div>
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase">{t('upcoming_leaves')}</h3>
                {upcomingLeaves.length > 0 ? (
                    upcomingLeaves.slice(0, 3).map(req => (
                        <div key={req.id} className="flex items-center space-x-3">
                            <img src={req.userAvatar} alt={req.userName} className="w-8 h-8 rounded-full" />
                            <div>
                                <p className="font-semibold text-gray-700">{req.userName}</p>
                                <p className="text-xs text-gray-500">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-400">{t('no_upcoming_leaves')}</p>
                )}
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ setView, projects, courses, jobs, timeLogs, leaveRequests, invoices, expenses }) => {
  const { user } = useAuth();
  const { t } = useLocalization();

  if (!user) return null;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800">{t('dashboard_title')}</h1>
      <p className="mt-1 text-gray-600">{t('dashboard_subtitle')}, {user?.name}!</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <TimeSummaryCard timeLogs={timeLogs} setView={setView} userId={user.id} />
        <FinanceSummaryCard invoices={invoices} expenses={expenses} setView={setView} />
        <ProjectStatusPieChart projects={projects} />
        <TeamAvailabilityCard leaveRequests={leaveRequests} setView={setView} />
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">{t('my_projects')}</h2>
          <a href="#" onClick={(e) => { e.preventDefault(); setView('projects'); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-800">{t('view_all_projects')}</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {projects.filter(p => p.status !== 'Completed').slice(0, 2).map(project => <ProjectCard key={project.id} project={project} />)}
        </div>
      </div>
      
      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">{t('my_courses')}</h2>
          <a href="#" onClick={(e) => { e.preventDefault(); setView('courses'); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-800">{t('view_all_courses')}</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {courses.slice(0, 2).map(course => <CourseCard key={course.id} course={course} />)}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-700">{t('job_openings')}</h2>
          <a href="#" onClick={(e) => { e.preventDefault(); setView('jobs'); }} className="text-sm font-medium text-emerald-600 hover:text-emerald-800">{t('view_all_jobs')}</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.slice(0, 2).map(job => <JobCard key={job.id} job={job} />)}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;