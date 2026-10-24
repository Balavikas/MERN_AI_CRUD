import { useCallback, useEffect, useState } from 'react';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import SubNav from './components/SubNav.jsx';
import useTheme from './hooks/useTheme.js';
import CrewPage from './pages/CrewPage.jsx';
import HomePage from './pages/HomePage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import ToolkitPage from './pages/ToolkitPage.jsx';
import { continueLearning, learner } from './data.js';
import { scrollBehavior, withViewTransition } from './utils/motion.js';

const pages = [
  { id: 'home', label: 'Home' },
  { id: 'crew', label: 'Manage Crew' },
  { id: 'toolkit', label: 'The Toolkit' },
];

const noFilters = { category: '', level: '' };

function App() {
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState(null);
  const [activePage, setActivePage] = useState('home');
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(noFilters);
  const [startedCourseIds, setStartedCourseIds] = useState([]);
  const [scrollRequest, setScrollRequest] = useState(null);

  const navigate = useCallback((page, targetId, focusId) => {
    if (page !== activePage) {
      withViewTransition(() => {
        setActivePage(page);
        setQuery('');
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

  function logIn(details) {
    withViewTransition(() => setSession({ firstName: details.name.split(' ')[0] || learner.firstName }));
    window.scrollTo({ top: 0 });
  }

  function logOut() {
    withViewTransition(() => {
      setSession(null);
      setActivePage('home');
      setQuery('');
      setFilters(noFilters);
      setStartedCourseIds([]);
    });
    window.scrollTo({ top: 0 });
  }

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

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <div className="backdrop" aria-hidden="true" />
      <div className="noise" aria-hidden="true" />

      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onHome={() => navigate('home')}
        onJoin={() => navigate('home', 'join', 'join-fullName')}
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
      />

      <main id="main" className="main" tabIndex={-1}>
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

      <Footer onNavigate={navigate} onCategoryPick={pickCategory} />
    </div>
  );
}

export default App;
