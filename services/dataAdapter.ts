import { DataService } from './dataService';
import { mockCourses, mockJobs, mockProjects, mockGoals, mockContacts, mockDocuments, mockAllUsers, mockTimeLogs, mockLeaveRequests, mockInvoices, mockExpenses, mockRecurringInvoices, mockRecurringExpenses, mockBudgets, mockMeetings } from '../constants/data';
import { Course, Job, Project, Objective, Contact, Document, User, TimeLog, LeaveRequest, Invoice, Expense, RecurringInvoice, RecurringExpense, Budget, Meeting } from '../types';

// Service adaptateur pour migration progressive
export class DataAdapter {
  private static useSupabase = true; // Activé pour la persistance

  // ===== PROJECTS =====
  static async getProjects(): Promise<Project[]> {
    if (this.useSupabase) {
      try {
        console.log('🔍 DataAdapter.getProjects - Appel DataService.getProjects()');
        const { data, error } = await DataService.getProjects();
        
        if (error) {
          console.error('❌ Erreur DataService.getProjects:', error);
          return []; // Retourner tableau vide au lieu de throw
        }
        
        console.log('📊 Données brutes Supabase:', data?.length || 0, 'projets');
        
        // Convertir les données Supabase vers le format attendu
        const projects = await Promise.all(
          (data || []).map(async (project) => {
            // Récupérer les utilisateurs de l'équipe
            let team: any[] = [];
            if (project.team_members && project.team_members.length > 0) {
              // Récupérer tous les profils et les mapper
              const { data: allProfiles } = await DataService.getProfiles();
              
              // Créer une équipe avec les profils disponibles
              team = (allProfiles || []).slice(0, project.team_members.length).map((user, index) => ({
                id: project.team_members[index] || crypto.randomUUID(), // Utiliser l'ID du projet ou générer un UUID
                name: user.full_name,
                email: user.email,
                role: user.role,
                avatar: '', // Pas d'avatar pour l'instant
                phoneNumber: user.phone_number || '',
                skills: [],
                bio: '',
                location: '',
                website: '',
                linkedinUrl: '',
                githubUrl: '',
                isActive: true,
                lastLogin: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }));
            }
            
            return {
              id: project.id,
              title: project.name,
              description: project.description || '',
              status: project.status || 'not_started',
              priority: project.priority || 'medium',
              dueDate: project.end_date,
              startDate: project.start_date,
              budget: project.budget,
              clientName: project.client || '',
              team: team,
              tasks: project.tasks || [],
              risks: project.risks || [],
              createdAt: project.created_at || new Date().toISOString(),
              updatedAt: project.updated_at || new Date().toISOString()
            };
          })
        );
        
        console.log('✅ DataAdapter.getProjects - Projets convertis:', projects.length);
        return projects;
      } catch (error) {
        console.error('❌ Erreur Supabase, retour tableau vide:', error);
        return []; // Pas de fallback vers mockProjects
      }
    }
    console.log('🔄 DataAdapter.getProjects - Utilisation des données mockées (useSupabase=false)');
    return mockProjects;
  }

  static async createProject(project: Partial<Project>): Promise<Project | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.createProject(project);
        if (error) throw error;
        if (data) {
          // Récupérer les utilisateurs de l'équipe
          let team: any[] = [];
          if (data.team_members && data.team_members.length > 0) {
            const { data: teamData } = await DataService.getUsersByIds(data.team_members);
            team = teamData?.map(user => ({
              id: user.user_id || crypto.randomUUID(),
              name: user.full_name,
              email: user.email,
              role: user.role,
              avatar: '', // Pas d'avatar pour l'instant
              phoneNumber: user.phone_number || '',
              skills: [],
              bio: '',
              location: '',
              website: '',
              linkedinUrl: '',
              githubUrl: '',
              isActive: true,
              lastLogin: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })) || [];
          }
          
          return {
            id: data.id,
            title: data.name,
            description: data.description || '',
            status: data.status || 'not_started',
            priority: data.priority || 'medium',
            dueDate: data.end_date,
            startDate: data.start_date,
            budget: data.budget,
            clientName: data.client || '',
            team: team,
            tasks: data.tasks || [],
            risks: data.risks || [],
            createdAt: data.created_at || new Date().toISOString(),
            updatedAt: data.updated_at || new Date().toISOString()
          };
        }
        
        return null;
      } catch (error) {
        console.warn('Erreur Supabase création projet:', error);
        return null;
      }
    }
    // Fallback vers mock data
    const newProject: Project = {
      id: crypto.randomUUID(),
      title: project.title || '',
      description: project.description || '',
      status: project.status || 'not_started',
      priority: project.priority || 'medium',
      dueDate: project.dueDate,
      startDate: project.startDate,
      budget: project.budget,
      clientName: project.clientName || '',
      team: project.team || [],
      tasks: project.tasks || [],
      risks: project.risks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return newProject;
  }

  static async updateProject(project: Project): Promise<boolean> {
    if (this.useSupabase) {
      try {
        console.log('🔄 DataAdapter.updateProject - Mise à jour projet ID:', project.id);
        
        // Convertir le projet vers le format Supabase
        const teamMemberIds = project.team?.map(member => {
          // Si c'est déjà un UUID valide, l'utiliser tel quel
          if (member.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(member.id)) {
            return member.id;
          }
          // Générer un vrai UUID
          return crypto.randomUUID();
        }) || [];

        const supabaseProject = {
          name: project.title,
          description: project.description,
          status: project.status,
          priority: project.priority,
          end_date: project.dueDate,
          start_date: project.startDate,
          budget: project.budget,
          client: project.clientName,
          team_members: teamMemberIds,
          tasks: project.tasks || [],
          risks: project.risks || [],
          updated_at: new Date().toISOString()
        };

        const { error } = await DataService.updateProject(project.id.toString(), {
          title: project.title,
          description: project.description,
          status: project.status,
          priority: project.priority,
          startDate: project.startDate,
          dueDate: project.dueDate,
          budget: project.budget,
          clientName: project.clientName,
          tasks: project.tasks || [],
          risks: project.risks || []
        });
        if (error) throw error;
        
        console.log('✅ DataAdapter.updateProject - Projet mis à jour avec succès');
        return true;
      } catch (error) {
        console.error('❌ Erreur mise à jour projet:', error);
        return false;
      }
    }
    console.log('🔄 DataAdapter.updateProject - Utilisation des données mockées (useSupabase=false)');
    return false;
  }

  static async deleteProject(projectId: number): Promise<boolean> {
    if (this.useSupabase) {
      try {
        console.log('🔄 DataAdapter.deleteProject - Suppression projet ID:', projectId);
        
        const { error } = await DataService.deleteProject(projectId.toString());
        if (error) throw error;
        
        console.log('✅ DataAdapter.deleteProject - Projet supprimé avec succès');
        return true;
      } catch (error) {
        console.error('❌ Erreur suppression projet:', error);
        return false;
      }
    }
    console.log('🔄 DataAdapter.deleteProject - Utilisation des données mockées (useSupabase=false)');
    return false;
  }

  // ===== INVOICES =====
  static async getInvoices(): Promise<Invoice[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getInvoices();
        if (error) throw error;
        return data?.map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.number,
          clientName: invoice.client_name,
          amount: invoice.amount,
          status: invoice.status || 'draft',
          dueDate: invoice.due_date,
          issueDate: invoice.issue_date,
          description: invoice.description,
          items: invoice.items || [],
          tax: invoice.tax || 0,
          total: invoice.total || invoice.amount,
          notes: invoice.notes,
          createdAt: invoice.created_at || new Date().toISOString(),
          updatedAt: invoice.updated_at || new Date().toISOString()
        })) || [];
      } catch (error) {
        console.warn('Erreur Supabase factures:', error);
        return mockInvoices;
      }
    }
    return mockInvoices;
  }

  static async createInvoice(invoice: Partial<Invoice>): Promise<Invoice | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.createInvoice(invoice);
        if (error) throw error;
        return data ? {
          id: data.id,
          invoiceNumber: data.number,
          clientName: data.client_name,
          amount: data.amount,
          status: data.status || 'draft',
          dueDate: data.due_date,
          issueDate: data.issue_date,
          description: data.description,
          items: data.items || [],
          tax: data.tax || 0,
          total: data.total || data.amount,
          notes: data.notes,
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString()
        } : null;
      } catch (error) {
        console.warn('Erreur Supabase création facture:', error);
        return null;
      }
    }
    // Fallback vers mock data
    const newInvoice: Invoice = {
      id: Date.now(),
      invoiceNumber: invoice.invoiceNumber || `INV-${Date.now()}`,
      clientName: invoice.clientName || '',
      amount: invoice.amount || 0,
      status: invoice.status || 'draft',
      dueDate: invoice.dueDate,
      issueDate: invoice.issueDate || new Date().toISOString().split('T')[0],
      description: invoice.description,
      items: invoice.items || [],
      tax: invoice.tax || 0,
      total: invoice.total || invoice.amount || 0,
      notes: invoice.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return newInvoice;
  }

  // ===== EXPENSES =====
  static async getExpenses(): Promise<Expense[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getExpenses();
        if (error) throw error;
        return data?.map(expense => ({
          id: expense.id,
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          date: expense.date,
          receiptUrl: expense.receipt_url,
          description: expense.description,
          status: expense.status || 'pending',
          tags: expense.tags || [],
          createdAt: expense.created_at || new Date().toISOString(),
          updatedAt: expense.updated_at || new Date().toISOString()
        })) || [];
      } catch (error) {
        console.warn('Erreur Supabase dépenses:', error);
        return mockExpenses;
      }
    }
    return mockExpenses;
  }

  static async createExpense(expense: Partial<Expense>): Promise<Expense | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.createExpense(expense);
        if (error) throw error;
        return data ? {
          id: data.id,
          title: data.title,
          amount: data.amount,
          category: data.category,
          date: data.date,
          receiptUrl: data.receipt_url,
          description: data.description,
          status: data.status || 'pending',
          tags: data.tags || [],
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString()
        } : null;
      } catch (error) {
        console.warn('Erreur Supabase création dépense:', error);
        return null;
      }
    }
    // Fallback vers mock data
    const newExpense: Expense = {
      id: Date.now(),
      title: expense.title || '',
      amount: expense.amount || 0,
      category: expense.category,
      date: expense.date || new Date().toISOString().split('T')[0],
      receiptUrl: expense.receiptUrl,
      description: expense.description,
      status: expense.status || 'pending',
      tags: expense.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return newExpense;
  }

  // ===== CONTACTS =====
  static async getContacts(): Promise<Contact[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getContacts();
        if (error) throw error;
        return data?.map(contact => ({
          id: contact.id,
          firstName: contact.first_name,
          lastName: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          position: contact.position,
          status: contact.status || 'lead',
          source: contact.source,
          notes: contact.notes,
          tags: contact.tags || [],
          createdAt: contact.created_at || new Date().toISOString(),
          updatedAt: contact.updated_at || new Date().toISOString()
        })) || [];
      } catch (error) {
        console.warn('Erreur Supabase contacts:', error);
        return mockContacts;
      }
    }
    return mockContacts;
  }

  static async createContact(contact: Partial<Contact>): Promise<Contact | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.createContact(contact);
        if (error) throw error;
        return data ? {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          position: data.position,
          status: data.status || 'lead',
          source: data.source,
          notes: data.notes,
          tags: data.tags || [],
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString()
        } : null;
      } catch (error) {
        console.warn('Erreur Supabase création contact:', error);
        return null;
      }
    }
    // Fallback vers mock data
    const newContact: Contact = {
      id: Date.now(),
      firstName: contact.firstName || '',
      lastName: contact.lastName || '',
      email: contact.email,
      phone: contact.phone,
      company: contact.company,
      position: contact.position,
      status: contact.status || 'lead',
      source: contact.source,
      notes: contact.notes,
      tags: contact.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return newContact;
  }

  // ===== COURSES =====
  static async getCourses(): Promise<Course[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getCourses();
        if (error) throw error;
        return data?.map(course => ({
          id: course.id,
          title: course.title,
          description: course.description,
          instructor: course.instructor,
          duration: course.duration,
          level: course.level,
          category: course.category,
          price: course.price || 0,
          status: course.status || 'draft',
          thumbnailUrl: course.thumbnail_url,
          rating: course.rating || 0,
          studentsCount: course.students_count || 0,
          lessonsCount: course.lessons_count || 0,
          createdAt: course.created_at || new Date().toISOString(),
          updatedAt: course.updated_at || new Date().toISOString(),
          // Champs supplémentaires pour compatibilité
          icon: 'fas fa-book',
          progress: 0,
          modules: []
        })) || [];
      } catch (error) {
        console.warn('Erreur Supabase cours:', error);
        return mockCourses;
      }
    }
    return mockCourses;
  }

  // ===== OBJECTIVES =====
  static async getObjectives(): Promise<Objective[]> {
    if (this.useSupabase) {
      try {
        console.log('🔍 DataAdapter.getObjectives - Appel DataService.getObjectives()');
        const { data, error } = await DataService.getObjectives();
        
        if (error) {
          console.error('❌ Erreur DataService.getObjectives:', error);
          return []; // Retourner tableau vide au lieu de throw
        }
        
        console.log('📊 Données brutes Supabase objectives:', data?.length || 0, 'objectifs');
        
        const objectives = data?.map(objective => ({
          id: objective.id,
          title: objective.title,
          description: objective.description,
          quarter: objective.quarter,
          year: objective.year,
          ownerId: objective.owner_id,
          status: objective.status || 'active',
          progress: objective.progress || 0,
          priority: objective.priority || 'Medium',
          startDate: objective.start_date,
          endDate: objective.end_date,
          category: objective.category,
          ownerName: objective.owner_name,
          teamMembers: objective.team_members || [],
          keyResults: objective.key_results || [], // Mapper les key_results JSONB
          createdAt: objective.created_at || new Date().toISOString(),
          updatedAt: objective.updated_at || new Date().toISOString(),
          // Champ projectId pour compatibilité avec l'interface actuelle
          projectId: objective.project_id || "1"
        })) || [];
        
        console.log('✅ DataAdapter.getObjectives - Objectifs convertis:', objectives.length);
        return objectives;
      } catch (error) {
        console.error('❌ Erreur Supabase objectifs:', error);
        return mockGoals;
      }
    }
    return mockGoals;
  }

  static async createObjective(objective: Omit<Objective, 'id'>): Promise<Objective | null> {
    if (this.useSupabase) {
      try {
        console.log('🔄 DataAdapter.createObjective - Création objectif:', objective.title);
        
        const objectiveData = {
          title: objective.title,
          description: objective.description,
          quarter: objective.quarter,
          year: objective.year,
          ownerId: objective.ownerId,
          status: objective.status || 'active',
          progress: objective.progress || 0,
          priority: objective.priority || 'Medium',
          startDate: objective.startDate,
          endDate: objective.endDate,
          category: objective.category,
          ownerName: objective.ownerName,
          teamMembers: objective.teamMembers || [],
          keyResults: objective.keyResults || [],
          projectId: objective.projectId
        };
        
        const { data, error } = await DataService.createObjective(objectiveData);
        
        if (error) {
          console.error('❌ Erreur création objectif:', error);
          throw error;
        }
        
        console.log('✅ DataAdapter.createObjective - Objectif créé:', data?.id);
        
        // Convertir la réponse Supabase vers le format app
        return {
          id: data.id,
          title: data.title,
          description: data.description,
          quarter: data.quarter,
          year: data.year,
          ownerId: data.owner_id,
          status: data.status || 'active',
          progress: data.progress || 0,
          priority: data.priority || 'Medium',
          startDate: data.start_date,
          endDate: data.end_date,
          category: data.category,
          ownerName: data.owner_name,
          teamMembers: data.team_members || [],
          keyResults: data.key_results || [],
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
          projectId: objective.projectId
        };
      } catch (error) {
        console.error('❌ Erreur DataAdapter.createObjective:', error);
        throw error;
      }
    }
    return null;
  }

  static async updateObjective(id: string, updates: Partial<Objective>): Promise<Objective | null> {
    if (this.useSupabase) {
      try {
        console.log('🔄 DataAdapter.updateObjective - Mise à jour objectif ID:', id);
        
        const { data, error } = await DataService.updateObjective(id, updates);
        
        if (error) {
          console.error('❌ Erreur mise à jour objectif:', error);
          throw error;
        }
        
        console.log('✅ DataAdapter.updateObjective - Objectif mis à jour:', id);
        
        // Convertir la réponse Supabase vers le format app
        return {
          id: data.id,
          title: data.title,
          description: data.description,
          quarter: data.quarter,
          year: data.year,
          ownerId: data.owner_id,
          status: data.status || 'active',
          progress: data.progress || 0,
          priority: data.priority || 'Medium',
          startDate: data.start_date,
          endDate: data.end_date,
          category: data.category,
          ownerName: data.owner_name,
          teamMembers: data.team_members || [],
          keyResults: data.key_results || [],
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
          projectId: updates.projectId || "1"
        };
      } catch (error) {
        console.error('❌ Erreur DataAdapter.updateObjective:', error);
        throw error;
      }
    }
    return null;
  }

  static async deleteObjective(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        console.log('🔄 DataAdapter.deleteObjective - Suppression objectif ID:', id);
        
        const { error } = await DataService.deleteObjective(id);
        
        if (error) {
          console.error('❌ Erreur suppression objectif:', error);
          throw error;
        }
        
        console.log('✅ DataAdapter.deleteObjective - Objectif supprimé:', id);
        return true;
      } catch (error) {
        console.error('❌ Erreur DataAdapter.deleteObjective:', error);
        throw error;
      }
    }
    return false;
  }

  // ===== DOCUMENTS =====
  static async getDocuments(): Promise<Document[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getDocuments();
        if (error) throw error;
        return data?.map(doc => ({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          summary: doc.summary,
          category: doc.category,
          type: doc.type || 'article',
          status: doc.status || 'published',
          tags: doc.tags || [],
          author: doc.author,
          views: doc.views || 0,
          rating: doc.rating || 0,
          helpful: doc.helpful || 0,
          lastViewed: doc.last_viewed,
          createdAt: doc.created_at || new Date().toISOString(),
          updatedAt: doc.updated_at || new Date().toISOString()
        })) || [];
      } catch (error) {
        console.warn('Erreur Supabase documents:', error);
        return mockDocuments;
      }
    }
    return mockDocuments;
  }

  // ===== TIME LOGS =====
  static async getTimeLogs(): Promise<TimeLog[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getTimeLogs();
        if (error) throw error;
        return data?.map(log => ({
          id: log.id,
          userId: log.user_id,
          projectId: log.project_id,
          taskId: log.task_id,
          description: log.description,
          hours: log.hours,
          date: log.date,
          createdAt: log.created_at || new Date().toISOString(),
          updatedAt: log.updated_at || new Date().toISOString()
        })) || [];
      } catch (error) {
        console.warn('Erreur Supabase logs temps:', error);
        return mockTimeLogs;
      }
    }
    return mockTimeLogs;
  }

  // ===== LEAVE REQUESTS =====
  static async getLeaveRequests(): Promise<LeaveRequest[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getLeaveRequests();
        if (error) throw error;
        return data?.map(request => ({
          id: request.id,
          userId: request.user_id,
          leaveTypeId: request.leave_type_id,
          startDate: request.start_date,
          endDate: request.end_date,
          status: request.status,
          reason: request.reason,
          approverId: request.approver_id,
          rejectionReason: request.rejection_reason,
          createdAt: request.created_at || new Date().toISOString(),
          updatedAt: request.updated_at || new Date().toISOString()
        })) || [];
      } catch (error) {
        console.warn('Erreur Supabase demandes congés:', error);
        return mockLeaveRequests;
      }
    }
    return mockLeaveRequests;
  }

  // ===== USERS =====
  static async getUsers(): Promise<User[]> {
    // Pour l'instant, on garde les utilisateurs mockés
    // La gestion des utilisateurs sera migrée plus tard
    return mockAllUsers;
  }

  // ===== RECURRING ITEMS =====
  static async getRecurringInvoices(): Promise<RecurringInvoice[]> {
    return mockRecurringInvoices;
  }

  static async getRecurringExpenses(): Promise<RecurringExpense[]> {
    return mockRecurringExpenses;
  }

  static async getBudgets(): Promise<Budget[]> {
    return mockBudgets;
  }

  static async getMeetings(): Promise<Meeting[]> {
    return mockMeetings;
  }

  // Gestion des rapports de projet
  static async createProjectReport(reportData: any) {
    console.log('🔍 DataAdapter.createProjectReport - Appel DataService.createProjectReport()');
    const result = await DataService.createProjectReport(reportData);
    if (result.error) {
      console.error('❌ Erreur DataAdapter.createProjectReport:', result.error);
      throw result.error;
    }
    console.log('✅ DataAdapter.createProjectReport - Rapport créé:', result.data);
    return result.data;
  }

  static async getProjectReports(projectId: string) {
    console.log('🔍 DataAdapter.getProjectReports - Appel DataService.getProjectReports()');
    const result = await DataService.getProjectReports(projectId);
    if (result.error) {
      console.error('❌ Erreur DataAdapter.getProjectReports:', result.error);
      throw result.error;
    }
    console.log('✅ DataAdapter.getProjectReports - Rapports récupérés:', result.data.length);
    return result.data;
  }

  static async deleteProjectReport(reportId: string) {
    console.log('🔍 DataAdapter.deleteProjectReport - Appel DataService.deleteProjectReport()');
    const result = await DataService.deleteProjectReport(reportId);
    if (result.error) {
      console.error('❌ Erreur DataAdapter.deleteProjectReport:', result.error);
      throw result.error;
    }
    console.log('✅ DataAdapter.deleteProjectReport - Rapport supprimé');
  }
}

export default DataAdapter;
