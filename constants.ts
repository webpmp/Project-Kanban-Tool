

import { Priority, Swimlane, Task, TaskStatus, TaskType, User, StatusUpdate, Theme, CalendarEvent, CategoryDefinition, MeetingNote } from './types';

// Helper for dynamic dates
const today = new Date();
const getDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
};

export const INITIAL_SWIMLANES: Swimlane[] = [
  { id: 'backlog', name: 'Backlog', order: 0 },
  { id: 'discover', name: 'Discover', order: 1 },
  { id: 'define', name: 'Define', order: 2 },
  { id: 'concept', name: 'Concept', order: 3 },
  { id: 'design', name: 'Design', order: 4 },
  { id: 'implementation', name: 'Implementation', order: 5 },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Chris Adkins', alias: 'chris@company.com', jobTitle: 'Program Manager', avatarUrl: 'https://picsum.photos/32/32?random=1', role: 'Admin' },
  { id: 'u2', name: 'Bob Smith', alias: 'bob@company.com', jobTitle: 'Lead Developer', avatarUrl: 'https://picsum.photos/32/32?random=2', role: 'Member' },
  { id: 'u3', name: 'Charlie Kim', alias: 'charlie@company.com', jobTitle: 'UX Researcher', avatarUrl: 'https://picsum.photos/32/32?random=3', role: 'Member' },
  { id: 'u4', name: 'Diana Prince', alias: 'diana@company.com', jobTitle: 'Stakeholder', avatarUrl: 'https://picsum.photos/32/32?random=4', role: 'Viewer' },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    type: TaskType.EPIC,
    title: 'Website Redesign',
    description: 'Complete overhaul of the corporate website.',
    assignee: 'Chris Adkins',
    startDate: getDate(-14), // Started 2 weeks ago
    dueDate: getDate(45), // Due in ~1.5 months
    priority: Priority.HIGH,
    status: TaskStatus.PLANNING,
    phase: 'backlog',
    tags: ['strategic', 'q4'],
    subTaskIds: ['t2'],
    isMilestone: true,
    attributes: { Development: true, IXD: true, VXD: true, MXD: false, UXW: true, QA: true },
    comments: [],
    createdAt: Date.now() - 1209600000,
  },
  {
    id: 't2',
    type: TaskType.TASK,
    title: 'Homepage Wireframes',
    description: 'Create low-fi wireframes for the new homepage.',
    assignee: 'Bob Smith',
    startDate: getDate(0), // Starts Today
    dueDate: getDate(7), // Due in 1 week
    priority: Priority.MEDIUM,
    status: TaskStatus.NOT_STARTED,
    phase: 'backlog',
    tags: ['design'],
    parentEpicId: 't1',
    isMilestone: false,
    attributes: { Development: false, IXD: true, VXD: false, MXD: false, UXW: false, QA: false },
    comments: [],
    createdAt: Date.now(),
  },
  {
    id: 't3',
    type: TaskType.TASK,
    title: 'User Research Interviews',
    description: 'Conduct 5 interviews with key stakeholders.',
    assignee: 'Charlie Kim',
    startDate: getDate(-5), // Started 5 days ago
    dueDate: getDate(2), // Due in 2 days
    priority: Priority.HIGH,
    status: TaskStatus.IN_PROGRESS,
    phase: 'discover',
    tags: ['research'],
    isMilestone: false,
    attributes: { Development: false, IXD: false, VXD: false, MXD: false, UXW: true, QA: false },
    comments: [], // Cleared default comment
    createdAt: Date.now() - 432000000,
  }
];

export const INITIAL_STATUS_UPDATES: StatusUpdate[] = [
    {
        id: 's1',
        title: 'Sprint Summary',
        date: getDate(-2),
        author: 'Chris Adkins',
        type: 'Weekly',
        content: 'We have successfully concluded the initial stakeholder interviews. Key findings suggest a strong need for mobile optimization. Design phase is scheduled to start next week.',
        projectStatus: 'On Track',
        comments: []
    },
    {
        id: 's2',
        title: 'Tech Stack Selection',
        date: getDate(-10),
        author: 'Bob Smith',
        type: 'Ad-hoc',
        content: 'After evaluating React vs Vue, the team has decided to proceed with React for better scalability and component reusability.',
        projectStatus: 'On Track',
        comments: []
    }
];

export const INITIAL_MEETING_NOTES: MeetingNote[] = [
    {
        id: 'm1',
        title: 'Project Kickoff',
        date: getDate(-15),
        createdAt: Date.now() - 1296000000,
        lastModified: Date.now() - 1296000000,
        content: `# Purpose/Goals
- Align on project scope and timelines for the Website Redesign.
- Assign initial roles and responsibilities.

# Decisions
- **Methodology**: We will use a hybrid Kanban/Agile approach.
- **Tech Stack**: React for frontend, Node.js for backend.
- **Cadence**: Weekly syncs on Mondays at 10 AM.

# Action Items
- [x] Create project board (Chris)
- [ ] Set up dev environment (Bob)
- [ ] Schedule user interviews (Charlie)

# Attendees
- Chris Adkins
- Bob Smith
- Charlie Kim
- Diana Prince`,
        comments: []
    },
    {
        id: 'm2',
        title: 'Design Critique',
        date: getDate(-3),
        createdAt: Date.now() - 259200000,
        lastModified: Date.now() - 259200000,
        content: `# Purpose/Goals
- Review initial wireframes.

# Decisions
- Homepage needs more emphasis on the "Contact Us" CTA.
- Navigation bar feels too cluttered.

# Action Items
- [ ] Update wireframes based on feedback (Charlie)
- [ ] Share new version by Friday (Charlie)

# Attendees
- Chris Adkins
- Charlie Kim`,
        comments: []
    }
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
    {
        id: 'e1',
        title: 'Design Review',
        startDate: getDate(3),
        endDate: getDate(3),
        category: 'Design Review',
        description: 'Reviewing homepage concepts with stakeholders.'
    },
    {
        id: 'e2',
        title: 'Team Sync',
        startDate: getDate(1),
        endDate: getDate(1),
        category: 'Meeting',
        description: 'Weekly team sync up.'
    },
    {
        id: 'e3',
        title: 'Chris PTO',
        startDate: getDate(5),
        endDate: getDate(7),
        category: 'PTO',
        description: 'Chris is out of office for long weekend.'
    }
];

export const INITIAL_CATEGORIES: CategoryDefinition[] = [
    { id: 'cat_task', label: 'Task', color: 'text-blue-600', bg: 'bg-blue-100 border-blue-200', icon: 'briefcase', type: 'system' },
    { id: 'cat_epic', label: 'Epic', color: 'text-purple-600', bg: 'bg-purple-100 border-purple-200', icon: 'layers', type: 'system' },
    { id: 'cat_milestone', label: 'Milestone', color: 'text-yellow-600', bg: 'bg-yellow-100 border-yellow-200', icon: 'flag', type: 'system' },
    { id: 'cat_pto', label: 'PTO', color: 'text-green-600', bg: 'bg-green-100 border-green-200', icon: 'coffee', type: 'custom' },
    { id: 'cat_design', label: 'Design Review', color: 'text-pink-600', bg: 'bg-pink-100 border-pink-200', icon: 'eye', type: 'custom' },
    { id: 'cat_workshop', label: 'Workshop', color: 'text-indigo-600', bg: 'bg-indigo-100 border-indigo-200', icon: 'users', type: 'custom' },
    { id: 'cat_meeting', label: 'Meeting', color: 'text-red-600', bg: 'bg-red-100 border-red-200', icon: 'users', type: 'custom' },
    { id: 'cat_other', label: 'Other', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200', icon: 'info', type: 'custom' },
];

export const PRIORITY_ORDER = {
  [Priority.CRITICAL]: 0,
  [Priority.HIGH]: 1,
  [Priority.MEDIUM]: 2,
  [Priority.LOW]: 3,
};

export const THEMES: Theme[] = [
  {
    name: 'Default',
    colors: {
      primary: { // Blue
        50: '239 246 255', 100: '219 234 254', 200: '191 219 254', 300: '147 197 253',
        400: '96 165 250', 500: '59 130 246', 600: '37 99 235', 700: '29 78 216',
        800: '30 64 175', 900: '30 58 138', 950: '23 37 84'
      },
      secondary: { // Purple
        50: '250 245 255', 100: '243 232 255', 200: '233 213 255', 300: '216 180 254',
        400: '192 132 252', 500: '168 85 247', 600: '147 51 234', 700: '126 34 206',
        800: '107 33 168', 900: '88 28 135', 950: '59 7 100'
      }
    }
  },
  {
    name: 'Nature',
    colors: {
      primary: { // Emerald
        50: '236 253 245', 100: '209 250 229', 200: '167 243 208', 300: '110 231 183',
        400: '52 211 153', 500: '16 185 129', 600: '5 150 105', 700: '4 120 87',
        800: '6 95 70', 900: '6 78 59', 950: '2 44 34'
      },
      secondary: { // Amber
        50: '255 251 235', 100: '254 243 199', 200: '253 230 138', 300: '252 211 77',
        400: '251 191 36', 500: '245 158 11', 600: '217 119 6', 700: '180 83 9',
        800: '146 64 14', 900: '120 53 15', 950: '69 26 3'
      }
    }
  },
  {
    name: 'Sunset',
    colors: {
      primary: { // Orange
        50: '255 247 237', 100: '255 237 213', 200: '254 215 170', 300: '253 186 116',
        400: '251 146 60', 500: '249 115 22', 600: '234 88 12', 700: '194 65 12',
        800: '154 52 18', 900: '124 45 18', 950: '67 20 7'
      },
      secondary: { // Rose
        50: '255 241 242', 100: '255 228 230', 200: '254 205 211', 300: '253 164 175',
        400: '251 113 133', 500: '244 63 94', 600: '225 29 72', 700: '190 18 60',
        800: '159 18 57', 900: '136 19 55', 950: '76 5 25'
      }
    }
  },
  {
    name: 'Ocean',
    colors: {
      primary: { // Cyan
        50: '236 254 255', 100: '207 250 254', 200: '165 243 252', 300: '103 232 249',
        400: '34 211 238', 500: '6 182 212', 600: '8 145 178', 700: '14 116 144',
        800: '21 94 117', 900: '22 78 99', 950: '8 51 68'
      },
      secondary: { // Teal
        50: '240 253 250', 100: '204 251 241', 200: '153 246 228', 300: '94 234 212',
        400: '45 212 191', 500: '20 184 166', 600: '13 148 136', 700: '15 118 110',
        800: '17 94 89', 900: '19 78 74', 950: '4 47 46'
      }
    }
  },
  {
    name: 'Midnight',
    colors: {
      primary: { // Indigo
        50: '238 242 255', 100: '224 231 255', 200: '199 210 254', 300: '165 180 252',
        400: '129 140 248', 500: '99 102 241', 600: '79 70 229', 700: '67 56 202',
        800: '55 48 163', 900: '49 46 129', 950: '30 27 75'
      },
      secondary: { // Violet
        50: '245 243 255', 100: '237 233 254', 200: '221 214 254', 300: '196 181 253',
        400: '167 139 250', 500: '139 92 246', 600: '124 58 237', 700: '109 40 217',
        800: '91 33 182', 900: '76 29 149', 950: '46 16 101'
      }
    }
  }
];