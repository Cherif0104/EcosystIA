import { DataService } from './dataService';
import { mockCourses, mockProjects, mockGoals } from '../constants/data';
import { Course, Job, Project, Objective, KeyResult, Contact, Document, User, TimeLog, LeaveRequest, Invoice, Expense, RecurringInvoice, RecurringExpense, RecurrenceFrequency, Budget, Meeting } from '../types';

// Service adaptateur pour migration progressive
export class DataAdapter {
  private static useSupabase = true; // Activé pour la persistance

  // Helper pour mapper les statuts de contact
  private static mapContactStatus(status: string | undefined): 'Lead' | 'Contacted' | 'Prospect' | 'Customer' {
    const statusMap: Record<string, 'Lead' | 'Contacted' | 'Prospect' | 'Customer'> = {
      'lead': 'Lead',
      'active': 'Contacted',
      'inactive': 'Contacted',
      'customer': 'Customer',
      'prospect': 'Prospect',
      'contacted': 'Contacted'
    };
    return statusMap[status?.toLowerCase() || ''] || 'Lead';
  }

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
        return data?.map((invoice: any) => {
          // Normaliser le status (de lowercase avec underscore vers TitleCase avec espace)
          let normalizedStatus: Invoice['status'] = 'Draft';
          const status = invoice.status?.toLowerCase() || 'draft';
          if (status === 'sent') normalizedStatus = 'Sent';
          else if (status === 'paid') normalizedStatus = 'Paid';
          else if (status === 'overdue') normalizedStatus = 'Overdue';
          else if (status === 'partially_paid') normalizedStatus = 'Partially Paid';
          else normalizedStatus = 'Draft';

          return {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number || invoice.number || '',
            clientName: invoice.client_name || '',
            amount: Number(invoice.amount) || 0,
            dueDate: invoice.due_date || '',
            status: normalizedStatus,
            receipt: invoice.receipt_file_name && invoice.receipt_data_url ? {
              fileName: invoice.receipt_file_name,
              dataUrl: invoice.receipt_data_url
            } : undefined,
            paidDate: invoice.paid_date || undefined,
            paidAmount: invoice.paid_amount ? Number(invoice.paid_amount) : undefined,
            recurringSourceId: invoice.recurring_source_id || undefined
          };
        }) || [];
      } catch (error) {
        console.error('❌ Erreur Supabase factures:', error);
        return [];
      }
    }
    return [];
  }

  static async createInvoice(invoice: Partial<Invoice>): Promise<Invoice | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.createInvoice(invoice);
        if (error) throw error;
        
        if (!data) return null;

        // Normaliser le status
        let normalizedStatus: Invoice['status'] = 'Draft';
        const status = data.status?.toLowerCase() || 'draft';
        if (status === 'sent') normalizedStatus = 'Sent';
        else if (status === 'paid') normalizedStatus = 'Paid';
        else if (status === 'overdue') normalizedStatus = 'Overdue';
        else if (status === 'partially_paid') normalizedStatus = 'Partially Paid';
        else normalizedStatus = 'Draft';

        return {
          id: data.id,
          invoiceNumber: data.invoice_number || data.number || '',
          clientName: data.client_name || '',
          amount: Number(data.amount) || 0,
          dueDate: data.due_date || '',
          status: normalizedStatus,
          receipt: data.receipt_file_name && data.receipt_data_url ? {
            fileName: data.receipt_file_name,
            dataUrl: data.receipt_data_url
          } : undefined,
          paidDate: data.paid_date || undefined,
          paidAmount: data.paid_amount ? Number(data.paid_amount) : undefined,
          recurringSourceId: data.recurring_source_id || undefined
        };
      } catch (error) {
        console.error('❌ Erreur Supabase création facture:', error);
        return null;
      }
    }
    return null;
  }

  static async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.updateInvoice(id, updates);
        if (error) throw error;
        
        if (!data) return null;

        // Normaliser le status
        let normalizedStatus: Invoice['status'] = 'Draft';
        const status = data.status?.toLowerCase() || 'draft';
        if (status === 'sent') normalizedStatus = 'Sent';
        else if (status === 'paid') normalizedStatus = 'Paid';
        else if (status === 'overdue') normalizedStatus = 'Overdue';
        else if (status === 'partially_paid') normalizedStatus = 'Partially Paid';
        else normalizedStatus = 'Draft';

        return {
          id: data.id,
          invoiceNumber: data.invoice_number || data.number || '',
          clientName: data.client_name || '',
          amount: Number(data.amount) || 0,
          dueDate: data.due_date || '',
          status: normalizedStatus,
          receipt: data.receipt_file_name && data.receipt_data_url ? {
            fileName: data.receipt_file_name,
            dataUrl: data.receipt_data_url
          } : undefined,
          paidDate: data.paid_date || undefined,
          paidAmount: data.paid_amount ? Number(data.paid_amount) : undefined,
          recurringSourceId: data.recurring_source_id || undefined
        };
      } catch (error) {
        console.error('❌ Erreur Supabase mise à jour facture:', error);
        return null;
      }
    }
    return null;
  }

  static async deleteInvoice(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { error } = await DataService.deleteInvoice(id);
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('❌ Erreur Supabase suppression facture:', error);
        return false;
      }
    }
    return false;
  }

  // ===== EXPENSES =====
  static async getExpenses(): Promise<Expense[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getExpenses();
        if (error) throw error;
        return data?.map((expense: any) => {
          // Normaliser le status
          let normalizedStatus: Expense['status'] = 'Unpaid';
          const status = expense.status?.toLowerCase() || 'unpaid';
          if (status === 'paid') normalizedStatus = 'Paid';
          else normalizedStatus = 'Unpaid';

          return {
            id: expense.id,
            category: expense.category || '',
            description: expense.description || expense.title || '',
            amount: Number(expense.amount) || 0,
            date: expense.date || '',
            dueDate: expense.due_date || undefined,
            receipt: expense.receipt_file_name && expense.receipt_data_url ? {
              fileName: expense.receipt_file_name,
              dataUrl: expense.receipt_data_url
            } : undefined,
            status: normalizedStatus,
            budgetItemId: expense.budget_item_id || undefined,
            recurringSourceId: expense.recurring_source_id || undefined
          };
        }) || [];
      } catch (error) {
        console.error('❌ Erreur Supabase dépenses:', error);
        return [];
      }
    }
    return [];
  }

  static async createExpense(expense: Partial<Expense>): Promise<Expense | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.createExpense(expense);
        if (error) throw error;
        
        if (!data) return null;

        // Normaliser le status
        let normalizedStatus: Expense['status'] = 'Unpaid';
        const status = data.status?.toLowerCase() || 'unpaid';
        if (status === 'paid') normalizedStatus = 'Paid';
        else normalizedStatus = 'Unpaid';

        return {
          id: data.id,
          category: data.category || '',
          description: data.description || data.title || '',
          amount: Number(data.amount) || 0,
          date: data.date || '',
          dueDate: data.due_date || undefined,
          receipt: data.receipt_file_name && data.receipt_data_url ? {
            fileName: data.receipt_file_name,
            dataUrl: data.receipt_data_url
          } : undefined,
          status: normalizedStatus,
          budgetItemId: data.budget_item_id || undefined,
          recurringSourceId: data.recurring_source_id || undefined
        };
      } catch (error) {
        console.error('❌ Erreur Supabase création dépense:', error);
        return null;
      }
    }
    return null;
  }

  static async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.updateExpense(id, updates);
        if (error) throw error;
        
        if (!data) return null;

        // Normaliser le status
        let normalizedStatus: Expense['status'] = 'Unpaid';
        const status = data.status?.toLowerCase() || 'unpaid';
        if (status === 'paid') normalizedStatus = 'Paid';
        else normalizedStatus = 'Unpaid';

        return {
          id: data.id,
          category: data.category || '',
          description: data.description || data.title || '',
          amount: Number(data.amount) || 0,
          date: data.date || '',
          dueDate: data.due_date || undefined,
          receipt: data.receipt_file_name && data.receipt_data_url ? {
            fileName: data.receipt_file_name,
            dataUrl: data.receipt_data_url
          } : undefined,
          status: normalizedStatus,
          budgetItemId: data.budget_item_id || undefined,
          recurringSourceId: data.recurring_source_id || undefined
        };
      } catch (error) {
        console.error('❌ Erreur Supabase mise à jour dépense:', error);
        return null;
      }
    }
    return null;
  }

  static async deleteExpense(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { error } = await DataService.deleteExpense(id);
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('❌ Erreur Supabase suppression dépense:', error);
        return false;
      }
    }
    return false;
  }

  // ===== RECURRING INVOICES =====
  static async getRecurringInvoices(): Promise<RecurringInvoice[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getRecurringInvoices();
        if (error) throw error;
        return data?.map((item: any) => {
          // Normaliser la fréquence
          let normalizedFrequency: RecurrenceFrequency = 'Monthly';
          const freq = item.frequency?.toLowerCase() || 'monthly';
          if (freq === 'quarterly') normalizedFrequency = 'Quarterly';
          else if (freq === 'annually') normalizedFrequency = 'Annually';
          else normalizedFrequency = 'Monthly';

          return {
            id: item.id,
            clientName: item.client_name || '',
            amount: Number(item.amount) || 0,
            frequency: normalizedFrequency,
            startDate: item.start_date || '',
            endDate: item.end_date || undefined,
            lastGeneratedDate: item.last_generated_date || ''
          };
        }) || [];
      } catch (error) {
        console.error('❌ Erreur Supabase factures récurrentes:', error);
        return [];
      }
    }
    return [];
  }

  static async createRecurringInvoice(recurringInvoice: Partial<RecurringInvoice>): Promise<RecurringInvoice | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.createRecurringInvoice(recurringInvoice);
        if (error) throw error;
        
        if (!data) return null;

        // Normaliser la fréquence
        let normalizedFrequency: RecurrenceFrequency = 'Monthly';
        const freq = data.frequency?.toLowerCase() || 'monthly';
        if (freq === 'quarterly') normalizedFrequency = 'Quarterly';
        else if (freq === 'annually') normalizedFrequency = 'Annually';
        else normalizedFrequency = 'Monthly';

        return {
          id: data.id,
          clientName: data.client_name || '',
          amount: Number(data.amount) || 0,
          frequency: normalizedFrequency,
          startDate: data.start_date || '',
          endDate: data.end_date || undefined,
          lastGeneratedDate: data.last_generated_date || ''
        };
      } catch (error) {
        console.error('❌ Erreur Supabase création facture récurrente:', error);
        return null;
      }
    }
    return null;
  }

  static async updateRecurringInvoice(id: string, updates: Partial<RecurringInvoice>): Promise<RecurringInvoice | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.updateRecurringInvoice(id, updates);
        if (error) throw error;
        
        if (!data) return null;

        // Normaliser la fréquence
        let normalizedFrequency: RecurrenceFrequency = 'Monthly';
        const freq = data.frequency?.toLowerCase() || 'monthly';
        if (freq === 'quarterly') normalizedFrequency = 'Quarterly';
        else if (freq === 'annually') normalizedFrequency = 'Annually';
        else normalizedFrequency = 'Monthly';

        return {
          id: data.id,
          clientName: data.client_name || '',
          amount: Number(data.amount) || 0,
          frequency: normalizedFrequency,
          startDate: data.start_date || '',
          endDate: data.end_date || undefined,
          lastGeneratedDate: data.last_generated_date || ''
        };
      } catch (error) {
        console.error('❌ Erreur Supabase mise à jour facture récurrente:', error);
        return null;
      }
    }
    return null;
  }

  static async deleteRecurringInvoice(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { error } = await DataService.deleteRecurringInvoice(id);
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('❌ Erreur Supabase suppression facture récurrente:', error);
        return false;
      }
    }
    return false;
  }

  // ===== RECURRING EXPENSES =====
  static async getRecurringExpenses(): Promise<RecurringExpense[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getRecurringExpenses();
        if (error) throw error;
        return data?.map((item: any) => {
          // Normaliser la fréquence
          let normalizedFrequency: RecurrenceFrequency = 'Monthly';
          const freq = item.frequency?.toLowerCase() || 'monthly';
          if (freq === 'quarterly') normalizedFrequency = 'Quarterly';
          else if (freq === 'annually') normalizedFrequency = 'Annually';
          else normalizedFrequency = 'Monthly';

          return {
            id: item.id,
            category: item.category || '',
            description: item.description || '',
            amount: Number(item.amount) || 0,
            frequency: normalizedFrequency,
            startDate: item.start_date || '',
            endDate: item.end_date || undefined,
            lastGeneratedDate: item.last_generated_date || ''
          };
        }) || [];
      } catch (error) {
        console.error('❌ Erreur Supabase dépenses récurrentes:', error);
        return [];
      }
    }
    return [];
  }

  static async createRecurringExpense(recurringExpense: Partial<RecurringExpense>): Promise<RecurringExpense | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.createRecurringExpense(recurringExpense);
        if (error) throw error;
        
        if (!data) return null;

        // Normaliser la fréquence
        let normalizedFrequency: RecurrenceFrequency = 'Monthly';
        const freq = data.frequency?.toLowerCase() || 'monthly';
        if (freq === 'quarterly') normalizedFrequency = 'Quarterly';
        else if (freq === 'annually') normalizedFrequency = 'Annually';
        else normalizedFrequency = 'Monthly';

        return {
          id: data.id,
          category: data.category || '',
          description: data.description || '',
          amount: Number(data.amount) || 0,
          frequency: normalizedFrequency,
          startDate: data.start_date || '',
          endDate: data.end_date || undefined,
          lastGeneratedDate: data.last_generated_date || ''
        };
      } catch (error) {
        console.error('❌ Erreur Supabase création dépense récurrente:', error);
        return null;
      }
    }
    return null;
  }

  static async updateRecurringExpense(id: string, updates: Partial<RecurringExpense>): Promise<RecurringExpense | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.updateRecurringExpense(id, updates);
        if (error) throw error;
        
        if (!data) return null;

        // Normaliser la fréquence
        let normalizedFrequency: RecurrenceFrequency = 'Monthly';
        const freq = data.frequency?.toLowerCase() || 'monthly';
        if (freq === 'quarterly') normalizedFrequency = 'Quarterly';
        else if (freq === 'annually') normalizedFrequency = 'Annually';
        else normalizedFrequency = 'Monthly';

        return {
          id: data.id,
          category: data.category || '',
          description: data.description || '',
          amount: Number(data.amount) || 0,
          frequency: normalizedFrequency,
          startDate: data.start_date || '',
          endDate: data.end_date || undefined,
          lastGeneratedDate: data.last_generated_date || ''
        };
      } catch (error) {
        console.error('❌ Erreur Supabase mise à jour dépense récurrente:', error);
        return null;
      }
    }
    return null;
  }

  static async deleteRecurringExpense(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { error } = await DataService.deleteRecurringExpense(id);
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('❌ Erreur Supabase suppression dépense récurrente:', error);
        return false;
      }
    }
    return false;
  }

  // ===== BUDGETS =====
  static async getBudgets(): Promise<Budget[]> {
    if (this.useSupabase) {
      try {
        const budgetsResult = await DataService.getBudgets();
        if (budgetsResult.error) throw budgetsResult.error;

        const budgets = budgetsResult.data || [];
        
        // Pour chaque budget, récupérer les budget_lines et budget_items
        const budgetsWithLines = await Promise.all(
          budgets.map(async (budget: any) => {
            const linesResult = await DataService.getBudgetLines(budget.id);
            const lines = linesResult.data || [];

            // Pour chaque ligne, récupérer les items
            const linesWithItems = await Promise.all(
              lines.map(async (line: any) => {
                const itemsResult = await DataService.getBudgetItems(line.id);
                const items = itemsResult.data || [];

                return {
                  id: line.id,
                  title: line.title || '',
                  items: items.map((item: any) => ({
                    id: item.id,
                    description: item.description || '',
                    amount: Number(item.amount) || 0
                  }))
                };
              })
            );

            // Normaliser le type
            let normalizedType: 'Project' | 'Office' = 'Project';
            const type = budget.type?.toLowerCase() || 'project';
            if (type === 'office') normalizedType = 'Office';
            else normalizedType = 'Project';

            return {
              id: budget.id,
              title: budget.title || '',
              type: normalizedType,
              amount: Number(budget.amount) || 0,
              startDate: budget.start_date || '',
              endDate: budget.end_date || '',
              projectId: budget.project_id || undefined,
              budgetLines: linesWithItems
            };
          })
        );

        return budgetsWithLines;
      } catch (error) {
        console.error('❌ Erreur Supabase budgets:', error);
        return [];
      }
    }
    return [];
  }

  static async createBudget(budget: Partial<Budget>): Promise<Budget | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.createBudget(budget);
        if (error) throw error;
        
        if (!data) return null;

        // Recharger le budget complet avec ses lignes et items
        const fullBudget = await this.getBudgets();
        return fullBudget.find(b => b.id === data.id) || null;
      } catch (error) {
        console.error('❌ Erreur Supabase création budget:', error);
        return null;
      }
    }
    return null;
  }

  static async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.updateBudget(id, updates);
        if (error) throw error;
        
        if (!data) return null;

        // Recharger le budget complet avec ses lignes et items
        const fullBudget = await this.getBudgets();
        return fullBudget.find(b => b.id === id) || null;
      } catch (error) {
        console.error('❌ Erreur Supabase mise à jour budget:', error);
        return null;
      }
    }
    return null;
  }

  static async deleteBudget(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { error } = await DataService.deleteBudget(id);
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('❌ Erreur Supabase suppression budget:', error);
        return false;
      }
    }
    return false;
  }

  // ===== CONTACTS =====
  static async getContacts(): Promise<Contact[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getContacts();
        if (error) throw error;
        return data?.map((contact, index) => ({
          id: contact.id || index + 1, // Fallback sur index si pas d'id
          name: `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Contact sans nom',
          workEmail: contact.email || '',
          company: contact.company || 'N/A',
          status: this.mapContactStatus(contact.status),
          avatar: `https://picsum.photos/seed/${contact.id || index}/100/100`,
          officePhone: contact.phone || undefined,
          mobilePhone: contact.phone || undefined,
          whatsappNumber: contact.phone || undefined,
          personalEmail: undefined
        })) || [];
      } catch (error) {
        console.warn('Erreur Supabase contacts:', error);
        return [];
      }
    }
    return [];
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
        return data?.map((course: any) => ({
          id: course.id,
          title: course.title || '',
          description: course.description || '',
          instructor: course.instructor || '',
          duration: course.duration ? `${Math.ceil(course.duration / 40)} Weeks` : '0 Weeks', // Convertir en format "X Weeks"
          level: course.level || 'beginner',
          category: course.category || '',
          price: course.price || 0,
          status: course.status || 'draft',
          thumbnailUrl: course.thumbnail_url || undefined,
          rating: course.rating || 0,
          studentsCount: course.students_count || 0,
          lessonsCount: course.lessons_count || 0,
          createdAt: course.created_at ? new Date(course.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          updatedAt: course.updated_at ? new Date(course.updated_at).toISOString().split('T')[0] : undefined,
          // Nouveaux champs
          targetStudents: course.target_students || null,
          youtubeUrl: course.youtube_url || null,
          driveUrl: course.drive_url || null,
          otherLinks: course.other_links || null,
          // Champs supplémentaires pour compatibilité
          icon: course.category === 'Marketing' ? 'fas fa-bullhorn' : 
                course.category === 'Business' ? 'fas fa-briefcase' : 
                course.category === 'Technology' ? 'fas fa-laptop-code' : 
                'fas fa-book',
          progress: 0, // À calculer depuis course_enrollments si l'utilisateur est inscrit
          modules: []
        })) || [];
      } catch (error) {
        console.error('❌ Erreur Supabase cours:', error);
        return [];
      }
    }
    return [];
  }

  static async createCourse(course: Partial<Course>): Promise<Course | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.createCourse(course);
        if (error) throw error;
        
        if (!data) return null;

        return {
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          instructor: data.instructor || '',
          duration: data.duration ? `${Math.ceil(data.duration / 40)} Weeks` : '0 Weeks',
          level: data.level || 'beginner',
          category: data.category || '',
          price: data.price || 0,
          status: data.status || 'draft',
          thumbnailUrl: data.thumbnail_url || undefined,
          rating: data.rating || 0,
          studentsCount: data.students_count || 0,
          lessonsCount: data.lessons_count || 0,
          createdAt: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          updatedAt: data.updated_at ? new Date(data.updated_at).toISOString().split('T')[0] : undefined,
          icon: 'fas fa-book',
          progress: 0,
          modules: []
        };
      } catch (error) {
        console.error('❌ Erreur Supabase création cours:', error);
        return null;
      }
    }
    return null;
  }

  static async updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.updateCourse(id, updates);
        if (error) throw error;
        
        if (!data) return null;

        return {
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          instructor: data.instructor || '',
          duration: data.duration ? `${Math.ceil(data.duration / 40)} Weeks` : '0 Weeks',
          level: data.level || 'beginner',
          category: data.category || '',
          price: data.price || 0,
          status: data.status || 'draft',
          thumbnailUrl: data.thumbnail_url || undefined,
          rating: data.rating || 0,
          studentsCount: data.students_count || 0,
          lessonsCount: data.lessons_count || 0,
          createdAt: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          updatedAt: data.updated_at ? new Date(data.updated_at).toISOString().split('T')[0] : undefined,
          icon: 'fas fa-book',
          progress: 0,
          modules: []
        };
      } catch (error) {
        console.error('❌ Erreur Supabase mise à jour cours:', error);
        return null;
      }
    }
    return null;
  }

  static async deleteCourse(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { error } = await DataService.deleteCourse(id);
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('❌ Erreur Supabase suppression cours:', error);
        return false;
      }
    }
    return false;
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
          progress: (objective.progress || 0) * 100, // Convertir en pourcentage (0-100)
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
        
        // Calculer la progression automatiquement
        const calculateProgress = (keyResults: KeyResult[]): number => {
          if (keyResults.length === 0) return 0;
          const totalProgress = keyResults.reduce((sum, kr) => {
            if (kr.target === 0) return sum;
            return sum + Math.min((kr.current / kr.target), 1);
          }, 0);
          return Math.min((totalProgress / keyResults.length) * 100, 100);
        };

        const progress = calculateProgress(objective.keyResults || []);
        
        const objectiveData = {
          title: objective.title,
          description: objective.description,
          quarter: objective.quarter,
          year: objective.year,
          ownerId: objective.ownerId,
          status: objective.status || 'active',
          progress: progress / 100, // Convertir en décimal pour Supabase (0-1)
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
          progress: (data.progress || 0) * 100, // Convertir en pourcentage (0-100)
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
        
        // Calculer la progression automatiquement si les keyResults sont mis à jour
        let progress = updates.progress;
        if (updates.keyResults && updates.keyResults.length > 0) {
          const calculateProgress = (keyResults: KeyResult[]): number => {
            if (keyResults.length === 0) return 0;
            const totalProgress = keyResults.reduce((sum, kr) => {
              if (kr.target === 0) return sum;
              return sum + Math.min((kr.current / kr.target), 1);
            }, 0);
            return Math.min((totalProgress / keyResults.length) * 100, 100);
          };
          progress = calculateProgress(updates.keyResults);
        }
        
        const updateData = {
          ...updates,
          progress: progress !== undefined ? progress / 100 : updates.progress // Convertir en décimal pour Supabase (0-1)
        };
        
        const { data, error } = await DataService.updateObjective(id, updateData);
        
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
          progress: (data.progress || 0) * 100, // Convertir en pourcentage (0-100)
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

  // ===== DOCUMENTS (KNOWLEDGE BASE) =====
  static async getDocuments(): Promise<Document[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getDocuments();
        if (error) throw error;
        
        return data?.map((doc: any) => ({
          id: doc.id,
          title: doc.title || '',
          content: doc.content || '',
          description: doc.description || undefined,
          createdAt: doc.created_at ? new Date(doc.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          createdBy: doc.created_by_name || 'Unknown',
          createdById: doc.created_by_id || undefined,
          updatedAt: doc.updated_at ? new Date(doc.updated_at).toISOString().split('T')[0] : undefined,
          tags: Array.isArray(doc.tags) ? doc.tags : undefined,
          category: doc.category || undefined,
          isPublic: doc.is_public ?? false,
          viewCount: doc.view_count || 0,
          lastViewedAt: doc.last_viewed_at ? new Date(doc.last_viewed_at).toISOString() : undefined,
          version: doc.version || 1,
          isFavorite: doc.is_favorite || false,
          thumbnailUrl: doc.thumbnail_url || undefined,
          attachments: Array.isArray(doc.attachments) ? doc.attachments : undefined
        })) || [];
      } catch (error) {
        console.error('❌ Erreur Supabase documents:', error);
        return [];
      }
    }
    return [];
  }

  static async createDocument(document: Partial<Document>): Promise<Document | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.createDocument(document);
        if (error) throw error;
        
        if (!data) return null;

        return {
          id: data.id,
          title: data.title || '',
          content: data.content || '',
          description: data.description || undefined,
          createdAt: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          createdBy: data.created_by_name || 'Unknown',
          createdById: data.created_by_id || undefined,
          updatedAt: data.updated_at ? new Date(data.updated_at).toISOString().split('T')[0] : undefined,
          tags: Array.isArray(data.tags) ? data.tags : undefined,
          category: data.category || undefined,
          isPublic: data.is_public ?? false,
          viewCount: data.view_count || 0,
          lastViewedAt: data.last_viewed_at ? new Date(data.last_viewed_at).toISOString() : undefined,
          version: data.version || 1,
          isFavorite: data.is_favorite || false,
          thumbnailUrl: data.thumbnail_url || undefined,
          attachments: Array.isArray(data.attachments) ? data.attachments : undefined
        };
      } catch (error) {
        console.error('❌ Erreur Supabase création document:', error);
        return null;
      }
    }
    return null;
  }

  static async updateDocument(id: string, updates: Partial<Document>): Promise<Document | null> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.updateDocument(id, updates);
        if (error) throw error;
        
        if (!data) return null;

        return {
          id: data.id,
          title: data.title || '',
          content: data.content || '',
          description: data.description || undefined,
          createdAt: data.created_at ? new Date(data.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          createdBy: data.created_by_name || 'Unknown',
          createdById: data.created_by_id || undefined,
          updatedAt: data.updated_at ? new Date(data.updated_at).toISOString().split('T')[0] : undefined,
          tags: Array.isArray(data.tags) ? data.tags : undefined,
          category: data.category || undefined,
          isPublic: data.is_public ?? false,
          viewCount: data.view_count || 0,
          lastViewedAt: data.last_viewed_at ? new Date(data.last_viewed_at).toISOString() : undefined,
          version: data.version || 1,
          isFavorite: data.is_favorite || false,
          thumbnailUrl: data.thumbnail_url || undefined,
          attachments: Array.isArray(data.attachments) ? data.attachments : undefined
        };
      } catch (error) {
        console.error('❌ Erreur Supabase mise à jour document:', error);
        return null;
      }
    }
    return null;
  }

  static async deleteDocument(id: string): Promise<boolean> {
    if (this.useSupabase) {
      try {
        const { error } = await DataService.deleteDocument(id);
        if (error) throw error;
        return true;
      } catch (error) {
        console.error('❌ Erreur Supabase suppression document:', error);
        return false;
      }
    }
    return false;
  }

  // ===== TIME LOGS =====
  static async getTimeLogs(): Promise<TimeLog[]> {
    console.log('🔍 DataAdapter.getTimeLogs - Appel DataService.getTimeLogs()');
    try {
      const { data, error } = await DataService.getTimeLogs();
      if (error) throw error;
      
      console.log('📊 Données brutes Supabase time_logs:', data?.length || 0, 'logs');
      
      const timeLogs: TimeLog[] = (data || []).map((log: any) => ({
        id: log.id || '', // UUID string
        userId: log.user_id || '', // UUID string (profile.id)
        entityType: (log.entity_type || 'project') as 'project' | 'course' | 'task',
        entityId: log.entity_id || log.project_id || log.course_id || '',
        entityTitle: log.entity_title || '',
        date: log.date || new Date().toISOString().split('T')[0],
        duration: log.duration || (log.hours ? log.hours * 60 : 0), // Convertir heures en minutes
        description: log.description || ''
      }));
      
      console.log('✅ DataAdapter.getTimeLogs - Logs convertis:', timeLogs.length);
      return timeLogs;
    } catch (error) {
      console.error('❌ Erreur DataAdapter.getTimeLogs:', error);
      return [];
    }
  }

  static async createTimeLog(timeLog: Omit<TimeLog, 'id' | 'userId'>): Promise<TimeLog> {
    console.log('🔄 DataAdapter.createTimeLog - Création log:', timeLog.entityTitle);
    try {
      const result = await DataService.createTimeLog(timeLog);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.createTimeLog:', result.error);
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('Aucune donnée retournée lors de la création du time log');
      }
      
      // Convertir le résultat en TimeLog (utiliser directement les UUIDs comme strings)
      const newLog: TimeLog = {
        id: result.data.id || '', // UUID string
        userId: result.data.user_id || '', // UUID string (profile.id)
        entityType: (result.data.entity_type || 'project') as 'project' | 'course' | 'task',
        entityId: result.data.entity_id || result.data.project_id || result.data.course_id || '',
        entityTitle: result.data.entity_title || '',
        date: result.data.date || new Date().toISOString().split('T')[0],
        duration: result.data.duration || (result.data.hours ? result.data.hours * 60 : 0),
        description: result.data.description || ''
      };
      
      console.log('✅ DataAdapter.createTimeLog - Log créé:', newLog.id);
      return newLog;
    } catch (error) {
      console.error('❌ Erreur DataAdapter.createTimeLog:', error);
      throw error;
    }
  }

  static async updateTimeLog(id: string, updates: Partial<TimeLog>): Promise<TimeLog> {
    console.log('🔄 DataAdapter.updateTimeLog - Mise à jour log ID:', id);
    try {
      const result = await DataService.updateTimeLog(id, updates);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.updateTimeLog:', result.error);
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('Aucune donnée retournée lors de la mise à jour du time log');
      }
      
      const updatedLog: TimeLog = {
        id: result.data.id || '', // UUID string
        userId: result.data.user_id || '', // UUID string (profile.id)
        entityType: (result.data.entity_type || 'project') as 'project' | 'course' | 'task',
        entityId: result.data.entity_id || result.data.project_id || result.data.course_id || '',
        entityTitle: result.data.entity_title || '',
        date: result.data.date || new Date().toISOString().split('T')[0],
        duration: result.data.duration || (result.data.hours ? result.data.hours * 60 : 0),
        description: result.data.description || ''
      };
      
      console.log('✅ DataAdapter.updateTimeLog - Log mis à jour:', updatedLog.id);
      return updatedLog;
    } catch (error) {
      console.error('❌ Erreur DataAdapter.updateTimeLog:', error);
      throw error;
    }
  }

  static async deleteTimeLog(id: string): Promise<void> {
    console.log('🔄 DataAdapter.deleteTimeLog - Suppression log ID:', id);
    try {
      const result = await DataService.deleteTimeLog(id);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.deleteTimeLog:', result.error);
        throw result.error;
      }
      console.log('✅ DataAdapter.deleteTimeLog - Log supprimé');
    } catch (error) {
      console.error('❌ Erreur DataAdapter.deleteTimeLog:', error);
      throw error;
    }
  }

  // ===== LEAVE REQUESTS =====
  static async getLeaveRequests(): Promise<LeaveRequest[]> {
    console.log('🔍 DataAdapter.getLeaveRequests - Appel DataService.getLeaveRequests()');
    try {
      const { data, error } = await DataService.getLeaveRequests();
      if (error) throw error;
      
      console.log('📊 Données brutes Supabase leave_requests:', data?.length || 0, 'demandes');
      
      if (!data || data.length === 0) {
        return [];
      }

      // Récupérer tous les profils nécessaires pour mapper userName et userAvatar
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await DataService.getProfiles();
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const leaveRequests: LeaveRequest[] = (data || []).map((request: any) => {
        const profile = profilesMap.get(request.user_id);
        return {
          id: request.id || '', // UUID string
          userId: request.user_id || '', // UUID string (profile.id)
          userName: profile?.full_name || 'Utilisateur inconnu',
          userAvatar: profile?.avatar_url || '',
          leaveTypeId: request.leave_type_id || undefined,
          leaveTypeName: request.leave_type || undefined,
          startDate: request.start_date || '',
          endDate: request.end_date || '',
          reason: request.reason || '',
          status: (request.status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected' | 'cancelled',
          approverId: request.approver_id || undefined,
          rejectionReason: request.rejection_reason || undefined,
          approvalReason: request.approval_reason || undefined,
          isUrgent: request.is_urgent || false,
          urgencyReason: request.urgency_reason || undefined,
          managerId: request.manager_id || undefined,
          createdAt: request.created_at || new Date().toISOString(),
          updatedAt: request.updated_at || new Date().toISOString()
        };
      });
      
      console.log('✅ DataAdapter.getLeaveRequests - Demandes converties:', leaveRequests.length);
      return leaveRequests;
    } catch (error) {
      console.error('❌ Erreur DataAdapter.getLeaveRequests:', error);
      return [];
    }
  }

  static async createLeaveRequest(leaveRequest: Omit<LeaveRequest, 'id' | 'userId' | 'status' | 'createdAt' | 'updatedAt'>): Promise<LeaveRequest> {
    console.log('🔄 DataAdapter.createLeaveRequest - Création demande:', leaveRequest.leaveTypeName || 'congé');
    try {
      const result = await DataService.createLeaveRequest(leaveRequest);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.createLeaveRequest:', result.error);
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('Aucune donnée retournée lors de la création de la demande de congé');
      }

      // Récupérer le profil pour avoir userName et userAvatar
      const { data: profiles } = await DataService.getProfiles();
      const profile = profiles?.find(p => p.id === result.data.user_id);

      const newRequest: LeaveRequest = {
        id: result.data.id || '', // UUID string
        userId: result.data.user_id || '', // UUID string (profile.id)
        userName: profile?.full_name || '',
        userAvatar: profile?.avatar_url || '',
        leaveTypeId: result.data.leave_type_id || undefined,
        leaveTypeName: result.data.leave_type || undefined,
        startDate: result.data.start_date || '',
        endDate: result.data.end_date || '',
        reason: result.data.reason || '',
        status: (result.data.status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected' | 'cancelled',
        approverId: result.data.approver_id || undefined,
        rejectionReason: result.data.rejection_reason || undefined,
        approvalReason: result.data.approval_reason || undefined,
        isUrgent: result.data.is_urgent || false,
        urgencyReason: result.data.urgency_reason || undefined,
        managerId: result.data.manager_id || undefined,
        createdAt: result.data.created_at || new Date().toISOString(),
        updatedAt: result.data.updated_at || new Date().toISOString()
      };
      
      console.log('✅ DataAdapter.createLeaveRequest - Demande créée:', newRequest.id);
      return newRequest;
    } catch (error) {
      console.error('❌ Erreur DataAdapter.createLeaveRequest:', error);
      throw error;
    }
  }

  static async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>): Promise<LeaveRequest> {
    console.log('🔄 DataAdapter.updateLeaveRequest - Mise à jour demande ID:', id);
    try {
      const result = await DataService.updateLeaveRequest(id, updates);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.updateLeaveRequest:', result.error);
        throw result.error;
      }
      
      if (!result.data) {
        throw new Error('Aucune donnée retournée lors de la mise à jour de la demande de congé');
      }

      // Récupérer le profil pour avoir userName et userAvatar
      const { data: profiles } = await DataService.getProfiles();
      const profile = profiles?.find(p => p.id === result.data.user_id);

      const updatedRequest: LeaveRequest = {
        id: result.data.id || '',
        userId: result.data.user_id || '',
        userName: profile?.full_name || '',
        userAvatar: profile?.avatar_url || '',
        leaveTypeId: result.data.leave_type_id || undefined,
        leaveTypeName: result.data.leave_type || undefined,
        startDate: result.data.start_date || '',
        endDate: result.data.end_date || '',
        reason: result.data.reason || '',
        status: (result.data.status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected' | 'cancelled',
        approverId: result.data.approver_id || undefined,
        rejectionReason: result.data.rejection_reason || undefined,
        approvalReason: result.data.approval_reason || undefined,
        createdAt: result.data.created_at || new Date().toISOString(),
        updatedAt: result.data.updated_at || new Date().toISOString()
      };
      
      console.log('✅ DataAdapter.updateLeaveRequest - Demande mise à jour:', updatedRequest.id);
      return updatedRequest;
    } catch (error) {
      console.error('❌ Erreur DataAdapter.updateLeaveRequest:', error);
      throw error;
    }
  }

  static async deleteLeaveRequest(id: string): Promise<void> {
    console.log('🔄 DataAdapter.deleteLeaveRequest - Suppression demande ID:', id);
    try {
      const result = await DataService.deleteLeaveRequest(id);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.deleteLeaveRequest:', result.error);
        throw result.error;
      }
      console.log('✅ DataAdapter.deleteLeaveRequest - Demande supprimée');
    } catch (error) {
      console.error('❌ Erreur DataAdapter.deleteLeaveRequest:', error);
      throw error;
    }
  }

  static async getLeaveTypes() {
    console.log('🔍 DataAdapter.getLeaveTypes - Appel DataService.getLeaveTypes()');
    try {
      const result = await DataService.getLeaveTypes();
      if (result.error) throw result.error;
      return result.data || [];
    } catch (error) {
      console.error('❌ Erreur DataAdapter.getLeaveTypes:', error);
      return [];
    }
  }

  // ===== USERS =====
  static async getUsers(): Promise<User[]> {
    if (this.useSupabase) {
      try {
        const { data, error } = await DataService.getProfiles();
        if (error) throw error;
        
        // Convertir les profils Supabase en User
        return (data || []).map((profile: any) => ({
          id: profile.user_id || profile.id,
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role as any,
          avatar: profile.avatar_url || '',
          phoneNumber: profile.phone_number || '',
          skills: profile.skills || [],
          bio: profile.bio || '',
          location: profile.location || '',
          website: profile.website || '',
          linkedinUrl: profile.linkedin_url || '',
          githubUrl: profile.github_url || '',
          isActive: profile.is_active ?? true,
          lastLogin: profile.last_login || new Date().toISOString(),
          createdAt: profile.created_at || new Date().toISOString(),
          updatedAt: profile.updated_at || new Date().toISOString()
        }));
      } catch (error) {
        console.error('Erreur récupération utilisateurs:', error);
        return [];
      }
    }
    return [];
  }

  static async toggleUserActive(userId: string | number, isActive: boolean): Promise<boolean> {
    if (this.useSupabase) {
      try {
        console.log('🔄 DataAdapter.toggleUserActive - Toggle user active:', { userId, isActive });
        
        const { data, error } = await DataService.toggleUserActive(userId, isActive);
        if (error) {
          console.error('❌ Erreur DataAdapter.toggleUserActive:', error);
          throw error;
        }
        
        console.log('✅ DataAdapter.toggleUserActive - User active status updated:', { userId, isActive });
        return true;
      } catch (error) {
        console.error('❌ Erreur DataAdapter.toggleUserActive:', error);
        throw error;
      }
    }
    return false;
  }

  // ===== MEETINGS =====
  static async getMeetings(): Promise<Meeting[]> {
    console.log('🔍 DataAdapter.getMeetings - Appel DataService.getMeetings()');
    try {
      const { data, error } = await DataService.getMeetings();
      if (error) throw error;
      
      console.log('📊 Données brutes Supabase meetings:', data?.length || 0, 'meetings');
      
      // Pour mapper les meetings, on a besoin des utilisateurs pour reconstruire les objets User
      // Pour l'instant, on retourne une structure simplifiée
      const meetings: Meeting[] = (data || []).map((meeting: any) => ({
        id: meeting.id ? Number(meeting.id.replace(/-/g, '').substring(0, 8), 16) : Math.random(),
        title: meeting.title || '',
        description: meeting.description || '',
        startTime: meeting.start_time || new Date().toISOString(),
        endTime: meeting.end_time || new Date().toISOString(),
        organizerId: meeting.organizer_id ? Number(meeting.organizer_id.replace(/-/g, '').substring(0, 8), 16) : Math.random(),
        attendees: Array.isArray(meeting.attendees) ? meeting.attendees.map((id: any) => ({
          id: typeof id === 'string' ? Number(id.replace(/-/g, '').substring(0, 8), 16) : Number(id),
          name: 'Utilisateur', // À récupérer depuis les profils si nécessaire
          email: '',
          avatar: '',
          role: 'user' as any
        })) : []
      }));
      
      console.log('✅ DataAdapter.getMeetings - Meetings convertis:', meetings.length);
      return meetings;
    } catch (error) {
      console.error('❌ Erreur DataAdapter.getMeetings:', error);
      return [];
    }
  }

  static async createMeeting(meeting: Omit<Meeting, 'id'>): Promise<Meeting> {
    console.log('🔄 DataAdapter.createMeeting - Création meeting:', meeting.title);
    try {
      const result = await DataService.createMeeting(meeting);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.createMeeting:', result.error);
        throw result.error;
      }
      
      const newMeeting: Meeting = {
        id: result.data.id ? Number(result.data.id.replace(/-/g, '').substring(0, 8), 16) : Math.random(),
        title: result.data.title || '',
        description: result.data.description || '',
        startTime: result.data.start_time || new Date().toISOString(),
        endTime: result.data.end_time || new Date().toISOString(),
        organizerId: result.data.organizer_id ? Number(result.data.organizer_id.replace(/-/g, '').substring(0, 8), 16) : Math.random(),
        attendees: Array.isArray(result.data.attendees) ? result.data.attendees.map((id: any) => ({
          id: typeof id === 'string' ? Number(id.replace(/-/g, '').substring(0, 8), 16) : Number(id),
          name: 'Utilisateur',
          email: '',
          avatar: '',
          role: 'user' as any
        })) : []
      };
      
      console.log('✅ DataAdapter.createMeeting - Meeting créé:', newMeeting.id);
      return newMeeting;
    } catch (error) {
      console.error('❌ Erreur DataAdapter.createMeeting:', error);
      throw error;
    }
  }

  static async updateMeeting(meeting: Meeting): Promise<Meeting> {
    console.log('🔄 DataAdapter.updateMeeting - Mise à jour meeting ID:', meeting.id);
    try {
      // Convertir l'ID number en string UUID approximatif (on garde le format original si possible)
      const meetingId = typeof meeting.id === 'string' ? meeting.id : String(meeting.id);
      
      const result = await DataService.updateMeeting(meetingId, meeting);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.updateMeeting:', result.error);
        throw result.error;
      }
      
      const updatedMeeting: Meeting = {
        id: result.data.id ? Number(result.data.id.replace(/-/g, '').substring(0, 8), 16) : meeting.id,
        title: result.data.title || '',
        description: result.data.description || '',
        startTime: result.data.start_time || new Date().toISOString(),
        endTime: result.data.end_time || new Date().toISOString(),
        organizerId: result.data.organizer_id ? Number(result.data.organizer_id.replace(/-/g, '').substring(0, 8), 16) : meeting.organizerId,
        attendees: Array.isArray(result.data.attendees) ? result.data.attendees.map((id: any) => ({
          id: typeof id === 'string' ? Number(id.replace(/-/g, '').substring(0, 8), 16) : Number(id),
          name: 'Utilisateur',
          email: '',
          avatar: '',
          role: 'user' as any
        })) : []
      };
      
      console.log('✅ DataAdapter.updateMeeting - Meeting mis à jour:', updatedMeeting.id);
      return updatedMeeting;
    } catch (error) {
      console.error('❌ Erreur DataAdapter.updateMeeting:', error);
      throw error;
    }
  }

  static async deleteMeeting(id: number): Promise<void> {
    console.log('🔄 DataAdapter.deleteMeeting - Suppression meeting ID:', id);
    try {
      const meetingId = typeof id === 'string' ? id : String(id);
      const result = await DataService.deleteMeeting(meetingId);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.deleteMeeting:', result.error);
        throw result.error;
      }
      console.log('✅ DataAdapter.deleteMeeting - Meeting supprimé');
    } catch (error) {
      console.error('❌ Erreur DataAdapter.deleteMeeting:', error);
      throw error;
    }
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

  // ===== JOBS =====
  static async getJobs(): Promise<Job[]> {
    if (this.useSupabase) {
      try {
        console.log('🔍 DataAdapter.getJobs - Appel DataService.getJobs()');
        const { data, error } = await DataService.getJobs();
        
        if (error) {
          console.error('❌ Erreur DataService.getJobs:', error);
          return []; // Retourner tableau vide au lieu de throw
        }
        
        console.log('📊 Données brutes Supabase jobs:', data?.length || 0, 'emplois');
        
        // Convertir les données Supabase vers le format attendu
        const jobs = (data || []).map((job: any) => ({
          id: job.id,
          title: job.title || '',
          company: job.company || '',
          location: job.location || '',
          type: job.type || 'Full-time' as any,
          postedDate: new Date(job.created_at || Date.now()).toLocaleDateString('fr-FR'),
          description: job.description || '',
          requiredSkills: job.required_skills || [],
          applicants: [],
          status: job.status as any,
          sector: job.sector,
          experienceLevel: job.experience_level as any,
          remoteWork: job.remote_work as any,
          salary: job.salary,
          benefits: job.benefits,
          education: job.education,
          languages: job.languages,
          applicationLink: job.application_link,
          applicationEmail: job.application_email,
          companyWebsite: job.company_website
        }));
        
        console.log('✅ DataAdapter.getJobs - Jobs convertis:', jobs.length);
        return jobs;
      } catch (error) {
        console.error('❌ Erreur Supabase, retour tableau vide:', error);
        return []; // Pas de fallback vers mockJobs
      }
    }
    console.log('🔄 DataAdapter.getJobs - Utilisation des données mockées (useSupabase=false)');
    return [];
  }

  static async createJob(job: Partial<Job>): Promise<Job> {
    console.log('🔄 DataAdapter.createJob - Création job');
    try {
      const result = await DataService.createJob(job);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.createJob:', result.error);
        throw result.error;
      }
      
      const newJob: Job = {
        id: result.data.id,
        title: result.data.title || '',
        company: result.data.company || '',
        location: result.data.location || '',
        type: result.data.type || 'Full-time' as any,
        postedDate: new Date(result.data.created_at || Date.now()).toLocaleDateString('fr-FR'),
        description: result.data.description || '',
        requiredSkills: result.data.required_skills || [],
        applicants: [],
        status: result.data.status as any,
        sector: result.data.sector,
        experienceLevel: result.data.experience_level as any,
        remoteWork: result.data.remote_work as any,
        salary: result.data.salary,
        benefits: result.data.benefits,
        education: result.data.education,
        languages: result.data.languages,
        applicationLink: result.data.application_link,
        applicationEmail: result.data.application_email,
        companyWebsite: result.data.company_website
      };
      
      console.log('✅ DataAdapter.createJob - Job créé:', newJob.id);
      return newJob;
    } catch (error) {
      console.error('❌ Erreur DataAdapter.createJob:', error);
      throw error;
    }
  }

  static async updateJob(job: Job): Promise<Job> {
    console.log('🔄 DataAdapter.updateJob - Mise à jour job ID:', job.id);
    try {
      const result = await DataService.updateJob(job.id, job);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.updateJob:', result.error);
        throw result.error;
      }
      
      const updatedJob: Job = {
        ...job,
        ...result.data
      };
      
      console.log('✅ DataAdapter.updateJob - Job mis à jour:', updatedJob.id);
      return updatedJob;
    } catch (error) {
      console.error('❌ Erreur DataAdapter.updateJob:', error);
      throw error;
    }
  }

  static async deleteJob(id: number): Promise<void> {
    console.log('🔄 DataAdapter.deleteJob - Suppression job ID:', id);
    try {
      const result = await DataService.deleteJob(id);
      if (result.error) {
        console.error('❌ Erreur DataAdapter.deleteJob:', result.error);
        throw result.error;
      }
      console.log('✅ DataAdapter.deleteJob - Job supprimé');
    } catch (error) {
      console.error('❌ Erreur DataAdapter.deleteJob:', error);
      throw error;
    }
  }
}

export default DataAdapter;
