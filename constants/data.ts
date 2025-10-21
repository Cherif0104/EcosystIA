import { User, Course, Job, Project, Task, Contact, Document, Objective, TimeLog, LeaveRequest, Invoice, Expense, RecurringInvoice, RecurringExpense, Budget, Meeting } from '../types';

export const mockUsers: { [key: string]: User } = {
  student: {
    id: 1,
    name: "Amina Diop",
    email: "amina.diop@example.com",
    avatar: "https://picsum.photos/seed/student/100/100",
    role: 'student',
    skills: ["Digital Marketing", "Community Management", "Content Creation"],
  },
  employer: {
    id: 2,
    name: "Moussa Faye",
    email: "moussa.faye@example.com",
    avatar: "https://picsum.photos/seed/employer/100/100",
    role: 'employer',
    skills: ["Team Leadership", "Recruitment", "Financial Planning"],
  },
  super_administrator: {
    id: 3,
    name: "Fatou N'diaye",
    email: "fatou.ndiaye@senegelworkflow.org",
    avatar: "https://picsum.photos/seed/admin/100/100",
    role: 'super_administrator',
    skills: ["System Administration", "Data Analysis", "Strategic Planning"],
  },
   student2: {
    id: 4,
    name: 'Binta Fall',
    email: 'binta.fall@example.com',
    avatar: 'https://picsum.photos/seed/student2/100/100',
    role: 'student',
    skills: ['Graphic Design', 'UI/UX', 'Figma', 'Adobe Suite']
  },
  student3: {
    id: 5,
    name: 'Cheikh Sarr',
    email: 'cheikh.sarr@example.com',
    avatar: 'https://picsum.photos/seed/student3/100/100',
    role: 'student',
    skills: ['Project Management', 'Agile Methodologies', 'Jira', 'Risk Assessment']
  },
  administrator: {
    id: 6,
    name: "Ndèye Coumba",
    email: "ndeye.coumba@senegelworkflow.org",
    avatar: "https://picsum.photos/seed/staff/100/100",
    role: 'administrator',
    skills: ["Project Coordination", "Volunteer Management", "Training Facilitation", "Mentorship"],
  },
  manager: {
    id: 7,
    name: "Daouda Sow",
    email: "daouda.sow@senegelworkflow.org",
    avatar: "https://picsum.photos/seed/manager/100/100",
    role: 'manager',
    skills: ["Team Leadership", "Budgeting", "Product Management"],
  },
  supervisor: {
    id: 8,
    name: "Coumba Diallo",
    email: "coumba.diallo@senegelworkflow.org",
    avatar: "https://picsum.photos/seed/supervisor/100/100",
    role: 'supervisor',
    skills: ["Mentorship", "Quality Assurance", "Curriculum Development"],
  },
  editor: {
    id: 9,
    name: "Lamine Gueye",
    email: "lamine.gueye@senegelworkflow.org",
    avatar: "https://picsum.photos/seed/editor/100/100",
    role: 'editor',
    skills: ["Copywriting", "Editing", "SEO", "Content Strategy"],
  },
  entrepreneur: {
    id: 10,
    name: "Omar Kante",
    email: "omar.kante@startup.com",
    avatar: "https://picsum.photos/seed/entrepreneur/100/100",
    role: 'entrepreneur',
    skills: ["Business Development", "Pitching", "Product Management"],
  },
  funder: {
    id: 11,
    name: "Mariam Ba",
    email: "mariam.ba@fondation.org",
    avatar: "https://picsum.photos/seed/funder/100/100",
    role: 'funder',
    skills: ["Grant Management", "Impact Investment", "Due Diligence"],
  },
  mentor: {
    id: 12,
    name: "Babacar Dieng",
    email: "babacar.dieng@mentor.pro",
    avatar: "https://picsum.photos/seed/mentor/100/100",
    role: 'mentor',
    skills: ["Career Coaching", "Software Engineering", "Leadership"],
  },
  intern: {
    id: 13,
    name: "Awa Gueye",
    email: "awa.gueye@senegelworkflow.org",
    avatar: "https://picsum.photos/seed/intern/100/100",
    role: 'intern',
    skills: ["Research", "Social Media", "Data Entry"],
  }
};

export const mockAllUsers = Object.values(mockUsers);

export const mockCourses: Course[] = [
  { 
    id: 1, 
    title: "Digital Marketing Fundamentals", 
    instructor: "Khadija Sow", 
    duration: "6 Weeks", 
    progress: 75, 
    icon: "fas fa-bullhorn",
    description: "Learn the core concepts of digital marketing, from social media and content strategy to SEO and email campaigns. This course is perfect for aspiring marketers and entrepreneurs.",
    modules: [
      { id: "m1-1", title: "Week 1: Introduction to Digital Marketing", lessons: [
        { id: "l1-1-1", title: "The Digital Landscape", type: "video", duration: "15 min", icon: "fas fa-play-circle" },
        { id: "l1-1-2", title: "Key Terminology", type: "reading", duration: "20 min", icon: "fas fa-book-open" },
      ],
      evidenceDocuments: [
          { fileName: 'market-analysis.pdf', dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...' }
      ]
      },
      { id: "m1-2", title: "Week 2: Content Strategy", lessons: [
        { id: "l1-2-1", title: "Creating a Content Calendar", type: "video", duration: "25 min", icon: "fas fa-play-circle" },
        { id: "l1-2-2", title: "Quiz: Content Fundamentals", type: "quiz", duration: "10 min", icon: "fas fa-question-circle" },
      ]}
    ]
  },
  { 
    id: 2, 
    title: "Entrepreneurship 101", 
    instructor: "Babacar Cissé", 
    duration: "8 Weeks", 
    progress: 40, 
    icon: "fas fa-lightbulb",
    description: "From idea to execution, this course covers the essential steps to starting and growing a successful business in the West African context. Learn about business planning, fundraising, and market analysis.",
    modules: [
        { id: "m2-1", title: "Module 1: Ideation & Validation", lessons: [
            { id: "l2-1-1", title: "Finding Your Business Idea", type: "video", duration: "30 min", icon: "fas fa-play-circle" },
            { id: "l2-1-2", title: "Market Research Techniques", type: "reading", duration: "45 min", icon: "fas fa-book-open" },
        ]},
        { id: "m2-2", title: "Module 2: Business Planning", lessons: [
            { id: "l2-2-1", title: "Crafting a Lean Canvas", type: "video", duration: "20 min", icon: "fas fa-play-circle" },
            { id: "l2-2-2", title: "Financial Projections for Startups", type: "reading", duration: "60 min", icon: "fas fa-book-open" },
            { id: "l2-2-3", title: "Quiz: Business Plan Essentials", type: "quiz", duration: "15 min", icon: "fas fa-question-circle" },
        ]}
    ]
  },
  { 
    id: 3, 
    title: "Project Management with AI", 
    instructor: "Dr. Diallo", 
    duration: "12 Weeks", 
    progress: 90, 
    icon: "fas fa-tasks",
    description: "Discover how Artificial Intelligence is revolutionizing project management. This course explores AI tools for task automation, risk prediction, and resource optimization.",
    modules: [
       { id: "m3-1", title: "Part 1: PM Fundamentals", lessons: [
         { id: "l3-1-1", title: "The Project Lifecycle", type: "video", duration: "18 min", icon: "fas fa-play-circle" },
       ]},
       { id: "m3-2", title: "Part 2: AI in Project Management", lessons: [
         { id: "l3-2-1", title: "Automating Tasks with AI", type: "video", duration: "35 min", icon: "fas fa-play-circle" },
         { id: "l3-2-2", title: "Predictive Analytics for Timelines", type: "reading", duration: "50 min", icon: "fas fa-book-open" },
       ]}
    ]
  },
  { 
    id: 4, 
    title: "Introduction to Web Development", 
    instructor: "Omar Ba", 
    duration: "10 Weeks", 
    progress: 25, 
    icon: "fas fa-code",
    description: "Build your first websites with HTML, CSS, and JavaScript. This course provides a solid foundation for anyone looking to become a web developer.",
    modules: [
      { id: "m4-1", title: "HTML & CSS Basics", lessons: [
        { id: "l4-1-1", title: "Your First Web Page", type: "video", duration: "40 min", icon: "fas fa-play-circle" }
      ]}
    ]
  },
];

export const mockJobs: Job[] = [
  { id: 1, title: "Community Manager", company: "Senegal Numerique SA", location: "Dakar, Senegal", type: "Full-time", postedDate: "2 days ago", description: "Manage our online community, create engaging content, and drive social media strategy.", requiredSkills: ["Community Management", "Social Media", "Content Creation"], applicants: [] },
  { id: 2, title: "Project Assistant (Non-Profit)", company: "SENEGEL WorkFlow Org", location: "Thiès, Senegal", type: "Part-time", postedDate: "5 days ago", description: "Assist project managers with daily tasks, reporting, and stakeholder communication in a non-profit environment.", requiredSkills: ["Project Management", "Communication", "Microsoft Office"], applicants: [mockUsers.student3] },
  { id: 3, title: "Artisan Marketplace Coordinator", company: "Artisans du Sénégal", location: "Remote", type: "Contract", postedDate: "1 week ago", description: "Coordinate with local artisans to feature their products on our e-commerce platform.", requiredSkills: ["E-commerce", "Vendor Management", "Logistics"], applicants: [] },
  { id: 4, title: "Junior Graphic Designer", company: "Wave Mobile Money", location: "Dakar, Senegal", type: "Full-time", postedDate: "3 days ago", description: "Create compelling visual assets for our marketing campaigns across various digital channels.", requiredSkills: ["Graphic Design", "Adobe Suite", "UI/UX"], applicants: [mockUsers.student2] },
];


export const mockProjects: Project[] = [
    {
        id: "1",
        title: "Lancement de la campagne marketing du quatrième trimestre",
        description: "Develop and execute a comprehensive marketing campaign for the new product line. The campaign should target young professionals and students.",
        status: "In Progress",
        dueDate: "2024-12-31",
        team: [mockUsers.student, mockUsers.super_administrator, mockUsers.student2],
        tasks: [
            { id: 't1', text: "Finalize key messaging and value proposition", status: 'Done', priority: 'High', assignee: mockUsers.super_administrator, estimatedTime: 8, loggedTime: 6, dueDate: '2024-10-15' },
            { id: 't2', text: "Develop social media content calendar", status: 'Done', priority: 'High', assignee: mockUsers.student, estimatedTime: 12, loggedTime: 15, dueDate: '2024-10-20' },
            { id: 't3', text: "Create video testimonials with beta users", status: 'In Progress', priority: 'Medium', assignee: mockUsers.student2, estimatedTime: 16, loggedTime: 4.5, dueDate: '2024-11-05' },
            { id: 't4', text: "Organize launch webinar", status: 'To Do', priority: 'High', estimatedTime: 40, dueDate: '2024-12-01' },
        ],
        risks: []
    },
    {
        id: "2",
        title: "E-commerce Platform Upgrade",
        description: "Integrate a new payment gateway and AI-powered recommendation engine into the existing e-commerce platform to improve user experience and increase sales.",
        status: "Not Started",
        dueDate: "2025-03-15",
        team: [mockUsers.student3, mockUsers.employer],
        tasks: [],
        risks: []
    },
    {
        id: "3",
        title: "AI Chatbot for Customer Support",
        description: "Design, develop, and deploy an AI-powered chatbot to assist customers with common questions about products, orders, and platform navigation.",
        status: "Completed",
        dueDate: "2024-06-01",
        team: [mockUsers.student, mockUsers.super_administrator],
        tasks: [
             { id: 't1-p3', text: "Gather FAQ data", status: 'Done', priority: 'High', estimatedTime: 10, loggedTime: 10 },
             { id: 't2-p3', text: "Select NLP service", status: 'Done', priority: 'High', estimatedTime: 20, loggedTime: 18 },
             { id: 't3-p3', text: "Develop conversation flows", status: 'Done', priority: 'Medium', estimatedTime: 30, loggedTime: 35 },
             { id: 't4-p3', text: "Integrate with frontend", status: 'Done', priority: 'Medium', estimatedTime: 25, loggedTime: 25 },
        ],
        risks: []
    }
];

export const mockGoals: Objective[] = [
    {
        id: "okr1",
        projectId: "1",
        title: "Lancer avec succès la campagne du quatrième trimestre et obtenir une adoption rapide",
        keyResults: [
            { id: 'kr1-1', title: "Atteindre 10 000 inscriptions d'utilisateurs au cours du premier mois suivant le lancement", current: 3500, target: 10000, unit: "utilisateurs" },
            { id: 'kr1-2', title: "Sécuriser 50 partenaires B2B pour intégrer le nouveau produit", current: 5, target: 50, unit: "partenaires" },
            { id: 'kr1-3', title: "Atteindre un score de satisfaction utilisateur de 8,5/10", current: 0, target: 8.5, unit: "/10" },
        ]
    }
];

export const mockContacts: Contact[] = [
    { id: 1, name: "Ousmane Diallo", workEmail: "o.diallo@example.com", company: "Innovate Inc.", status: "Lead", avatar: "https://picsum.photos/seed/contact1/100/100", officePhone: "+1-202-555-0103", mobilePhone: "+1-202-555-0121", whatsappNumber: "+1-202-555-0121" },
    { id: 2, name: "Mariama Ba", workEmail: "mariama@techsolve.co", personalEmail: "mariama.ba.perso@email.com", company: "TechSolve", status: "Contacted", avatar: "https://picsum.photos/seed/contact2/100/100", mobilePhone: "+1-202-555-0187", whatsappNumber: "+1-202-555-0187" },
    { id: 3, name: "Abdoulaye Wade", workEmail: "abdoulaye@dataconnect.io", company: "DataConnect", status: "Customer", avatar: "https://picsum.photos/seed/contact3/100/100", officePhone: "+1-202-555-0155" },
    { id: 4, name: "David Chen", workEmail: "david.chen@synergy.com", company: "Synergy Corp", status: "Prospect", avatar: "https://picsum.photos/seed/contact4/100/100", mobilePhone: "+1-202-555-0199" },
    { id: 5, name: "Fatima Al-Fassi", workEmail: "fatima.fassi@future-dynamics.net", company: "Future Dynamics", status: "Lead", avatar: "https://picsum.photos/seed/contact5/100/100", mobilePhone: "+1-202-555-0143" },

];

export const mockDocuments: Document[] = [
    {
        id: 1,
        title: "Q3 Strategy Meeting Summary",
        content: "The Q3 strategy meeting focused on expanding our reach into the European market. Key discussion points included identifying local partners, adapting marketing materials, and planning a pilot program for our enterprise solution. The primary action item is for the projects team to develop a detailed implementation plan by the end of the month.",
        createdAt: "2024-07-15",
        createdBy: "Fatou N'diaye"
    },
    {
        id: 2,
        title: "User Feedback Analysis - May 2024",
        content: "Analysis of user feedback from May shows a high demand for advanced analytics features and mobile application development. Users also expressed a desire for a more streamlined integration process with third-party tools. The technical team will prioritize API improvements in the next sprint.",
        createdAt: "2024-06-05",
        createdBy: "Fatou N'diaye"
    }
];

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(yesterday.getDate() - 1);
const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

const nextWeek = new Date();
nextWeek.setDate(today.getDate() + 7);
const dayAfter = new Date(nextWeek);
dayAfter.setDate(nextWeek.getDate() + 1);

export const mockTimeLogs: TimeLog[] = [
    { id: 1, userId: 1, entityType: 'task', entityId: 't1', entityTitle: 'Finalize key messaging and value proposition', date: today.toISOString().split('T')[0], duration: 120, description: 'Reviewed stakeholder feedback and updated the messaging doc.' },
    { id: 2, userId: 1, entityType: 'task', entityId: 't2', entityTitle: 'Develop social media content calendar', date: yesterday.toISOString().split('T')[0], duration: 180, description: 'Drafted posts for the first two weeks of launch.' },
    { id: 3, userId: 1, entityType: 'course', entityId: 1, entityTitle: 'Digital Marketing Fundamentals', date: yesterday.toISOString().split('T')[0], duration: 60, description: 'Watched video on Content Strategy.' },
    { id: 4, userId: 4, entityType: 'task', entityId: 't3', entityTitle: 'Create video testimonials with beta users', date: twoDaysAgo.toISOString().split('T')[0], duration: 240, description: 'Filming session with beta user Binta.' },
    { id: 5, userId: 1, entityType: 'project', entityId: 1, entityTitle: 'Q4 Marketing Campaign Launch', date: twoDaysAgo.toISOString().split('T')[0], duration: 45, description: 'General project planning meeting with the team.' },
];

export const mockLeaveRequests: LeaveRequest[] = [
    { id: 1, userId: 1, userName: "Amina Diop", userAvatar: mockUsers.student.avatar, startDate: "2024-10-20", endDate: "2024-10-25", reason: "Family vacation.", status: "Approved" },
    { id: 2, userId: 4, userName: "Binta Fall", userAvatar: mockUsers.student2.avatar, startDate: nextWeek.toISOString().split('T')[0], endDate: dayAfter.toISOString().split('T')[0], reason: "Personal days.", status: "Pending" },
    { id: 3, userId: 5, userName: "Cheikh Sarr", userAvatar: mockUsers.student3.avatar, startDate: "2024-09-15", endDate: "2024-09-15", reason: "Medical appointment.", status: "Rejected" },
];

export const mockInvoices: Invoice[] = [
    { id: 1, invoiceNumber: 'INV-001', clientName: 'Innovate Inc.', amount: 2500, dueDate: '2024-11-15', status: 'Paid', receipt: { fileName: 'receipt-innovate.txt', dataUrl: 'data:text/plain;base64,SW5ub3ZhdGUgSW5jLiBSZWNlaXB0' }, paidDate: '2024-11-14' },
    { id: 2, invoiceNumber: 'INV-002', clientName: 'TechSolve', amount: 1800, dueDate: '2024-11-20', status: 'Partially Paid', paidAmount: 900 },
    { id: 3, invoiceNumber: 'INV-003', clientName: 'DataConnect', amount: 3200, dueDate: '2024-10-01', status: 'Overdue' },
    { id: 4, invoiceNumber: 'INV-004', clientName: 'Synergy Corp', amount: 500, dueDate: '2024-11-30', status: 'Sent' },
];

export const mockExpenses: Expense[] = [
    { id: 1, category: 'Software', description: 'Monthly subscription for design tools', amount: 150, date: '2024-11-01', dueDate: '2024-11-10', receipt: { fileName: 'software-sub.pdf', dataUrl: 'data:application/pdf;base64,JVBERi0xLjQKJ...' }, status: 'Paid', budgetItemId: 'b2-l1-i1' },
    { id: 2, category: 'Office Supplies', description: 'New chairs for the meeting room', amount: 800, date: '2024-10-25', status: 'Paid' },
    { id: 3, category: 'Marketing', description: 'Social media campaign ads', amount: 450, date: '2024-10-15', status: 'Unpaid', budgetItemId: 'b1-l1-i1' },
    { id: 4, category: 'Utilities', description: 'Internet and electricity bill', amount: 250, date: '2024-11-05', dueDate: '2024-11-25', status: 'Unpaid' },
];

export const mockRecurringInvoices: RecurringInvoice[] = [
    { id: 1, clientName: 'Innovate Inc.', amount: 2500, frequency: 'Monthly', startDate: '2024-01-15', lastGeneratedDate: '2024-10-15' },
];

export const mockRecurringExpenses: RecurringExpense[] = [
    { id: 1, category: 'Software', description: 'Monthly subscription for design tools', amount: 150, frequency: 'Monthly', startDate: '2024-01-01', lastGeneratedDate: '2024-10-01' },
];

export const mockBudgets: Budget[] = [
    { 
        id: 1, 
        title: "Q4 Marketing Campaign Budget", 
        type: 'Project', 
        amount: 5000, 
        startDate: '2024-10-01', 
        endDate: '2024-12-31', 
        projectId: 1,
        budgetLines: [
            {
                id: 'b1-l1',
                title: 'Digital Advertising',
                items: [
                    { id: 'b1-l1-i1', description: 'Social Media Ads', amount: 2000 },
                    { id: 'b1-l1-i2', description: 'Search Engine Ads', amount: 1500 },
                ],
            },
            {
                id: 'b1-l2',
                title: 'Content Creation',
                items: [
                    { id: 'b1-l2-i1', description: 'Video Production', amount: 1000 },
                    { id: 'b1-l2-i2', description: 'Blog Post Writers', amount: 500 },
                ],
            },
        ],
    },
    { 
        id: 2, 
        title: "Annual Software Subscriptions", 
        type: 'Office', 
        amount: 2000, 
        startDate: '2024-01-01', 
        endDate: '2024-12-31',
        budgetLines: [
            {
                id: 'b2-l1',
                title: 'Design & Development',
                items: [
                    { id: 'b2-l1-i1', description: 'Figma, Adobe Suite, etc.', amount: 1200 },
                    { id: 'b2-l1-i2', description: 'GitHub Pro', amount: 800 },
                ],
            }
        ],
    },
];

const getTodayAtTime = (hour: number, minute: number = 0) => {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
}

export const mockMeetings: Meeting[] = [
    {
        id: 1,
        title: 'Q4 Campaign Kick-off',
        startTime: getTodayAtTime(10),
        endTime: getTodayAtTime(11),
        attendees: [mockUsers.student, mockUsers.super_administrator, mockUsers.student2],
        organizerId: mockUsers.super_administrator.id,
        description: 'Initial planning session for the Q4 marketing campaign.'
    },
    {
        id: 2,
        title: 'Weekly Stand-up',
        startTime: getTodayAtTime(9),
        endTime: getTodayAtTime(9, 15),
        attendees: Object.values(mockUsers),
        organizerId: mockUsers.manager.id,
    },
    {
        id: 3,
        title: 'Design Review',
        startTime: getTodayAtTime(14),
        endTime: getTodayAtTime(15, 30),
        attendees: [mockUsers.student2, mockUsers.manager, mockUsers.editor],
        organizerId: mockUsers.manager.id,
        description: 'Review the latest mockups for the e-commerce platform upgrade.'
    }
];