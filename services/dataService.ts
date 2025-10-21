import { supabase } from './supabaseService';
import { ApiHelper } from './apiHelper';
import { Project, Invoice, Expense, Contact, TimeLog, LeaveRequest, Course, Objective, Document } from '../types';

// Service de données Supabase
export class DataService {
  // ===== PROFILES =====
  static async getProfiles() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur récupération profils:', error);
      return { data: null, error };
    }
  }

  static async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur récupération profil:', error);
      return { data: null, error };
    }
  }

  static async updateProfile(userId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur mise à jour profil:', error);
      return { data: null, error };
    }
  }

  // ===== UTILISATEURS PAR IDS =====
  static async getUsersByIds(userIds: string[]) {
    try {
      if (userIds.length === 0) return { data: [], error: null };
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('user_id', userIds);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur récupération utilisateurs par IDs:', error);
      return { data: null, error };
    }
  }
  static async getProjects() {
    return await ApiHelper.get('projects', { 
      select: '*', 
      order: 'created_at.desc' 
    });
  }

  static async getProject(id: string) {
    return await ApiHelper.get(`projects?id=eq.${id}&select=*`);
  }

  static async createProject(project: Partial<Project>) {
    try {
      // Mapper les statuts vers les valeurs valides de la base
      const mapStatus = (status: string) => {
        switch (status?.toLowerCase()) {
          case 'not started':
          case 'not_started':
            return 'active';
          case 'in progress':
          case 'in_progress':
            return 'active';
          case 'completed':
            return 'completed';
          case 'cancelled':
            return 'cancelled';
          case 'on hold':
          case 'on_hold':
            return 'on_hold';
          default:
            return 'active';
        }
      };

      // Mapper les priorités vers les valeurs valides de la base
      const mapPriority = (priority: string) => {
        switch (priority?.toLowerCase()) {
          case 'low':
            return 'low';
          case 'medium':
            return 'medium';
          case 'high':
            return 'high';
          case 'urgent':
            return 'urgent';
          default:
            return 'medium';
        }
      };

      console.log('🔍 Données projet reçues:', {
        title: project.title,
        status: project.status,
        mappedStatus: mapStatus(project.status || 'active'),
        priority: project.priority,
        mappedPriority: mapPriority(project.priority || 'medium'),
        team: project.team,
        teamCount: project.team?.length || 0
      });

      // Convertir les membres d'équipe en UUIDs valides
      const teamMemberIds = project.team?.map(member => {
        // Si c'est déjà un UUID valide, l'utiliser tel quel
        if (member.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(member.id)) {
          return member.id;
        }
        // Générer un vrai UUID
        return crypto.randomUUID();
      }) || [];

      console.log('🔍 Team members IDs:', teamMemberIds);
      console.log('🔍 Team members count:', teamMemberIds.length);

      return await ApiHelper.post('projects', {
        name: project.title || '',
        description: project.description || '',
        status: mapStatus(project.status || 'active'),
        priority: mapPriority(project.priority || 'medium'),
        start_date: project.startDate,
        end_date: project.dueDate,
        budget: project.budget,
        client: project.clientName,
        team_members: teamMemberIds,
        tasks: project.tasks || [],
        risks: project.risks || []
      });
    } catch (error) {
      console.error('Erreur création projet:', error);
      return { data: null, error };
    }
  }

  static async updateProject(id: string, updates: Partial<Project>) {
    // Mapper les statuts vers les valeurs valides de la base
    const mapStatus = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'not started':
        case 'not_started':
          return 'active';
        case 'in progress':
        case 'in_progress':
          return 'active';
        case 'completed':
          return 'completed';
        case 'cancelled':
          return 'cancelled';
        case 'on hold':
        case 'on_hold':
          return 'on_hold';
        default:
          return 'active';
      }
    };

    // Mapper les priorités vers les valeurs valides de la base
    const mapPriority = (priority: string) => {
      switch (priority?.toLowerCase()) {
        case 'low':
          return 'low';
        case 'medium':
          return 'medium';
        case 'high':
          return 'high';
        case 'urgent':
          return 'urgent';
        default:
          return 'medium';
      }
    };

    return await ApiHelper.put('projects', id, {
      name: updates.title,
      description: updates.description,
      status: mapStatus(updates.status || 'active'),
      priority: mapPriority(updates.priority || 'medium'),
      start_date: updates.startDate,
      end_date: updates.dueDate,
      budget: updates.budget,
      client: updates.clientName,
      tasks: updates.tasks || [],
      risks: updates.risks || [],
      updated_at: new Date().toISOString()
    });
  }

  static async deleteProject(id: string) {
    return await ApiHelper.delete('projects', id);
  }

  // ===== INVOICES =====
  static async getInvoices() {
    return await ApiHelper.get('invoices', { 
      select: '*', 
      order: 'created_at.desc' 
    });
  }

  static async createInvoice(invoice: Partial<Invoice>) {
    return await ApiHelper.post('invoices', {
      number: invoice.number || '',
      client_name: invoice.clientName || '',
      amount: invoice.amount || 0,
      status: invoice.status || 'draft',
      due_date: invoice.dueDate,
      issue_date: invoice.issueDate || new Date().toISOString().split('T')[0],
      description: invoice.description,
      items: invoice.items || [],
      tax: invoice.tax || 0,
      total: invoice.total || invoice.amount || 0,
      notes: invoice.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  static async updateInvoice(id: string, updates: Partial<Invoice>) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update({
          number: updates.number,
          client_name: updates.clientName,
          amount: updates.amount,
          status: updates.status,
          due_date: updates.dueDate,
          issue_date: updates.issueDate,
          description: updates.description,
          items: updates.items,
          tax: updates.tax,
          total: updates.total,
          notes: updates.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur mise à jour facture:', error);
      return { data: null, error };
    }
  }

  static async deleteInvoice(id: string) {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erreur suppression facture:', error);
      return { error };
    }
  }

  // ===== EXPENSES =====
  static async getExpenses() {
    return await ApiHelper.get('expenses', { 
      select: '*', 
      order: 'created_at.desc' 
    });
  }

  static async createExpense(expense: Partial<Expense>) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert({
          title: expense.title || '',
          amount: expense.amount || 0,
          category: expense.category,
          date: expense.date || new Date().toISOString().split('T')[0],
          receipt_url: expense.receiptUrl,
          description: expense.description,
          status: expense.status || 'pending',
          tags: expense.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur création dépense:', error);
      return { data: null, error };
    }
  }

  static async updateExpense(id: string, updates: Partial<Expense>) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update({
          title: updates.title,
          amount: updates.amount,
          category: updates.category,
          date: updates.date,
          receipt_url: updates.receiptUrl,
          description: updates.description,
          status: updates.status,
          tags: updates.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur mise à jour dépense:', error);
      return { data: null, error };
    }
  }

  static async deleteExpense(id: string) {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erreur suppression dépense:', error);
      return { error };
    }
  }

  // ===== CONTACTS =====
  static async getContacts() {
    return await ApiHelper.get('contacts', { 
      select: '*', 
      order: 'created_at.desc' 
    });
  }

  static async createContact(contact: Partial<Contact>) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          first_name: contact.firstName || '',
          last_name: contact.lastName || '',
          email: contact.email,
          phone: contact.phone,
          company: contact.company,
          position: contact.position,
          status: contact.status || 'lead',
          source: contact.source,
          notes: contact.notes,
          tags: contact.tags || [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur création contact:', error);
      return { data: null, error };
    }
  }

  static async updateContact(id: string, updates: Partial<Contact>) {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .update({
          first_name: updates.firstName,
          last_name: updates.lastName,
          email: updates.email,
          phone: updates.phone,
          company: updates.company,
          position: updates.position,
          status: updates.status,
          source: updates.source,
          notes: updates.notes,
          tags: updates.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur mise à jour contact:', error);
      return { data: null, error };
    }
  }

  static async deleteContact(id: string) {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erreur suppression contact:', error);
      return { error };
    }
  }

  // ===== TIME LOGS =====
  static async getTimeLogs() {
    return await ApiHelper.get('time_logs', { 
      select: '*', 
      order: 'created_at.desc' 
    });
  }

  static async createTimeLog(timeLog: Partial<TimeLog>) {
    try {
      const { data, error } = await supabase
        .from('time_logs')
        .insert({
          user_id: timeLog.userId || '',
          project_id: timeLog.projectId,
          task_id: timeLog.taskId,
          description: timeLog.description,
          hours: timeLog.hours || 0,
          date: timeLog.date || new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur création log temps:', error);
      return { data: null, error };
    }
  }

  // ===== LEAVE REQUESTS =====
  static async getLeaveRequests() {
    return await ApiHelper.get('leave_requests', { 
      select: '*', 
      order: 'created_at.desc' 
    });
  }

  static async createLeaveRequest(leaveRequest: Partial<LeaveRequest>) {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          user_id: leaveRequest.userId || '',
          leave_type_id: leaveRequest.leaveTypeId || '',
          start_date: leaveRequest.startDate || '',
          end_date: leaveRequest.endDate || '',
          status: leaveRequest.status || 'pending',
          reason: leaveRequest.reason,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur création demande congé:', error);
      return { data: null, error };
    }
  }

  static async updateLeaveRequest(id: string, updates: Partial<LeaveRequest>) {
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .update({
          status: updates.status,
          reason: updates.reason,
          approver_id: updates.approverId,
          rejection_reason: updates.rejectionReason,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur mise à jour demande congé:', error);
      return { data: null, error };
    }
  }

  // ===== COURSES =====
  static async getCourses() {
    return await ApiHelper.get('courses', { 
      select: '*', 
      order: 'created_at.desc' 
    });
  }

  static async createCourse(course: Partial<Course>) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: course.title || '',
          description: course.description || '',
          instructor: course.instructor || '',
          duration: course.duration || 0,
          level: course.level || 'beginner',
          category: course.category || '',
          price: course.price || 0,
          status: course.status || 'draft',
          thumbnail_url: course.thumbnailUrl,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur création cours:', error);
      return { data: null, error };
    }
  }

  // ===== OBJECTIVES =====
  static async getObjectives() {
    try {
      const { data, error } = await supabase
        .from('objectives')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur récupération objectifs:', error);
      return { data: null, error };
    }
  }

  static async createObjective(objective: Partial<Objective>) {
    try {
      const { data, error } = await supabase
        .from('objectives')
        .insert({
          title: objective.title || '',
          description: objective.description,
          quarter: objective.quarter || 'Q4',
          year: objective.year || new Date().getFullYear(),
          owner_id: objective.ownerId || 'ea87aa4e-eec0-4d8a-9743-f33a5553ddd8',
          status: objective.status || 'active',
          progress: objective.progress || 0,
          priority: objective.priority || 'Medium',
          start_date: objective.startDate,
          end_date: objective.endDate,
          category: objective.category,
          owner_name: objective.ownerName || 'BODIAN Rokhaya',
          team_members: objective.teamMembers || [],
          key_results: objective.keyResults || [],
          project_id: objective.projectId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur création objectif:', error);
      return { data: null, error };
    }
  }

  static async updateObjective(id: string, updates: Partial<Objective>) {
    try {
      const { data, error } = await supabase
        .from('objectives')
        .update({
          title: updates.title,
          description: updates.description,
          quarter: updates.quarter,
          year: updates.year,
          owner_id: updates.ownerId,
          status: updates.status,
          progress: updates.progress,
          priority: updates.priority,
          start_date: updates.startDate,
          end_date: updates.endDate,
          category: updates.category,
          owner_name: updates.ownerName,
          team_members: updates.teamMembers,
          key_results: updates.keyResults,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur mise à jour objectif:', error);
      return { data: null, error };
    }
  }

  static async deleteObjective(id: string) {
    try {
      const { data, error } = await supabase
        .from('objectives')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur suppression objectif:', error);
      return { data: null, error };
    }
  }

  // ===== DOCUMENTS =====
  static async getDocuments() {
    return await ApiHelper.get('knowledge_articles', { 
      select: '*', 
      order: 'created_at.desc' 
    });
  }

  static async createDocument(document: Partial<Document>) {
    try {
      const { data, error } = await supabase
        .from('knowledge_articles')
        .insert({
          title: document.title || '',
          content: document.content || '',
          summary: document.summary,
          category: document.category || '',
          type: document.type || 'article',
          status: document.status || 'published',
          tags: document.tags || [],
          author: document.author || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur création document:', error);
      return { data: null, error };
    }
  }

  // ===== NOTIFICATIONS =====
  static async getNotifications(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur récupération notifications:', error);
      return { data: null, error };
    }
  }

  static async createNotification(notification: any) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId || '',
          message: notification.message || '',
          type: notification.type || 'info',
          entity_id: notification.entityId,
          read: notification.read || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Erreur création notification:', error);
      return { data: null, error };
    }
  }

  static async markNotificationAsRead(id: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Erreur marquage notification:', error);
      return { error };
    }
  }
}

export default DataService;
