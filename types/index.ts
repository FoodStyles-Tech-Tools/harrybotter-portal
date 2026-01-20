export interface User {
  id: string; // uuid
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: string; // uuid
  name: string;
  email: string;
  avatar_url?: string;
  role?: string;
  discordId?: string; // May not exist in new schema, keeping for backward compatibility
}

export interface Project {
  id: string; // uuid
  name: string;
  description?: string;
  owner_id?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  department_id?: string;
  links?: any;
  collaborator_ids?: string[];
}

export interface Ticket {
  id: string; // uuid
  display_id?: string; // For HRB-XXX format
  title: string;
  description: string;
  projectName: string; // Mapped from project relation
  project_id?: string;
  requestedBy: string; // Mapped from requested_by_id relation
  requested_by_id?: string;
  reporterAvatar?: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  type: 'Request' | 'Bug' | 'Task';
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled' | 'Rejected' | 'On Hold' | 'Blocked';
  assignee: string; // Mapped from assignee_id relation
  assignee_id?: string;
  createdAt: string;
  created_at?: string;
  assignedAt?: string;
  assigned_at?: string;
  started_at?: string;
  completedAt?: string;
  completed_at?: string;
  updated_at?: string;
  relevantLink?: string; // Mapped from links jsonb
  links?: any;
  meta?: any;
  department_id?: string;
  dueDate?: string | null;
  due_date?: string | null;
}

export interface TicketFormData {
  title: string;
  description: string;
  url?: string;
  type: 'Request' | 'Bug' | 'Task';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  attachments: Attachment[];
  expectedDoneDate?: string | null;
}

export interface Attachment {
  type: 'file' | 'url';
  name?: string;
  data: string | FileData;
}

export interface FileData {
  name: string;
  type: string;
  base64: string;
}

export interface TicketSubmissionPayload {
  requester: string;
  requesterEmail?: string; // Optional - not stored in database
  tickets: TicketFormData[];
  projectId?: string | null; // uuid
  assignee?: string | null; // uuid
  assigneeName?: string | null;
}

