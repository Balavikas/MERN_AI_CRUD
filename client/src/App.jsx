import { useCallback, useEffect, useState } from 'react';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Icon from './components/Icon.jsx';
import LogoutCountdown from './components/LogoutCountdown.jsx';
import Modal from './components/Modal.jsx';
import SubNav from './components/SubNav.jsx';
import useInactivityTimer from './hooks/useInactivityTimer.js';
import useTheme from './hooks/useTheme.js';
import CrewPage from './pages/CrewPage.jsx';
import DirectorPage from './pages/DirectorPage.jsx';
import FacultyPage from './pages/FacultyPage.jsx';
import HomePage from './pages/HomePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import StudentPage from './pages/StudentPage.jsx';
import ToolkitPage from './pages/ToolkitPage.jsx';
import { onSystemError } from './api.js';
import { continueLearning, inactivityLogoutGraceMs, inactivityTimeoutMs, learner } from './data.js';
import { scrollBehavior, withViewTransition } from './utils/motion.js';

// Each role lands on its own dashboard (specs/AfterLogin.md), shown as the first tab.
const dashboards = {
  student: { label: 'My Learning', Page: StudentPage },
  faculty: { label: 'Faculty Desk', Page: FacultyPage },
  director: { label: "Director's Office", Page: DirectorPage },
};

const sharedPages = [
  { id: 'home', label: 'Home' },
  { id: 'crew', label: 'Manage Crew' },
  { id: 'toolkit', label: 'The Toolkit' },
];

// Pages kept in the code but hidden from users for now (specs/Cleanup.md): no nav tab, no footer links into them,
// and the course search/filters (which only serve Home) are hidden too. Remove an id to bring that page back.
const hiddenPages = new Set(['home', 'crew', 'toolkit']);

const noFilters = { category: '', level: '' };
const sessionStorageKey = 'skillstack.session';

function restoreSession() {
  const savedSession = localStorage.getItem(sessionStorageKey) ?? sessionStorage.getItem(sessionStorageKey);
  if (!savedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(savedSession);
    if (
      parsedSession
      && parsedSession.id
      && typeof parsedSession.firstName === 'string'
      && dashboards[parsedSession.role]
      && typeof parsedSession.token === 'string'
    ) {
      return parsedSession;
    }
  } catch {
    // Discard malformed stored session data and show the login page.
  }

  localStorage.removeItem(sessionStorageKey);
  sessionStorage.removeItem(sessionStorageKey);
  return null;
}

function App() {
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState(restoreSession);
  const [activePage, setActivePage] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(noFilters);
  const [startedCourseIds, setStartedCourseIds] = useState([]);
  const [scrollRequest, setScrollRequest] = useState(null);
  // Session dialogs (specs/Timeout.md): shown only while someone is logged in, never on the login page.
  // When the inactivity dialog opened (a Date.now() timestamp), or null while the user is active.
  const [inactiveSince, setInactiveSince] = useState(null);
  const inactive = inactiveSince !== null;
  const [systemError, setSystemError] = useState(false);

  useInactivityTimer(
    Boolean(session) && !inactive && !systemError,
    inactivityTimeoutMs,
    () => setInactiveSince(Date.now()),
  );

  // api.js reports failures the user can't fix (server down, 5xx, unreadable response, expired session).
  useEffect(() => (session ? onSystemError(() => setSystemError(true)) : undefined), [session]);

  const navigate = useCallback((page, targetId, focusId) => {
    if (page !== activePage) {
      withViewTransition(() => {
        setActivePage(page);
        // A search typed on the dashboard carries over to the course list on Home.
        if (!(activePage === 'dashboard' && page === 'home')) {
          setQuery('');
        }
      });
    }
    setScrollRequest({ page, targetId, focusId });
  }, [activePage]);

  // The page switch may land a frame later (inside a view transition), so wait for it before scrolling.
  useEffect(() => {
    if (!scrollRequest || scrollRequest.page !== activePage) {
      return;
    }
    const { targetId, focusId } = scrollRequest;
    const target = targetId && document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
    } else {
      window.scrollTo({ top: 0 });
    }
    if (focusId) {
      document.getElementById(focusId)?.focus({ preventScroll: true });
    }
    setScrollRequest(null);
  }, [scrollRequest, activePage]);

  function logIn(account) {
    const nextSession = {
      id: account.id,
      firstName: account.full_name.split(' ')[0] || learner.firstName,
      role: account.role,
      token: account.token,
    };
    const storage = account.remember === false ? sessionStorage : localStorage;
    const otherStorage = account.remember === false ? localStorage : sessionStorage;
    otherStorage.removeItem(sessionStorageKey);
    storage.setItem(sessionStorageKey, JSON.stringify(nextSession));

    withViewTransition(() => {
      setSession(nextSession);
      setActivePage('dashboard');
    });
    window.scrollTo({ top: 0 });
  }

  function logOut() {
    localStorage.removeItem(sessionStorageKey);
    sessionStorage.removeItem(sessionStorageKey);
    setInactiveSince(null);
    setSystemError(false);
    withViewTransition(() => {
      setSession(null);
      setActivePage('dashboard');
      setQuery('');
      setFilters(noFilters);
      setStartedCourseIds([]);
    });
    window.scrollTo({ top: 0 });
  }

  // Nobody answered the inactivity dialog in time: log out and go back to the login page.
  useEffect(() => {
    if (!inactive || systemError) {
      return undefined;
    }
    const timer = setTimeout(logOut, inactiveSince + inactivityLogoutGraceMs - Date.now());
    return () => clearTimeout(timer);
  }, [inactiveSince, systemError]);

  function toggleCategory(category) {
    setFilters((current) => ({ ...current, category: current.category === category ? '' : category }));
  }

  function clearFilters() {
    setFilters(noFilters);
    setQuery('');
  }

  function pickCategory(category) {
    setFilters({ ...noFilters, category });
    navigate('home', 'courses');
  }

  function toggleStarted(course) {
    setStartedCourseIds((current) => (
      current.includes(course.id) ? current.filter((id) => id !== course.id) : [...current, course.id]
    ));
  }

  function resume() {
    clearFilters();
    navigate('home', `course-${continueLearning.courseId}`, `course-${continueLearning.courseId}-cta`);
  }

  if (!session) {
    return (
      <div className="auth-shell">
        <a className="skip-link" href="#main">Skip to content</a>
        <div className="backdrop" aria-hidden="true" />
        <div className="noise" aria-hidden="true" />
        <AuthPage theme={theme} onToggleTheme={toggleTheme} onAuthenticated={logIn} />
      </div>
    );
  }

  const dashboard = dashboards[session.role];
  const pages = [{ id: 'dashboard', label: dashboard.label }, ...sharedPages.filter((page) => !hiddenPages.has(page.id))];

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="backdrop" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />

      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onHome={() => navigate(hiddenPages.has('home') ? 'dashboard' : 'home')}
        onLogOut={logOut}
      />
      <SubNav
        pages={pages}
        activePage={activePage}
        onNavigate={navigate}
        query={query}
        onQueryChange={setQuery}
        filters={filters}
        onFiltersChange={setFilters}
        showTools={!hiddenPages.has('home')}
      />

      <main id="main" className="main" tabIndex={-1}>
        {activePage === 'dashboard' && <dashboard.Page session={session} />}
        {activePage === 'home' && (
          <HomePage
            learnerName={session.firstName}
            query={query}
            filters={filters}
            startedCourseIds={startedCourseIds}
            onCategoryToggle={toggleCategory}
            onClearFilters={clearFilters}
            onGetStarted={toggleStarted}
            onResume={resume}
            onNavigate={navigate}
          />
        )}
        {activePage === 'crew' && <CrewPage query={query} onNavigate={navigate} />}
        {activePage === 'toolkit' && <ToolkitPage query={query} />}
      </main>

      <Footer onNavigate={navigate} onCategoryPick={pickCategory} hiddenPages={hiddenPages} />

      <Modal
        id="inactivity"
        open={inactive && !systemError}
        title="Still there?"
        description="You've been inactive for some time. Do you still want to continue?"
        dismissible={false}
      >
        {inactive && <LogoutCountdown deadline={inactiveSince + inactivityLogoutGraceMs} />}
        <div className="dashboard__buttons">
          <button type="button" className="btn btn--primary" onClick={() => setInactiveSince(null)}>
            Continue
          </button>
          <button type="button" className="btn btn--outline" onClick={logOut}>
            <Icon name="logOut" size={18} />
            Log out
          </button>
        </div>
      </Modal>

      <Modal
        id="system-error"
        open={systemError}
        title="Something went wrong"
        description="Something went wrong. Please log out and log in again to continue your progress. Sorry for the inconvenience."
        dismissible={false}
      >
        <div className="dashboard__buttons">
          <button type="button" className="btn btn--primary" onClick={logOut}>
            <Icon name="logOut" size={18} />
            Log out
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default App;
