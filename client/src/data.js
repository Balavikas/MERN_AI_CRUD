export const learner = { firstName: 'Vikas' };

// Course categories used by the filters. The courses themselves live in the Postgres `courses` table (GET /api/courses).
export const categories = [
  'Gen AI',
  'Agentic AI',
  'Web Development',
  'UI/UX',
  'Backend',
  'Data & AI',
  'Cloud & DevOps',
  'Mobile',
];

export const levels = ['Beginner', 'Intermediate', 'Advanced'];

export const educationLevels = ['Self-taught', 'High school', 'Bootcamp', 'Undergraduate', 'Postgraduate'];

// Keep these ids in sync with `roles` in server/auth.js.
export const roles = [
  { id: 'student', label: 'Student' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'director', label: 'Director' },
];

export const continueLearning = {
  courseId: 'mern-zero-to-shipped',
  lesson: 'Module 4 · Auth without the headache',
  completedLessons: 12,
  totalLessons: 21,
  progress: 58,
};

export const nextUp = {
  title: 'Live build: REST APIs, no BS',
  when: 'Thu, Oct 29 · 6:00 PM',
};

export const contactColumns = [
  { key: 'name', label: 'Name', className: 'candidate-name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'course', label: 'Course' },
  { key: 'education', label: 'Education' },
];

const joinedDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
// Due dates arrive as plain YYYY-MM-DD, which Date parses as UTC midnight, so format them in UTC too.
const dueDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' });

export function formatDate(value) {
  return value ? joinedDate.format(new Date(value)) : '';
}

export function formatDueDate(value) {
  return value ? dueDate.format(new Date(value)) : '';
}

export const learnerColumns = [
  { key: 'id', label: 'ID' },
  { key: 'full_name', label: 'Name', className: 'candidate-name' },
  { key: 'email', label: 'Email' },
  { key: 'phone_number', label: 'Phone' },
  { key: 'education', label: 'Education' },
  { key: 'created_at', label: 'Joined', format: formatDate },
];

export const studentColumns = [
  ...learnerColumns,
  { key: 'course_count', label: 'Courses' },
];

export const facultyColumns = learnerColumns;

export const resources = [
  {
    id: 'learner-roster',
    title: 'Learner roster',
    meta: 'CSV · live from Postgres',
    icon: 'database',
    kind: 'roster',
    endpoint: '/api/registrations',
    recordLabel: 'learners',
    columns: learnerColumns,
    filename: 'learner-roster.csv',
  },
  {
    id: 'mern-cheat-sheet',
    title: 'MERN cheat sheet',
    meta: 'Markdown · one page, zero fluff',
    icon: 'file',
    kind: 'text',
    filename: 'mern-cheat-sheet.md',
    content: [
      '# MERN cheat sheet: no BS edition',
      '',
      '## MongoDB',
      '- Read: `db.collection.find({ field: value })`',
      '- Write: `insertOne`, `updateOne({ _id }, { $set: { ... } })`, `deleteOne`',
      '- Index what you filter on a lot: `createIndex({ email: 1 }, { unique: true })`',
      '',
      '## Express',
      '- `app.use(express.json())` before any route that reads `req.body`',
      '- Wrap async handlers in try/catch and always send a status code',
      '',
      '## React',
      '- UI that changes goes in `useState`; side effects go in `useEffect` with a cleanup',
      '- Lift shared state to the closest common parent',
      '',
      '## Node',
      '- Secrets live in `.env`, load them with `dotenv`, never commit them',
      '',
    ].join('\n'),
  },
  {
    id: 'mentor-roster',
    title: 'Mentor roster',
    meta: 'CSV · live from MongoDB',
    icon: 'users',
    kind: 'roster',
    endpoint: '/api/tutors',
    recordLabel: 'mentors',
    columns: contactColumns,
    filename: 'mentor-roster.csv',
  },
  {
    id: 'git-survival-kit',
    title: 'Git survival kit',
    meta: 'Markdown · the commands you actually use',
    icon: 'terminal',
    kind: 'text',
    filename: 'git-survival-kit.md',
    content: [
      '# Git survival kit',
      '',
      '- Start a feature: `git switch -c my-feature`',
      '- See what changed: `git status` and `git diff`',
      '- Save progress: `git add -p` then `git commit -m "Say what and why"`',
      '- Catch up with main: `git fetch` then `git rebase origin/main`',
      '- Undo the last commit but keep the work: `git reset --soft HEAD~1`',
      '- Ship it: `git push -u origin my-feature` and open a PR',
      '',
    ].join('\n'),
  },
  {
    id: 'ship-it-checklist',
    title: 'Ship-it checklist',
    meta: 'Markdown · before you hit deploy',
    icon: 'rocket',
    kind: 'text',
    filename: 'ship-it-checklist.md',
    content: [
      '# Ship-it checklist',
      '',
      '- [ ] It runs from a clean clone with only the README',
      '- [ ] No secrets in the repo; `.env` is ignored',
      '- [ ] Loading, empty and error states all look intentional',
      '- [ ] Works at phone width and with the keyboard',
      '- [ ] Light and dark mode both pass a contrast check',
      '- [ ] You demoed it to one human and fixed what confused them',
      '',
    ].join('\n'),
  },
];

export const gallery = [
  { id: 'habit-pwa', title: 'Habit Tracker PWA', author: 'Riya', icon: 'check', tint: 'blue' },
  { id: 'recipe-finder', title: 'Recipe Finder', author: 'Omar', icon: 'search', tint: 'cyan' },
  { id: 'price-pulse', title: 'Price Pulse', author: 'Jin', icon: 'chart', tint: 'mix' },
  { id: 'portfolio-v3', title: 'Portfolio v3', author: 'Sam', icon: 'image', tint: 'cyan' },
  { id: 'study-buddy', title: 'Study Buddy Bot', author: 'Meera', icon: 'cpu', tint: 'mix' },
  { id: 'event-checkin', title: 'Event Check-in', author: 'Leo', icon: 'calendar', tint: 'blue' },
];

export const footerColumns = [
  {
    title: 'About',
    links: [{ label: 'Our story' }, { label: 'Mentors' }, { label: 'Careers' }, { label: 'Press kit' }],
  },
  {
    title: 'Courses',
    links: categories.slice(0, 4).map((category) => ({ label: category, category })),
  },
  {
    title: 'Resources',
    links: [
      { label: 'The Toolkit', page: 'toolkit' },
      { label: 'Project gallery', page: 'home', target: 'gallery' },
      { label: 'Manage Crew', page: 'crew' },
      { label: 'Join the Movement', page: 'home', target: 'join' },
    ],
  },
  {
    title: 'Contact',
    links: [{ label: 'Help center' }, { label: 'Community Discord' }, { label: 'Partner with us' }, { label: 'Send feedback' }],
  },
];

export const trendingAiCourses = [
  {
    id: 'genai-for-everyone',
    title: 'Generative AI for Everyone',
    instructor: 'Dev Mehta',
    duration: '2h 10m',
    level: 'Beginner',
    badge: 'Popular',
    icon: 'sparkles',
  },
  {
    id: 'prompt-engineering',
    title: 'Prompt Engineering Essentials',
    instructor: 'Lena Fischer',
    duration: '1h 45m',
    level: 'Beginner',
    badge: 'New',
    icon: 'terminal',
  },
  {
    id: 'ai-agents-js',
    title: 'Build AI Agents with JavaScript',
    instructor: 'Marcus Lee',
    duration: '4h 30m',
    level: 'Intermediate',
    badge: 'New',
    icon: 'cpu',
  },
  {
    id: 'ai-data-analysis',
    title: 'AI-Powered Data Analysis',
    instructor: 'Aisha Bello',
    duration: '3h 20m',
    level: 'Intermediate',
    badge: 'Popular',
    icon: 'chart',
  },
];
