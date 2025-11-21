

export enum Priority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum TaskStatus {
  NOT_STARTED = 'Not Started',
  PLANNING = 'Planning',
  IN_PROGRESS = 'In Progress',
  COMPLETE = 'Complete',
  ON_HOLD = 'On Hold',
  BLOCKED = 'Blocked',
}

export enum TaskType {
  TASK = 'Task',
  EPIC = 'Epic',
}

export interface Comment {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  editedAt?: number;
}

export interface ProjectLink {
  title: string;
  url: string;
}

export type UserRole = 'Admin' | 'Member' | 'Viewer';

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  assignee: string; // User name or ID
  startDate?: string; // ISO date string
  dueDate: string; // ISO date string
  priority: Priority;
  status: TaskStatus;
  customStatusText?: string;
  phase: string; // Corresponds to Swimlane ID/Name
  tags: string[];
  subTaskIds?: string[]; // For Epics
  parentEpicId?: string; // For Tasks linked to Epics
  dependencies?: string[]; // IDs of tasks this depends on
  projectLinks?: ProjectLink[];
  deliverables?: ProjectLink[];
  isMilestone?: boolean;
  attributes: {
    Development: boolean;
    IXD: boolean;
    VXD: boolean;
    MXD: boolean;
    UXW: boolean;
    QA: boolean;
  };
  comments: Comment[];
  createdAt: number;
}

export interface Swimlane {
  id: string;
  name: string;
  order: number;
}

export interface User {
  id: string;
  name: string;
  alias: string;
  jobTitle?: string;
  avatarUrl: string;
  role: UserRole;
}

export interface ProjectDetails {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  docs: ProjectLink[];
}

export interface StatusUpdate {
  id: string;
  title: string;
  date: string; // ISO Date
  author: string;
  content: string;
  type: 'Daily' | 'Weekly' | 'Monthly' | 'Ad-hoc';
  projectStatus?: 'On Track' | 'Risks' | 'Blocked';
  comments?: Comment[];
}

export type SortOption = 'dueDate' | 'priority' | 'assignee';

export interface Theme {
  name: string;
  colors: {
    primary: Record<number, string>;
    secondary: Record<number, string>;
  };
}