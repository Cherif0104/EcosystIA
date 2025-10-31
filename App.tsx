import React, { useState, useEffect } from 'react';
import { useAuth } from './contexts/AuthContextSupabase';
import { authGuard } from './middleware/authGuard';
import { mockProjects, mockGoals } from './constants/data';
import { Course, Job, Project, Objective, Contact, Document, User, Role, TimeLog, LeaveRequest, Invoice, Expense, AppNotification, RecurringInvoice, RecurringExpense, RecurrenceFrequency, Budget, Meeting } from './types';
import { useLocalization } from './contexts/LocalizationContext';
import DataAdapter from './services/dataAdapter';
import DataService from './services/dataService';
import { logger } from './services/loggerService';

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
import JobManagement from './components/JobManagement';
import LeaveManagementAdmin from './components/LeaveManagementAdmin';
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
  
  // Récupérer la vue précédente depuis localStorage (pour éviter le flash au refresh)
  const savedView = typeof window !== 'undefined' ? localStorage.getItem('lastView') : null;
  // Valider que la vue sauvegardée est valide (pas login/signup)
  const validInitialView = savedView && savedView !== 'login' && savedView !== 'signup' ? savedView : 'dashboard';
  const [currentView, setCurrentView] = useState(validInitialView);
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingOperation, setLoadingOperation] = useState<string | null>(null);
  
  // Lifted State
  const [courses, setCourses] = useState<Course[]>([]); // Plus de données mockées - uniquement Supabase
  const [jobs, setJobs] = useState<Job[]>([]); // Plus de données mockées - uniquement Supabase
  const [projects, setProjects] = useState<Project[]>([]); // Plus de données mockées - uniquement Supabase
  const [objectives, setObjectives] = useState<Objective[]>(mockGoals);
  const [contacts, setContacts] = useState<Contact[]>([]); // Plus de données mockées - uniquement Supabase
  const [documents, setDocuments] = useState<Document[]>([]); // Plus de données mockées - uniquement Supabase
  const [users, setUsers] = useState<User[]>([]); // Plus de données mockées - uniquement Supabase
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]); // Plus de données mockées - uniquement Supabase
  const [expenses, setExpenses] = useState<Expense[]>([]); // Plus de données mockées - uniquement Supabase
  const [recurringInvoices, setRecurringInvoices] = useState<RecurringInvoice[]>([]); // Plus de données mockées - uniquement Supabase
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]); // Plus de données mockées - uniquement Supabase
  const [budgets, setBudgets] = useState<Budget[]>([]); // Plus de données mockées - uniquement Supabase
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [reminderDays, setReminderDays] = useState<number>(3);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Handler pour setView qui persiste dans localStorage
  const handleSetView = (view: string) => {
    logger.logNavigation(currentView, view, 'handleSetView');
    logger.debug('state', `Setting currentView: ${currentView} → ${view}`);
    setCurrentView(view);
    
    // Persister la vue sauf pour login/signup
    if (view !== 'login' && view !== 'signup') {
      localStorage.setItem('lastView', view);
      logger.debug('session', `Persisted view to localStorage: ${view}`);
    }
    
    // Gérer le selectedCourseId
    if (view !== 'course_detail') {
      setSelectedCourseId(null);
    }
    
    // Fermer la sidebar sur mobile
    if(window.innerWidth < 1024) { 
        setSidebarOpen(false);
    }
  };

  // Initialisation simple
  useEffect(() => {
    const startTime = Date.now();
    logger.info('auth', '🔄 Initialisation de l\'application');
    logger.debug('session', `Initial view from localStorage: ${savedView}, using: ${validInitialView}`);
    
    setIsInitialized(true);
    logger.logPerformance('App initialization', Date.now() - startTime);
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
          
          // Charger les utilisateurs depuis Supabase
          console.log('🔄 Chargement des utilisateurs depuis Supabase...');
          const usersData = await DataAdapter.getUsers();
          setUsers(usersData);
          
          console.log('✅ Utilisateurs chargés depuis Supabase:', usersData.length, 'utilisateurs');
          
          // Charger les time logs depuis Supabase
          console.log('🔄 Chargement des time logs depuis Supabase...');
          const timeLogsData = await DataAdapter.getTimeLogs();
          setTimeLogs(timeLogsData);
          
          console.log('✅ Time logs chargés depuis Supabase:', timeLogsData.length, 'logs');
          
          // Charger les meetings depuis Supabase
          console.log('🔄 Chargement des meetings depuis Supabase...');
          const meetingsData = await DataAdapter.getMeetings();
          setMeetings(meetingsData);
          
          console.log('✅ Meetings chargés depuis Supabase:', meetingsData.length, 'meetings');
          
          // Charger les leave requests depuis Supabase
          console.log('🔄 Chargement des demandes de congé depuis Supabase...');
          const leaveRequestsData = await DataAdapter.getLeaveRequests();
          setLeaveRequests(leaveRequestsData);
          
          console.log('✅ Demandes de congé chargées depuis Supabase:', leaveRequestsData.length, 'demandes');
          
          // Charger les invoices depuis Supabase
          console.log('🔄 Chargement des factures depuis Supabase...');
          const invoicesData = await DataAdapter.getInvoices();
          setInvoices(invoicesData);
          
          console.log('✅ Factures chargées depuis Supabase:', invoicesData.length, 'factures');
          
          // Charger les expenses depuis Supabase
          console.log('🔄 Chargement des dépenses depuis Supabase...');
          const expensesData = await DataAdapter.getExpenses();
          setExpenses(expensesData);
          
          console.log('✅ Dépenses chargées depuis Supabase:', expensesData.length, 'dépenses');
          
          // Charger les recurring invoices depuis Supabase
          console.log('🔄 Chargement des factures récurrentes depuis Supabase...');
          const recurringInvoicesData = await DataAdapter.getRecurringInvoices();
          setRecurringInvoices(recurringInvoicesData);
          
          console.log('✅ Factures récurrentes chargées depuis Supabase:', recurringInvoicesData.length, 'factures');
          
          // Charger les recurring expenses depuis Supabase
          console.log('🔄 Chargement des dépenses récurrentes depuis Supabase...');
          const recurringExpensesData = await DataAdapter.getRecurringExpenses();
          setRecurringExpenses(recurringExpensesData);
          
          console.log('✅ Dépenses récurrentes chargées depuis Supabase:', recurringExpensesData.length, 'dépenses');
          
          // Charger les budgets depuis Supabase
          console.log('🔄 Chargement des budgets depuis Supabase...');
          const budgetsData = await DataAdapter.getBudgets();
          setBudgets(budgetsData);
          
          console.log('✅ Budgets chargés depuis Supabase:', budgetsData.length, 'budgets');
          
          // Charger les documents depuis Supabase
          console.log('🔄 Chargement des documents depuis Supabase...');
          const documentsData = await DataAdapter.getDocuments();
          setDocuments(documentsData);
          
          console.log('✅ Documents chargés depuis Supabase:', documentsData.length, 'documents');
          
          // Charger les cours depuis Supabase
          console.log('🔄 Chargement des cours depuis Supabase...');
          const coursesData = await DataAdapter.getCourses();
          setCourses(coursesData);
          
          console.log('✅ Cours chargés depuis Supabase:', coursesData.length, 'cours');
          
          // Charger les jobs depuis Supabase
          console.log('🔄 Chargement des jobs depuis Supabase...');
          const jobsData = await DataAdapter.getJobs();
          setJobs(jobsData);
          
          console.log('✅ Jobs chargés depuis Supabase:', jobsData.length, 'emplois');
          
          // Charger les contacts depuis Supabase
          console.log('🔄 Chargement des contacts depuis Supabase...');
          const contactsData = await DataAdapter.getContacts();
          setContacts(contactsData);
          
          console.log('✅ Contacts chargés depuis Supabase:', contactsData.length, 'contacts');
        } else {
          console.log('🔄 Utilisateur non connecté - aucun projet à charger');
          setProjects([]);
          setObjectives([]);
          setUsers([]);
          setTimeLogs([]);
          setMeetings([]);
          setLeaveRequests([]);
          setInvoices([]);
          setExpenses([]);
          setRecurringInvoices([]);
          setRecurringExpenses([]);
          setBudgets([]);
          setDocuments([]);
          setCourses([]);
          setJobs([]);
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

  // Redirection automatique après authentification réussie
  useEffect(() => {
    if (!isInitialized || !user) return;
    
    // Si on est sur login/signup et qu'on a un user, rediriger vers dashboard
    if ((currentView === 'login' || currentView === 'signup')) {
      logger.logNavigation(currentView, 'dashboard', 'User authenticated');
      logger.info('auth', 'Redirigé vers dashboard après authentification');
      setCurrentView('dashboard');
    }
  }, [user, isInitialized, currentView]);

  // Protection de routes - rediriger vers login si non authentifié
  useEffect(() => {
    if (!isInitialized) return;
    
    // Délai pour permettre à AuthContext de charger la session
    const timeoutId = setTimeout(() => {
      // Rediriger vers login seulement si l'utilisateur n'est pas connecté ET qu'on n'est pas déjà sur login/signup
      if (!user && currentView !== 'login' && currentView !== 'signup') {
        console.log('🔒 Protection route - redirection vers login');
        logger.logNavigation(currentView, 'login', 'Not authenticated - route protection');
        setCurrentView('login');
        setIsDataLoaded(false);
      }
    }, 500); // 500ms pour permettre à AuthContext de charger la session

    return () => clearTimeout(timeoutId);
  }, [user, isInitialized, currentView]);

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

  // Afficher Login uniquement si l'app est initialisée ET l'utilisateur n'est pas connecté
  // Cela évite de montrer Login pendant le chargement de la session
  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div></div>;
  }

  if (!user) {
    if (authView === 'signup') {
        return <Signup onSwitchToLogin={() => setAuthView('login')} onSignupSuccess={() => {
          logger.debug('state', 'onSignupSuccess called - waiting for user state update');
          logger.logNavigation('signup', 'waiting for auth', 'Signup success callback');
          // Attendre que le user soit mis à jour automatiquement - ne pas rediriger ici
        }} />;
    }
    return <Login onSwitchToSignup={() => setAuthView('signup')} onLoginSuccess={() => {
      logger.debug('state', 'onLoginSuccess called - waiting for user state update');
      logger.logNavigation('login', 'waiting for auth', 'Login success callback');
      // Attendre que le user soit mis à jour automatiquement - ne pas rediriger ici
    }} />;
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
    const handleAddRecurringInvoice = async (data: Omit<RecurringInvoice, 'id'>) => {
      try {
        const newRecurringInvoice = await DataAdapter.createRecurringInvoice(data);
        if (newRecurringInvoice) {
          setRecurringInvoices(prev => [newRecurringInvoice, ...prev]);
        }
      } catch (error) {
        console.error('Erreur création facture récurrente:', error);
      }
    };
    const handleUpdateRecurringInvoice = async (updated: RecurringInvoice) => {
      try {
        const result = await DataAdapter.updateRecurringInvoice(updated.id, updated);
        if (result) {
          setRecurringInvoices(prev => prev.map(i => i.id === updated.id ? result : i));
        }
      } catch (error) {
        console.error('Erreur mise à jour facture récurrente:', error);
      }
    };
    const handleDeleteRecurringInvoice = async (id: string) => {
      try {
        const success = await DataAdapter.deleteRecurringInvoice(id);
        if (success) {
          setRecurringInvoices(prev => prev.filter(i => i.id !== id));
        }
      } catch (error) {
        console.error('Erreur suppression facture récurrente:', error);
      }
    };

    // RECURRING EXPENSES
    const handleAddRecurringExpense = async (data: Omit<RecurringExpense, 'id'>) => {
      try {
        const newRecurringExpense = await DataAdapter.createRecurringExpense(data);
        if (newRecurringExpense) {
          setRecurringExpenses(prev => [newRecurringExpense, ...prev]);
        }
      } catch (error) {
        console.error('Erreur création dépense récurrente:', error);
      }
    };
    const handleUpdateRecurringExpense = async (updated: RecurringExpense) => {
      try {
        const result = await DataAdapter.updateRecurringExpense(updated.id, updated);
        if (result) {
          setRecurringExpenses(prev => prev.map(e => e.id === updated.id ? result : e));
        }
      } catch (error) {
        console.error('Erreur mise à jour dépense récurrente:', error);
      }
    };
    const handleDeleteRecurringExpense = async (id: string) => {
      try {
        const success = await DataAdapter.deleteRecurringExpense(id);
        if (success) {
          setRecurringExpenses(prev => prev.filter(e => e.id !== id));
        }
      } catch (error) {
        console.error('Erreur suppression dépense récurrente:', error);
      }
    };


  // INVOICES
  const handleAddInvoice = async (invoiceData: Omit<Invoice, 'id'>) => {
    try {
      const newInvoice = await DataAdapter.createInvoice(invoiceData);
      if (newInvoice) {
        setInvoices(prev => [newInvoice, ...prev]);
      }
    } catch (error) {
      console.error('Erreur création facture:', error);
      // Pas de fallback mocké - uniquement Supabase
    }
  };
    const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
      try {
        const result = await DataAdapter.updateInvoice(updatedInvoice.id, updatedInvoice);
        if (result) {
          setInvoices(prev => prev.map(i => i.id === updatedInvoice.id ? result : i));
        }
      } catch (error) {
        console.error('Erreur mise à jour facture:', error);
      }
    };
    const handleDeleteInvoice = async (invoiceId: string) => {
      try {
        const success = await DataAdapter.deleteInvoice(invoiceId);
        if (success) {
          setInvoices(prev => prev.filter(i => i.id !== invoiceId));
        }
      } catch (error) {
        console.error('Erreur suppression facture:', error);
      }
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
      // Pas de fallback mocké - uniquement Supabase
    }
  };
    const handleUpdateExpense = async (updatedExpense: Expense) => {
      try {
        const result = await DataAdapter.updateExpense(updatedExpense.id, updatedExpense);
        if (result) {
          setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? result : e));
        }
      } catch (error) {
        console.error('Erreur mise à jour dépense:', error);
      }
    };
    const handleDeleteExpense = async (expenseId: string) => {
      try {
        const success = await DataAdapter.deleteExpense(expenseId);
        if (success) {
          setExpenses(prev => prev.filter(e => e.id !== expenseId));
        }
      } catch (error) {
        console.error('Erreur suppression dépense:', error);
      }
    };
    
    // BUDGETS
    const handleAddBudget = async (budgetData: Omit<Budget, 'id'>) => {
      try {
        const newBudget = await DataAdapter.createBudget(budgetData);
        if (newBudget) {
          setBudgets(prev => [newBudget, ...prev]);
        }
      } catch (error) {
        console.error('Erreur création budget:', error);
      }
    };
    const handleUpdateBudget = async (updatedBudget: Budget) => {
      try {
        const result = await DataAdapter.updateBudget(updatedBudget.id, updatedBudget);
        if (result) {
          setBudgets(prev => prev.map(b => b.id === updatedBudget.id ? result : b));
        }
      } catch (error) {
        console.error('Erreur mise à jour budget:', error);
      }
    };
    const handleDeleteBudget = async (budgetId: string) => {
      try {
        const success = await DataAdapter.deleteBudget(budgetId);
        if (success) {
          setBudgets(prev => prev.filter(b => b.id !== budgetId));
          // Unlink expenses from deleted budget items
          const budgetToDelete = budgets.find(b => b.id === budgetId);
          if (budgetToDelete) {
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
          }
        }
      } catch (error) {
        console.error('Erreur suppression budget:', error);
      }
    };

  // MEETINGS
  const handleAddMeeting = async (meetingData: Omit<Meeting, 'id'>) => {
    try {
      console.log('🔄 Création meeting avec données:', meetingData);
      const newMeeting = await DataAdapter.createMeeting(meetingData);
      setMeetings(prev => [newMeeting, ...prev].sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      console.log('✅ Meeting créé:', newMeeting.id);
    } catch (error) {
      console.error('Erreur création meeting:', error);
    }
  };
  
  const handleUpdateMeeting = async (updatedMeeting: Meeting) => {
    try {
      console.log('🔄 Mise à jour meeting avec données:', updatedMeeting);
      const updated = await DataAdapter.updateMeeting(updatedMeeting);
      setMeetings(prev => prev.map(m => m.id === updated.id ? updated : m).sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      console.log('✅ Meeting mis à jour avec succès');
    } catch (error) {
      console.error('Erreur mise à jour meeting:', error);
    }
  };
  
  const handleDeleteMeeting = async (meetingId: number) => {
    try {
      console.log('🔄 Suppression meeting ID:', meetingId);
      await DataAdapter.deleteMeeting(meetingId);
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      console.log('✅ Meeting supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression meeting:', error);
    }
  };


  // LEAVE REQUESTS
  const handleAddLeaveRequest = async (requestData: Omit<LeaveRequest, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;
    try {
      console.log('🔄 Création demande de congé avec données:', requestData);
      const newRequest = await DataAdapter.createLeaveRequest(requestData);
      setLeaveRequests(prev => [newRequest, ...prev]);
      console.log('✅ Demande de congé créée:', newRequest.id);
    } catch (error) {
      console.error('❌ Erreur création demande de congé:', error);
      throw error;
    }
  };

  const handleUpdateLeaveRequest = async (id: string, status: 'approved' | 'rejected', reason?: string) => {
    try {
      console.log('🔄 Mise à jour demande de congé ID:', id, 'Statut:', status, 'Motif:', reason);
      const updates: any = { status };
      if (status === 'approved' && reason) {
        updates.approvalReason = reason;
      } else if (status === 'rejected' && reason) {
        updates.rejectionReason = reason;
      }
      const updatedRequest = await DataAdapter.updateLeaveRequest(id, updates);
      setLeaveRequests(prev => prev.map(req => req.id === id ? updatedRequest : req));
      console.log('✅ Demande de congé mise à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour demande de congé:', error);
      throw error;
    }
  };

  const handleDeleteLeaveRequest = async (id: string) => {
    try {
      console.log('🔄 Suppression demande de congé ID:', id);
      await DataAdapter.deleteLeaveRequest(id);
      setLeaveRequests(prev => prev.filter(req => req.id !== id));
      console.log('✅ Demande de congé supprimée');
    } catch (error) {
      console.error('❌ Erreur suppression demande de congé:', error);
      throw error;
    }
  };

  const handleUpdateLeaveDates = async (id: string, startDate: string, endDate: string, reason: string) => {
    try {
      console.log('🔄 Modification dates demande de congé ID:', id, 'Nouvelles dates:', startDate, 'au', endDate);
      const updates = {
        startDate,
        endDate,
        approvalReason: reason,
        updatedReason: reason // Sauvegarder la raison de modification
      };
      const updatedRequest = await DataAdapter.updateLeaveRequest(id, updates);
      setLeaveRequests(prev => prev.map(req => req.id === id ? updatedRequest : req));
      console.log('✅ Dates de congé modifiées');
    } catch (error) {
      console.error('❌ Erreur modification dates:', error);
      throw error;
    }
  };


  // TIME LOGS
  const handleAddTimeLog = async (logData: Omit<TimeLog, 'id' | 'userId'>) => {
    if (!user) return;
    try {
      console.log('🔄 Création time log avec données:', logData);
      const newLog = await DataAdapter.createTimeLog(logData);
      setTimeLogs(prev => [newLog, ...prev]);
      console.log('✅ Time log créé:', newLog.id);
    } catch (error) {
      console.error('Erreur création time log:', error);
    }
  };

  const handleDeleteTimeLog = async (logId: string) => {
    try {
      console.log('🔄 Suppression time log ID:', logId);
      await DataAdapter.deleteTimeLog(logId);
      setTimeLogs(prev => prev.filter(log => log.id !== logId));
      console.log('✅ Time log supprimé avec succès');
    } catch (error) {
      console.error('Erreur suppression time log:', error);
    }
  };


  // USERS
  const handleUpdateUser = async (updatedUser: User) => {
    try {
      console.log('🔄 handleUpdateUser appelé:', { userId: updatedUser.id, updatedUser });
      const currentUser = users.find(u => u.id === updatedUser.id);
      
      if (!currentUser) {
        console.error('❌ Utilisateur non trouvé:', updatedUser.id);
        throw new Error('Utilisateur non trouvé');
      }
      
      console.log('📋 Utilisateur actuel:', { currentUser });
      
      // Si le rôle a changé, mettre à jour dans Supabase
      if (currentUser.role !== updatedUser.role) {
        console.log('🔄 Rôle modifié, mise à jour dans Supabase:', { userId: updatedUser.id, oldRole: currentUser.role, newRole: updatedUser.role });
        await DataService.updateUserRole(String(updatedUser.id), updatedUser.role);
      }
      
      // Mettre à jour les autres champs du profil si modifiés
      const profileUpdates: any = {};
      let hasProfileChanges = false;
      
      if (currentUser.name !== updatedUser.name) {
        profileUpdates.full_name = updatedUser.name;
        hasProfileChanges = true;
        console.log('📋 Nom modifié:', { old: currentUser.name, new: updatedUser.name });
      }
      if (currentUser.email !== updatedUser.email) {
        profileUpdates.email = updatedUser.email;
        hasProfileChanges = true;
        console.log('📋 Email modifié:', { old: currentUser.email, new: updatedUser.email });
      }
      if (currentUser.phone !== updatedUser.phone) {
        profileUpdates.phone_number = updatedUser.phone;
        hasProfileChanges = true;
        console.log('📋 Téléphone modifié:', { old: currentUser.phone, new: updatedUser.phone });
      }
      if (currentUser.location !== updatedUser.location) {
        profileUpdates.location = updatedUser.location;
        hasProfileChanges = true;
        console.log('📋 Localisation modifiée:', { old: currentUser.location, new: updatedUser.location });
      }
      if (currentUser.avatar !== updatedUser.avatar) {
        profileUpdates.avatar_url = updatedUser.avatar;
        hasProfileChanges = true;
        console.log('📋 Avatar modifié:', { old: currentUser.avatar, new: updatedUser.avatar });
      }
      
      if (hasProfileChanges) {
        console.log('🔄 Profil modifié, mise à jour dans Supabase:', { userId: updatedUser.id, updates: profileUpdates });
        const { error } = await DataService.updateProfile(String(updatedUser.id), profileUpdates);
        if (error) {
          console.error('❌ Erreur Supabase updateProfile:', error);
          throw error;
        }
        console.log('✅ Profil mis à jour avec succès dans Supabase');
      } else {
        console.log('ℹ️ Aucun changement de profil détecté');
      }
      
      // Mise à jour locale
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      
      // Also update user in project teams if they are part of any
      setProjects(prevProjects => prevProjects.map(p => ({
          ...p,
          team: p.team.map(member => member.id === updatedUser.id ? updatedUser : member)
      })));
      
      console.log('✅ handleUpdateUser terminé avec succès');
    } catch (error) {
      console.error('❌ Erreur mise à jour utilisateur:', error);
      alert('Erreur lors de la mise à jour de l\'utilisateur');
      throw error; // Propager l'erreur pour que le composant puisse la gérer
    }
  };

  const handleToggleActive = async (userId: string | number, isActive: boolean) => {
    try {
      console.log('🔄 Activation/désactivation utilisateur ID:', userId, 'Nouveau statut:', isActive);
      
      // Appel à Supabase via DataAdapter
      const success = await DataAdapter.toggleUserActive(userId, isActive);
      
      if (success) {
        // Mise à jour locale seulement si Supabase réussit
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive } : u));
        console.log('✅ Utilisateur mis à jour dans Supabase et localement');
      } else {
        throw new Error('Échec de la mise à jour dans Supabase');
      }
    } catch (error) {
      console.error('❌ Erreur activation/désactivation utilisateur:', error);
      alert('Erreur lors de la modification du statut de l\'utilisateur');
    }
  };

  const handleDeleteUser = async (userId: string | number) => {
    try {
      console.log('🔄 Suppression utilisateur ID:', userId);
      
      // Appel à Supabase via DataAdapter
      const success = await DataAdapter.deleteUser(userId);
      
      if (success) {
        // Mise à jour locale seulement si Supabase réussit
        setUsers(prev => prev.filter(u => u.id !== userId));
        console.log('✅ Utilisateur supprimé de Supabase et localement');
      } else {
        throw new Error('Échec de la suppression dans Supabase');
      }
    } catch (error) {
      console.error('❌ Erreur suppression utilisateur:', error);
      throw error;
    }
  };

  // JOBS
  const handleAddJob = async (newJob: Omit<Job, 'id' | 'applicants'>) => {
    setIsLoading(true);
    try {
      console.log('🔄 Création job avec données:', newJob);
      const createdJob = await DataAdapter.createJob(newJob);
      setJobs(prev => [createdJob, ...prev]);
      console.log('✅ Job créé:', createdJob.id);
      handleSetView('jobs');
    } catch (error) {
      console.error('❌ Erreur création job:', error);
      alert('Erreur lors de la création de l\'offre d\'emploi. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateJob = async (updatedJob: Job) => {
    setIsLoading(true);
    try {
      console.log('🔄 Mise à jour job ID:', updatedJob.id);
      const updated = await DataAdapter.updateJob(updatedJob);
      setJobs(prev => prev.map(job => job.id === updated.id ? updated : job));
      console.log('✅ Job mis à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour job:', error);
      alert('Erreur lors de la mise à jour de l\'offre d\'emploi. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    setIsLoading(true);
    try {
      console.log('🔄 Suppression job ID:', jobId);
      await DataAdapter.deleteJob(jobId);
      setJobs(prev => prev.filter(job => job.id !== jobId));
      console.log('✅ Job supprimé');
    } catch (error) {
      console.error('❌ Erreur suppression job:', error);
      alert('Erreur lors de la suppression de l\'offre d\'emploi. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
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
  const handleAddCourse = async (courseData: Omit<Course, 'id'>) => {
    try {
      const newCourse = await DataAdapter.createCourse(courseData);
      if (newCourse) {
        setCourses(prev => [newCourse, ...prev]);
      }
    } catch (error) {
      console.error('Erreur création cours:', error);
    }
  };
  
  const handleUpdateCourse = async (updatedCourse: Course) => {
    try {
      const updated = await DataAdapter.updateCourse(updatedCourse.id, updatedCourse);
      if (updated) {
        setCourses(prev => prev.map(c => c.id === updated.id ? updated : c));
      }
    } catch (error) {
      console.error('Erreur mise à jour cours:', error);
    }
  };
  
  const handleDeleteCourse = async (courseId: string) => {
    try {
      const success = await DataAdapter.deleteCourse(courseId);
      if (success) {
        setCourses(prev => prev.filter(c => c.id !== courseId));
      }
    } catch (error) {
      console.error('Erreur suppression cours:', error);
    }
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
  const handleAddDocument = async (documentData: Omit<Document, 'id'>) => {
    try {
      const newDocument = await DataAdapter.createDocument(documentData);
      if (newDocument) {
        setDocuments(prev => [newDocument, ...prev]);
      }
    } catch (error) {
      console.error('Erreur création document:', error);
    }
  }

  const handleUpdateDocument = async (updatedDocument: Document) => {
    try {
      const result = await DataAdapter.updateDocument(updatedDocument.id, updatedDocument);
      if (result) {
        setDocuments(prev => prev.map(d => d.id === updatedDocument.id ? result : d));
      }
    } catch (error) {
      console.error('Erreur mise à jour document:', error);
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    try {
      const success = await DataAdapter.deleteDocument(documentId);
      if (success) {
        setDocuments(prev => prev.filter(d => d.id !== documentId));
      }
    } catch (error) {
      console.error('Erreur suppression document:', error);
    }
  }

  // --- View Management ---

  // handleSetView est déjà défini en haut du composant

  const handleSelectCourse = (id: string) => {
    setSelectedCourseId(id);
    handleSetView('course_detail');
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard setView={handleSetView} projects={projects} courses={courses} jobs={jobs} timeLogs={timeLogs} leaveRequests={leaveRequests} invoices={invoices} expenses={expenses} />;
      case 'time_tracking':
        return <TimeTracking 
                    timeLogs={timeLogs} 
                    onAddTimeLog={handleAddTimeLog}
                    onDeleteTimeLog={handleDeleteTimeLog}
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
                    isLoading={isLoading}
                    loadingOperation={loadingOperation}
                />;
      case 'courses':
        return <Courses 
          courses={courses}
          users={users}
          onSelectCourse={handleSelectCourse}
          onAddCourse={handleAddCourse}
          onUpdateCourse={handleUpdateCourse}
          onDeleteCourse={handleDeleteCourse}
        />;
      case 'course_detail':
        const course = courses.find(c => c.id === selectedCourseId);
        return course ? <CourseDetail course={course} onBack={() => handleSetView('courses')} timeLogs={timeLogs} onAddTimeLog={handleAddTimeLog} projects={projects} onUpdateCourse={handleUpdateCourse} /> : <Courses courses={courses} onSelectCourse={handleSelectCourse}/>;
      case 'course_management':
          return <CourseManagement 
                    courses={courses}
                    users={users}
                    onAddCourse={handleAddCourse}
                    onUpdateCourse={handleUpdateCourse}
                    onDeleteCourse={handleDeleteCourse}
                  />;
      case 'jobs':
        return <Jobs jobs={jobs} setJobs={setJobs} setView={handleSetView}/>;
      case 'create_job':
        return <CreateJob onAddJob={handleAddJob} onBack={() => handleSetView('jobs')} />;
      case 'job_management':
        return <JobManagement
                  jobs={jobs}
                  onAddJob={handleAddJob}
                  onUpdateJob={handleUpdateJob}
                  onDeleteJob={handleDeleteJob}
                  onNavigate={handleSetView}
                />;
      case 'leave_management_admin':
        return <LeaveManagementAdmin
                  leaveRequests={leaveRequests}
                  users={users}
                  onUpdateLeaveRequest={handleUpdateLeaveRequest}
                  onUpdateLeaveDates={handleUpdateLeaveDates}
                  onDeleteLeaveRequest={handleDeleteLeaveRequest}
                />;
      case 'user_management':
        return <UserManagement users={users} onUpdateUser={handleUpdateUser} onToggleActive={handleToggleActive} onDeleteUser={handleDeleteUser} />;
      case 'crm_sales':
        return <CRM 
                    contacts={contacts} 
                    onAddContact={handleAddContact}
                    onUpdateContact={handleUpdateContact}
                    onDeleteContact={handleDeleteContact}
                />;
      case 'knowledge_base':
        return <KnowledgeBase 
                    documents={documents} 
                    onAddDocument={handleAddDocument}
                    onUpdateDocument={handleUpdateDocument}
                    onDeleteDocument={handleDeleteDocument}
                />;
      case 'leave_management':
        return <LeaveManagement 
                    leaveRequests={leaveRequests}
                    users={users}
                    onAddLeaveRequest={handleAddLeaveRequest}
                    onUpdateLeaveRequest={handleUpdateLeaveRequest}
                    onDeleteLeaveRequest={handleDeleteLeaveRequest}
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
        return <Analytics setView={handleSetView} users={users} projects={projects} courses={courses} jobs={jobs} />;
      case 'talent_analytics':
        return <TalentAnalytics setView={handleSetView} users={users} jobs={jobs} />;
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
