export interface User {
  name: string;
  email: string;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  discordId?: string;
}

export interface Project {
  id: number;
  name: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  projectName: string;
  requestedBy: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  type: 'Request' | 'Bug' | 'Task';
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled' | 'Rejected' | 'On Hold' | 'Blocked';
  assignee: string;
  createdAt: string;
  assignedAt?: string;
  completedAt?: string;
  relevantLink?: string;
}

export interface TicketFormData {
  title: string;
  description: string;
  type: 'Request' | 'Bug' | 'Task';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  attachments: Attachment[];
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
  projectId?: number | null;
  assignee?: number | null;
  assigneeName?: string | null;
}

