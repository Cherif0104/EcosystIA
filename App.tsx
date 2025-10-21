import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContextSupabase';
import { authGuard } from './middleware/authGuard';
import { mockCourses, mockJobs, mockProjects, mockGoals, mockContacts, mockDocuments, mockAllUsers, mockTimeLogs, mockLeaveRequests, mockInvoices, mockExpenses, mockRecurringInvoices, mockRecurringExpenses, mockBudgets, mockMeetings } from './constants/data';
import { Course, Job, Project, Objective, Contact, Document, User, Role, TimeLog, LeaveRequest, Invoice, Expense, AppNotification, RecurringInvoice, RecurringExpense, RecurrenceFrequency, Budget, Meeting } from './types';
import { useLocalization } from './contexts/LocalizationContext';
import DataAdapter from './services/dataAdapter';

import Login from './components/Login';
import Signup from './components/Signup';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Courses from './components/Courses';
import Jobs from './components/Jobs';
import AICoach from './components/AICoach';
import Settings from './components/Settings';
import Projects from './components/Projects';
import GenAILab from './components/GenAILab';
import CourseDetail from './components/CourseDetail';
import CourseManagement from './components/CourseManagement';
import Analytics from './components/Analytics';
import TalentAnalytics from './components/TalentAnalytics';
import Goals from './components/Goals';
import CRM from './components/CRM';
import KnowledgeBase from './components/KnowledgeBase';
import CreateJob from './components/CreateJob';
import UserManagement from './components/UserManagement';
import AIAgent from './components/AIAgent';
import TimeTracking from './components/TimeTracking';
import LeaveManagement from './components/LeaveManagement';
import Finance from './components/Finance';


const App: React.FC = () => {
  const { user, signIn } = useAuth();
  const { t } = useLocalization();
  const [authView, setAuthView] = useState<'login' | 'signup'>('login');
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOperation, setLoadingOperation] = useState<string | null>(null);
  
  // Lifted State
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [projects, setProjects] = useState<Project[]>([]); // Plus de données mockées - uniquement Supabase
  const [objectives, setObjectives] = useState<Objective[]>(mockGoals);
  const [contacts, setContacts] = useState<Contact[]>(mockContacts);
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [users, setUsers] = useState<User[]>(mockAllUsers);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(mockTimeLogs);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>(mockRecurringInvoices);
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(mockRecurringExpenses);
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [reminderDays, setReminderDays] = useState<number>(3);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Initialisation avec protection de routes
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Vérifier l'authentification
        const isAuthenticated = await authGuard.checkAuth();
        
        if (isAuthenticated) {
          console.log('✅ Utilisateur authentifié - accès autorisé');
          // L'utilisateur reste sur la page actuelle (pas de redirection)
        } else {
          console.log('🔒 Utilisateur non authentifié - redirection vers login');
          setCurrentView('login');
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Erreur initialisation app:', error);
        setCurrentView('login');
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Charger les données après initialisation - Logique robuste
  useEffect(() => {
    if (!isInitialized) return; // Attendre l'initialisation seulement
    
    const loadData = async () => {
      try {
        if (user) {
          console.log('🔄 Chargement des projets depuis Supabase...');
          
          // Charger UNIQUEMENT les projets depuis Supabase
          const projectsData = await DataAdapter.getProjects();
          setProjects(projectsData);
          
          console.log('✅ Projets chargés depuis Supabase:', projectsData.length, 'projets');
          
          // Charger les objectifs depuis Supabase
          console.log('🔄 Chargement des objectifs depuis Supabase...');
          const objectivesData = await DataAdapter.getObjectives();
          setObjectives(objectivesData);
          
          console.log('✅ Objectifs chargés depuis Supabase:', objectivesData.length, 'objectifs');
        } else {
          console.log('🔄 Utilisateur non connecté - aucun projet à charger');
          setProjects([]);
          setObjectives([]);
        }
        
        setIsDataLoaded(true);
      } catch (error) {
        console.error('Erreur chargement données:', error);
        setProjects([]); // Pas de fallback mocké
        setObjectives([]);
        setIsDataLoaded(true);
      }
    };

    // Recharger les données quand user change
    loadData();
  }, [isInitialized, user]); // Retirer isDataLoaded des dépendances

  // Protection de routes - rediriger vers login si non authentifié
  useEffect(() => {
    // Ajouter un délai pour éviter les redirections prématurées
    const timeoutId = setTimeout(() => {
      if (isInitialized && !user && currentView !== 'login' && currentView !== 'signup') {
        console.log('🔒 Protection route - redirection vers login');
        setCurrentView('login');
        setIsDataLoaded(false); // Reset pour permettre le rechargement
      } else if (isInitialized && user && currentView === 'login') {
        console.log('✅ Utilisateur connecté - redirection vers dashboard');
        setCurrentView('dashboard');
      }
    }, 100); // Délai de 100ms pour éviter les redirections prématurées

    return () => clearTimeout(timeoutId);
  }, [user, isInitialized]); // Retirer currentView des dépendances pour éviter les boucles

  // Debug: Log de l'état utilisateur
  useEffect(() => {
    console.log('🔍 Debug App.tsx - État utilisateur:', { 
      isInitialized, 
      user: user ? 'présent' : 'null', 
      currentView,
      isDataLoaded 
    });
  }, [isInitialized, user, currentView, isDataLoaded]);

  // Ancien useEffect supprimé - maintenant géré par le useEffect unifié ci-dessus


  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  
    // --- Recurring Item Generation ---
    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const newInvoices: Invoice[] = [];
        const updatedRecurringInvoices = recurringInvoices.map(ri => {
            const lastGen = new Date(ri.lastGeneratedDate);
            const nextGen = new Date(lastGen);
            if (ri.frequency === 'Monthly') nextGen.setMonth(nextGen.getMonth() + 1);
            else if (ri.frequency === 'Quarterly') nextGen.setMonth(nextGen.getMonth() + 3);
            else if (ri.frequency === 'Annually') nextGen.setFullYear(nextGen.getFullYear() + 1);

            if (today >= nextGen && (!ri.endDate || today <= new Date(ri.endDate))) {
                newInvoices.push({
                    id: Date.now() + Math.random(),
                    invoiceNumber: `INV-${Date.now().toString().slice(-5)}`,
                    clientName: ri.clientName,
                    amount: ri.amount,
                    dueDate: nextGen.toISOString().split('T')[0],
                    status: 'Sent',
                    recurringSourceId: ri.id,
                });
                return { ...ri, lastGeneratedDate: today.toISOString().split('T')[0] };
            }
            return ri;
        });

        if (newInvoices.length > 0) {
            setInvoices(prev => [...prev, ...newInvoices]);
            setRecurringInvoices(updatedRecurringInvoices);
        }

        const newExpenses: Expense[] = [];
        const updatedRecurringExpenses = recurringExpenses.map(re => {
            const lastGen = new Date(re.lastGeneratedDate);
            const nextGen = new Date(lastGen);
            if (re.frequency === 'Monthly') nextGen.setMonth(nextGen.getMonth() + 1);
            else if (re.frequency === 'Quarterly') nextGen.setMonth(nextGen.getMonth() + 3);
            else if (re.frequency === 'Annually') nextGen.setFullYear(nextGen.getFullYear() + 1);

            if (today >= nextGen && (!re.endDate || today <= new Date(re.endDate))) {
                 newExpenses.push({
                    id: Date.now() + Math.random(),
                    category: re.category,
                    description: re.description,
                    amount: re.amount,
                    date: today.toISOString().split('T')[0],
                    dueDate: nextGen.toISOString().split('T')[0],
                    status: 'Unpaid',
                    recurringSourceId: re.id,
                });
                return { ...re, lastGeneratedDate: today.toISOString().split('T')[0] };
            }
            return re;
        });

        if (newExpenses.length > 0) {
            setExpenses(prev => [...prev, ...newExpenses]);
            setRecurringExpenses(updatedRecurringExpenses);
        }

    }, []); // Run only on app load


  // --- Notification Generation ---
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newNotifications: AppNotification[] = [];

    invoices.forEach(inv => {
        if (inv.status === 'Paid') return;
        const dueDate = new Date(inv.dueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= reminderDays) {
            newNotifications.push({
                id: `inv-${inv.id}`,
                message: t('invoice_due_reminder').replace('{invoiceNumber}', inv.invoiceNumber).replace('{dueDate}', inv.dueDate),
                date: inv.dueDate,
                entityType: 'invoice',
                entityId: inv.id,
                isRead: false
            });
        }
    });

    expenses.forEach(exp => {
        if (!exp.dueDate) return;
        const dueDate = new Date(exp.dueDate);
        const diffTime = dueDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= reminderDays) {
            newNotifications.push({
                id: `exp-${exp.id}`,
                message: t('expense_due_reminder').replace('{description}', exp.description).replace('{dueDate}', exp.dueDate),
                date: exp.dueDate,
                entityType: 'expense',
                entityId: exp.id,
                isRead: false
            });
        }
    });

    setNotifications(newNotifications.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

  }, [invoices, expenses, reminderDays, t]);

  if (!user) {
    if (authView === 'signup') {
        return <Signup onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <Login onSwitchToSignup={() => setAuthView('signup')} onLoginSuccess={() => setCurrentView('dashboard')} />;
  }

  // --- CRUD & State Handlers ---
  
    // NOTIFICATIONS
    const handleMarkNotificationAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleClearAllNotifications = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    // RECURRING INVOICES
    const handleAddRecurringInvoice = (data: Omit<RecurringInvoice, 'id'>) => setRecurringInvoices(prev => [{ ...data, id: Date.now() }, ...prev]);
    const handleUpdateRecurringInvoice = (updated: RecurringInvoice) => setRecurringInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
    const handleDeleteRecurringInvoice = (id: number) => setRecurringInvoices(prev => prev.filter(i => i.id !== id));

    // RECURRING EXPENSES
    const handleAddRecurringExpense = (data: Omit<RecurringExpense, 'id'>) => setRecurringExpenses(prev => [{ ...data, id: Date.now() }, ...prev]);
    const handleUpdateRecurringExpense = (updated: RecurringExpense) => setRecurringExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    const handleDeleteRecurringExpense = (id: number) => setRecurringExpenses(prev => prev.filter(e => e.id !== id));


  // INVOICES
  const handleAddInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    try {
      const newInvoice = await DataAdapter.createInvoice(invoiceData);
      if (newInvoice) {
        setInvoices(prev => [newInvoice, ...prev]);
      }
    } catch (error) {
      console.error('Erreur création facture:', error);
      // Fallback vers l'ancienne méthode
      const fallbackInvoice: Invoice = { ...invoiceData, id: Date.now() };
      setInvoices(prev => [fallbackInvoice, ...prev]);
    }
  };
    const handleUpdateInvoice = (updatedInvoice: Invoice) => {
        setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? updatedInvoice : i));
    };
    const handleDeleteInvoice = (invoiceId: number) => {
        setInvoices(prev => prev.filter(i => i.id !== invoiceId));
    };

  // EXPENSES
  const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
      const newExpense = await DataAdapter.createExpense(expenseData);
      if (newExpense) {
        setExpenses(prev => [newExpense, ...prev]);
      }
    } catch (error) {
      console.error('Erreur création dépense:', error);
      // Fallback vers l'ancienne méthode
      const fallbackExpense: Expense = { ...expenseData, id: Date.now() };
      setExpenses(prev => [fallbackExpense, ...prev]);
    }
  };
    const handleUpdateExpense = (updatedExpense: Expense) => {
        setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    };
    const handleDeleteExpense = (expenseId: number) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
    };
    
    // BUDGETS
    const handleAddBudget = (budgetData: Omit<Budget, 'id'>) => {
        const newBudget: Budget = { ...budgetData, id: Date.now() };
        setBudgets(prev => [newBudget, ...prev]);
    };
    const handleUpdateBudget = (updatedBudget: Budget) => {
        setBudgets(prev => prev.map(b => b.id === updatedBudget.id ? updatedBudget : b));
    };
    const handleDeleteBudget = (budgetId: number) => {
        const budgetToDelete = budgets.find(b => b.id === budgetId);
        if (!budgetToDelete) return;
        
        const itemIdsToDelete = new Set<string>();
        budgetToDelete.budgetLines.forEach(line => {
            line.items.forEach(item => {
                itemIdsToDelete.add(item.id);
            });
        });

        // Unlink expenses from the deleted budget items
        setExpenses(prev => prev.map(e => 
            e.budgetItemId && itemIdsToDelete.has(e.budgetItemId) 
            ? { ...e, budgetItemId: undefined } 
            : e
        ));

        setBudgets(prev => prev.filter(b => b.id !== budgetId));
    };

  // MEETINGS
  const handleAddMeeting = (meetingData: Omit<Meeting, 'id'>) => {
      const newMeeting: Meeting = { ...meetingData, id: Date.now() };
      setMeetings(prev => [newMeeting, ...prev].sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
  };
  const handleUpdateMeeting = (updatedMeeting: Meeting) => {
      setMeetings(prev => prev.map(m => m.id === updatedMeeting.id ? updatedMeeting : m).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
  };
  const handleDeleteMeeting = (meetingId: number) => {
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
  };


  // LEAVE REQUESTS
  const handleAddLeaveRequest = (requestData: Omit<LeaveRequest, 'id' | 'userId' | 'userName' | 'userAvatar' | 'status'>) => {
    if (!user) return;
    const newRequest: LeaveRequest = {
      id: Date.now(),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      status: 'Pending',
      ...requestData,
    };
    setLeaveRequests(prev => [newRequest, ...prev]);
  };

  const handleUpdateLeaveRequestStatus = (requestId: number, status: 'Approved' | 'Rejected') => {
      setLeaveRequests(prev => prev.map(req => req.id === requestId ? {...req, status} : req));
  }


  // TIME LOGS
  const handleAddTimeLog = (logData: Omit<TimeLog, 'id' | 'userId'>) => {
    if (!user) return;
    const newLog: TimeLog = {
      id: Date.now(),
      userId: user.id,
      ...logData,
    };
    setTimeLogs(prev => [newLog, ...prev]);
  };


  // USERS
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    // Also update user in project teams if they are part of any
    setProjects(prevProjects => prevProjects.map(p => ({
        ...p,
        team: p.team.map(member => member.id === updatedUser.id ? updatedUser : member)
    })));
  };

  // JOBS
  const handleAddJob = (newJob: Job) => {
    setJobs(prev => [newJob, ...prev]);
    handleSetView('jobs');
  };
  
  // PROJECTS
  const handleAddProject = async (projectData: Omit<Project, 'id' | 'tasks' | 'risks'>) => {
    setLoadingOperation('create');
    setIsLoading(true);
    
    try {
      console.log('🔄 Création projet avec données:', projectData);
      const newProject = await DataAdapter.createProject({
        ...projectData,
        tasks: [],
        risks: [],
      });
      
      console.log('📊 Projet créé:', newProject);
      
      if (newProject) {
        setProjects(prev => {
          const updated = [newProject, ...prev];
          console.log('✅ Projets mis à jour:', updated.length);
          return updated;
        });
        
        // Recharger les projets pour s'assurer que les données sont à jour
        setTimeout(async () => {
          try {
            console.log('🔄 Rechargement des projets après création...');
            const projects = await DataAdapter.getProjects();
            setProjects(projects);
            console.log('✅ Projets rechargés:', projects.length);
          } catch (error) {
            console.error('❌ Erreur rechargement projets:', error);
          }
        }, 1000);
      } else {
        console.error('❌ Aucun projet retourné par DataAdapter');
        throw new Error('Aucun projet retourné par le serveur');
      }
    } catch (error) {
      console.error('Erreur création projet:', error);
      // TODO: Remplacer par une notification toast
      alert('Erreur lors de la création du projet. Veuillez réessayer.');
    } finally {
      setLoadingOperation(null);
      setIsLoading(false);
    }
  };
  
  const handleUpdateProject = async (updatedProject: Project) => {
    setLoadingOperation('update');
    setIsLoading(true);
    
    try {
      console.log('🔄 Mise à jour projet avec données:', updatedProject);
      const result = await DataAdapter.updateProject(updatedProject);
      
      if (result) {
        setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
        console.log('✅ Projet mis à jour avec succès');
      } else {
        console.error('❌ Échec de la mise à jour du projet');
        throw new Error('Échec de la mise à jour du projet');
      }
    } catch (error) {
      console.error('Erreur mise à jour projet:', error);
      // TODO: Remplacer par une notification toast
      alert('Erreur lors de la mise à jour du projet. Veuillez réessayer.');
    } finally {
      setLoadingOperation(null);
      setIsLoading(false);
    }
  };
  
  const handleDeleteProject = async (projectId: number) => {
    setLoadingOperation('delete');
    setIsLoading(true);
    
    try {
      console.log('🔄 Suppression projet ID:', projectId);
      const result = await DataAdapter.deleteProject(projectId);
      
      if (result) {
        setProjects(prev => prev.filter(p => p.id !== projectId));
        // Also delete related OKRs
        setObjectives(prev => prev.filter(o => o.projectId !== projectId));
        console.log('✅ Projet supprimé avec succès');
      } else {
        console.error('❌ Échec de la suppression du projet');
        throw new Error('Échec de la suppression du projet');
      }
    } catch (error) {
      console.error('Erreur suppression projet:', error);
      // TODO: Remplacer par une notification toast
      alert('Erreur lors de la suppression du projet. Veuillez réessayer.');
    } finally {
      setLoadingOperation(null);
      setIsLoading(false);
    }
  };

  // OBJECTIVES (OKRs)
  const handleSetObjectives = (newObjectives: Objective[]) => {
      setObjectives(newObjectives);
  };
  
  const handleAddObjective = async (objectiveData: Omit<Objective, 'id'>) => {
    setLoadingOperation('create_objective');
    setIsLoading(true);
    
    try {
      console.log('🔄 Création objectif avec données:', objectiveData);
      
      const newObjective = await DataAdapter.createObjective(objectiveData);
      
      if (newObjective) {
        setObjectives(prev => [newObjective, ...prev]);
        console.log('✅ Objectif créé:', newObjective.id);
      } else {
        throw new Error('Aucun objectif retourné par le serveur');
      }
    } catch (error) {
      console.error('Erreur création objectif:', error);
      alert('Erreur lors de la création de l\'objectif. Veuillez réessayer.');
    } finally {
      setLoadingOperation(null);
      setIsLoading(false);
    }
  };
  
  const handleUpdateObjective = async (updatedObjective: Objective) => {
    setLoadingOperation('update_objective');
    setIsLoading(true);
    
    try {
      console.log('🔄 Mise à jour objectif avec données:', updatedObjective);
      
      const updated = await DataAdapter.updateObjective(updatedObjective.id, updatedObjective);
      
      if (updated) {
        setObjectives(prev => prev.map(o => o.id === updated.id ? updated : o));
        console.log('✅ Objectif mis à jour avec succès');
      } else {
        throw new Error('Aucun objectif retourné par le serveur');
      }
    } catch (error) {
      console.error('Erreur mise à jour objectif:', error);
      alert('Erreur lors de la mise à jour de l\'objectif. Veuillez réessayer.');
    } finally {
      setLoadingOperation(null);
      setIsLoading(false);
    }
  };
  
  const handleDeleteObjective = async (objectiveId: string) => {
    setLoadingOperation('delete_objective');
    setIsLoading(true);
    
    try {
      console.log('🔄 Suppression objectif ID:', objectiveId);
      
      const success = await DataAdapter.deleteObjective(objectiveId);
      
      if (success) {
        setObjectives(prev => prev.filter(o => o.id !== objectiveId));
        console.log('✅ Objectif supprimé avec succès');
      } else {
        throw new Error('Échec de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression objectif:', error);
      alert('Erreur lors de la suppression de l\'objectif. Veuillez réessayer.');
    } finally {
      setLoadingOperation(null);
      setIsLoading(false);
    }
  };


  // COURSES
  const handleAddCourse = (courseData: Omit<Course, 'id' | 'progress'>) => {
      const newCourse: Course = {
          id: Date.now(),
          progress: 0,
          ...courseData,
      };
      setCourses(prev => [newCourse, ...prev]);
  };
  const handleUpdateCourse = (updatedCourse: Course) => {
      setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };
  const handleDeleteCourse = (courseId: number) => {
      setCourses(prev => prev.filter(c => c.id !== courseId));
  };


  // CONTACTS (CRM)
  const handleAddContact = async (contactData: Omit<Contact, 'id'>) => {
    try {
      const newContact = await DataAdapter.createContact(contactData);
      if (newContact) {
        setContacts(prev => [newContact, ...prev]);
      }
    } catch (error) {
      console.error('Erreur création contact:', error);
      // Fallback vers l'ancienne méthode
      const fallbackContact: Contact = { ...contactData, id: Date.now() };
      setContacts(prev => [fallbackContact, ...prev]);
    }
  };
  const handleUpdateContact = (updatedContact: Contact) => {
      setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
  };
  const handleDeleteContact = (contactId: number) => {
      setContacts(prev => prev.filter(c => c.id !== contactId));
  };

  
  // DOCUMENTS (Knowledge Base)
  const handleAddDocument = (newDocument: Document) => {
      setDocuments(prev => [newDocument, ...prev]);
  }

  // --- View Management ---

  const handleSetView = (view: string) => {
    setCurrentView(view);
    if (view !== 'course_detail') {
      setSelectedCourseId(null);
    }
    if(window.innerWidth < 1024) { 
        setSidebarOpen(false);
    }
  }

  const handleSelectCourse = (id: number) => {
    setSelectedCourseId(id);
    setCurrentView('course_detail');
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard setView={handleSetView} projects={projects} courses={courses} jobs={jobs} timeLogs={timeLogs} leaveRequests={leaveRequests} invoices={invoices} expenses={expenses} />;
      case 'time_tracking':
        return <TimeTracking 
                    timeLogs={timeLogs} 
                    onAddTimeLog={handleAddTimeLog} 
                    projects={projects} 
                    courses={courses}
                    meetings={meetings}
                    users={users}
                    onAddMeeting={handleAddMeeting}
                    onUpdateMeeting={handleUpdateMeeting}
                    onDeleteMeeting={handleDeleteMeeting}
                />;
      case 'projects':
        return <Projects 
                    projects={projects} 
                    users={users}
                    timeLogs={timeLogs}
                    onUpdateProject={handleUpdateProject} 
                    onAddProject={handleAddProject}
                    onDeleteProject={handleDeleteProject}
                    onAddTimeLog={handleAddTimeLog}
                    isLoading={isLoading}
                    loadingOperation={loadingOperation}
                />;
      case 'goals_okrs':
        return <Goals 
                    projects={projects} 
                    objectives={objectives} 
                    setObjectives={handleSetObjectives} 
                    onAddObjective={handleAddObjective}
                    onUpdateObjective={handleUpdateObjective}
                    onDeleteObjective={handleDeleteObjective}
                />;
      case 'courses':
        return <Courses courses={courses} onSelectCourse={handleSelectCourse} />;
      case 'course_detail':
        const course = courses.find(c => c.id === selectedCourseId);
        return course ? <CourseDetail course={course} onBack={() => handleSetView('courses')} timeLogs={timeLogs} onAddTimeLog={handleAddTimeLog} projects={projects} onUpdateCourse={handleUpdateCourse} /> : <Courses courses={courses} onSelectCourse={handleSelectCourse}/>;
      case 'course_management':
          return <CourseManagement 
                    courses={courses} 
                    onAddCourse={handleAddCourse}
                    onUpdateCourse={handleUpdateCourse}
                    onDeleteCourse={handleDeleteCourse}
                  />;
      case 'jobs':
        return <Jobs jobs={jobs} setJobs={setJobs} setView={handleSetView}/>;
      case 'create_job':
        return <CreateJob onAddJob={handleAddJob} onBack={() => handleSetView('jobs')} />;
      case 'user_management':
        return <UserManagement users={users} onUpdateUser={handleUpdateUser} />;
      case 'crm_sales':
        return <CRM 
                    contacts={contacts} 
                    onAddContact={handleAddContact}
                    onUpdateContact={handleUpdateContact}
                    onDeleteContact={handleDeleteContact}
                />;
      case 'knowledge_base':
        return <KnowledgeBase documents={documents} onAddDocument={handleAddDocument} />;
      case 'leave_management':
        return <LeaveManagement 
                    leaveRequests={leaveRequests}
                    onAddLeaveRequest={handleAddLeaveRequest}
                    onUpdateLeaveRequestStatus={handleUpdateLeaveRequestStatus}
                />;
      case 'finance':
        return <Finance 
                    invoices={invoices}
                    expenses={expenses}
                    recurringInvoices={recurringInvoices}
                    recurringExpenses={recurringExpenses}
                    budgets={budgets}
                    projects={projects}
                    onAddInvoice={handleAddInvoice}
                    onUpdateInvoice={handleUpdateInvoice}
                    onDeleteInvoice={handleDeleteInvoice}
                    onAddExpense={handleAddExpense}
                    onUpdateExpense={handleUpdateExpense}
                    onDeleteExpense={handleDeleteExpense}
                    onAddRecurringInvoice={handleAddRecurringInvoice}
                    onUpdateRecurringInvoice={handleUpdateRecurringInvoice}
                    onDeleteRecurringInvoice={handleDeleteRecurringInvoice}
                    onAddRecurringExpense={handleAddRecurringExpense}
                    onUpdateRecurringExpense={handleUpdateRecurringExpense}
                    onDeleteRecurringExpense={handleDeleteRecurringExpense}
                    onAddBudget={handleAddBudget}
                    onUpdateBudget={handleUpdateBudget}
                    onDeleteBudget={handleDeleteBudget}
                />;
      case 'ai_coach':
        return <AICoach />;
      case 'gen_ai_lab':
        return <GenAILab />;
      case 'analytics':
        return <Analytics setView={handleSetView} />;
      case 'talent_analytics':
        return <TalentAnalytics setView={handleSetView} />;
      case 'settings':
        return <Settings reminderDays={reminderDays} onSetReminderDays={setReminderDays} />;
      default:
        return <Dashboard setView={handleSetView} projects={projects} courses={courses} jobs={jobs} timeLogs={timeLogs} leaveRequests={leaveRequests} invoices={invoices} expenses={expenses}/>;
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar currentView={currentView} setView={handleSetView} isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
            toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} 
            setView={handleSetView}
            notifications={notifications}
            onMarkNotificationAsRead={handleMarkNotificationAsRead}
            onClearAllNotifications={handleClearAllNotifications}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            {renderView()}
          </div>
        </main>
      </div>
       {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black opacity-50 z-40 lg:hidden"></div>}
       <AIAgent currentView={currentView} />
    </div>
  );
};

export default App;
