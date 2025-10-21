

export type Role = 'student' | 'employer' | 'super_administrator' | 'administrator' | 'manager' | 'supervisor' | 'editor' | 'entrepreneur' | 'funder' | 'mentor' | 'intern' | 'trainer' | 'implementer' | 'coach' | 'facilitator' | 'publisher' | 'producer' | 'artist' | 'alumni';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  skills: string[];
  phone?: string;
  location?: string;
}

export interface FileAttachment {
  fileName: string;
  dataUrl: string;
}

export type EvidenceDocument = FileAttachment;
export type Receipt = FileAttachment;

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz';
  duration: string;
  icon: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
  evidenceDocuments?: EvidenceDocument[];
}

export interface Course {
  id: number;
  title: string;
  instructor: string;
  duration: string;
  progress: number;
  icon: string;
  description: string;
  modules: Module[];
  completedLessons?: string[];
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract';
  postedDate: string;
  description: string;
  requiredSkills: string[];
  applicants: User[];
}

export interface Task {
  id: string;
  text: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  priority: 'High' | 'Medium' | 'Low';
  assignee?: User;
  estimatedHours?: number;
  loggedHours?: number;
  dueDate?: string;
}

export interface Risk {
  id: string;
  description: string;
  likelihood: 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
  mitigationStrategy: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  dueDate: string;
  team: User[];
  tasks: Task[];
  risks: Risk[];
}

export interface KeyResult {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
}

export interface Objective {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  quarter?: string;
  year?: number;
  ownerId?: string;
  ownerName?: string;
  status?: string;
  progress?: number;
  priority?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  teamMembers?: string[];
  keyResults: KeyResult[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Contact {
  id: number;
  name: string;
  workEmail: string;
  personalEmail?: string;
  company: string;
  status: 'Lead' | 'Contacted' | 'Prospect' | 'Customer';
  avatar: string;
  officePhone?: string;
  mobilePhone?: string;
  whatsappNumber?: string;
}

export interface Document {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface TimeLog {
  id: number;
  userId: number;
  entityType: 'project' | 'course' | 'task';
  entityId: number | string;
  entityTitle: string;
  date: string;
  duration: number; // in minutes
  description: string;
}

export interface LeaveRequest {
  id: number;
  userId: number;
  userName: string;
  userAvatar: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  dueDate: string;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Partially Paid';
  receipt?: Receipt;
  paidDate?: string;
  paidAmount?: number;
  recurringSourceId?: number;
}

export interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  date: string;
  dueDate?: string;
  receipt?: Receipt;
  status: 'Paid' | 'Unpaid';
  budgetItemId?: string;
  recurringSourceId?: number;
}

export type RecurrenceFrequency = 'Monthly' | 'Quarterly' | 'Annually';

export interface RecurringInvoice {
    id: number;
    clientName: string;
    amount: number;
    frequency: RecurrenceFrequency;
    startDate: string;
    endDate?: string;
    lastGeneratedDate: string;
}

export interface RecurringExpense {
    id: number;
    category: string;
    description: string;
    amount: number;
    frequency: RecurrenceFrequency;
    startDate: string;
    endDate?: string;
    lastGeneratedDate: string;
}

export interface BudgetItem {
    id: string;
    description: string;
    amount: number;
}

export interface BudgetLine {
    id: string;
    title: string;
    items: BudgetItem[];
}

export interface Budget {
    id: number;
    title: string;
    type: 'Project' | 'Office';
    amount: number;
    startDate: string;
    endDate: string;
    projectId?: number;
    budgetLines: BudgetLine[];
}

export interface Meeting {
    id: number;
    title: string;
    startTime: string; // ISO string
    endTime: string; // ISO string
    attendees: User[];
    organizerId: number;
    description?: string;
}

export enum Language {
    EN = 'en',
    FR = 'fr',
}

export type Translation = { [key: string]: string };
export type Translations = { [key in Language]: Translation };

export interface AppNotification {
    id: string;
    message: string;
    date: string;
    entityType: 'invoice' | 'expense';
    entityId: number;
    isRead: boolean;
}

export interface AgentMessage {
  role: 'user' | 'ai';
  content: string;
}

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}