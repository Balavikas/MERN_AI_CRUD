import BentoGrid from '../components/BentoGrid.jsx';
import CourseCarousel from '../components/CourseCarousel.jsx';
import Hero from '../components/Hero.jsx';
import { courses } from '../data.js';

function matchesCourse(course, filters, query) {
  if (filters.category && course.category !== filters.category) {
    return false;
  }
  if (filters.level && course.level !== filters.level) {
    return false;
  }
  return [course.title, course.instructor, course.category, course.level]
    .some((value) => value.toLowerCase().includes(query));
}

function HomePage({ learnerName, query, filters, startedCourseIds, onCategoryToggle, onClearFilters, onGetStarted, onResume, onNavigate }) {
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCourses = courses.filter((course) => matchesCourse(course, filters, normalizedQuery));
  const hasFilters = Boolean(normalizedQuery || filters.category || filters.level);

  return (
    <>
      <Hero
        learnerName={learnerName}
        activeCategory={filters.category}
        onCategoryToggle={onCategoryToggle}
        onDiscover={() => onNavigate('home', 'courses')}
        onJumpBackIn={() => onNavigate('home', 'continue', 'resume-button')}
        onResume={onResume}
      />
      <CourseCarousel
        courses={visibleCourses}
        totalCount={courses.length}
        hasFilters={hasFilters}
        onClearFilters={onClearFilters}
        startedCourseIds={startedCourseIds}
        onGetStarted={onGetStarted}
      />
      <BentoGrid onNavigate={onNavigate} />
    </>
  );
}

export default HomePage;
