import BentoGrid from '../components/BentoGrid.jsx';
import CourseCarousel from '../components/CourseCarousel.jsx';
import Hero from '../components/Hero.jsx';
import useRecords from '../hooks/useRecords.js';
import { continueLearning } from '../data.js';

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
  const catalog = useRecords('/api/courses', 'courses');
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCourses = catalog.records.filter((course) => matchesCourse(course, filters, normalizedQuery));
  const hasFilters = Boolean(normalizedQuery || filters.category || filters.level);

  return (
    <>
      <Hero
        learnerName={learnerName}
        continueCourse={catalog.records.find((course) => course.id === continueLearning.courseId)}
        activeCategory={filters.category}
        onCategoryToggle={onCategoryToggle}
        onDiscover={() => onNavigate('home', 'courses')}
        onJumpBackIn={() => onNavigate('home', 'continue', 'resume-button')}
        onResume={onResume}
      />
      <CourseCarousel
        catalog={catalog}
        courses={visibleCourses}
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
