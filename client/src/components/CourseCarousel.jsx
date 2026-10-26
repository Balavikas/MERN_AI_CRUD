import { useRef } from 'react';
import CourseArt from './CourseArt.jsx';
import Icon from './Icon.jsx';
import { scrollBehavior } from '../utils/motion.js';

// `catalog` is the useRecords result for GET /api/courses; `courses` is the filtered subset to show.
function CourseCarousel({ catalog, courses, hasFilters, startedCourseIds, onClearFilters, onGetStarted }) {
  const trackRef = useRef(null);

  function scrollByCard(direction) {
    const track = trackRef.current;
    const card = track?.querySelector('.course-card');
    if (!track) {
      return;
    }
    const step = card ? card.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * step, behavior: scrollBehavior() });
  }

  return (
    <section className="section" id="courses" aria-labelledby="courses-title">
      <div className="container">
        <div className="section__head d-flex flex-column flex-md-row align-items-start align-items-md-end justify-content-between">
          <div>
            <h2 id="courses-title">The hottest right now</h2>
            <p className="section__sub">
              {hasFilters
                ? `Showing ${courses.length} of ${catalog.records.length} courses that match your vibe.`
                : 'What the crew is shipping with this week. Short, sharp, zero filler.'}
            </p>
          </div>
          <div className="section__actions">
            {hasFilters && (
              <button type="button" className="btn btn--outline btn--sm" onClick={onClearFilters}>
                <Icon name="x" size={16} />
                Clear filters
              </button>
            )}
            <button type="button" className="icon-btn" aria-label="Scroll courses left" onClick={() => scrollByCard(-1)}>
              <Icon name="chevronLeft" />
            </button>
            <button type="button" className="icon-btn" aria-label="Scroll courses right" onClick={() => scrollByCard(1)}>
              <Icon name="chevronRight" />
            </button>
          </div>
        </div>

        {catalog.status === 'loading' && <p className="status-message" role="status">Loading courses…</p>}
        {catalog.status === 'error' && (
          <div className="status-message status-message--error" role="alert">
            <p>Couldn't load courses: {catalog.error}</p>
            <button type="button" className="btn btn--outline btn--sm" onClick={catalog.reload}>Try again</button>
          </div>
        )}
        {catalog.status === 'success' && (courses.length === 0 ? (
          <div className="empty-state">
            <p>Nothing matches that combo. Loosen the filters and try again.</p>
            <button type="button" className="btn btn--primary btn--sm" onClick={onClearFilters}>
              Show me everything
            </button>
          </div>
        ) : (
          <ul className="carousel" ref={trackRef} aria-label="Featured courses">
            {courses.map((course) => {
              const started = startedCourseIds.includes(course.id);
              return (
              <li key={course.id} className="course-card" id={`course-${course.id}`}>
                <CourseArt course={course} />
                <div className="course-card__body">
                  <p className="course-card__category">{course.category}</p>
                  <h3 className="course-card__title">{course.title}</h3>
                  <p className="course-card__instructor">with {course.instructor}</p>
                  <div className="course-card__footer">
                    <ul className="course-meta" aria-label="Course details">
                      <li>
                        <Icon name="clock" size={16} />
                        {course.duration}
                      </li>
                      <li>
                        <Icon name="chart" size={16} />
                        {course.level}
                      </li>
                    </ul>
                    <button
                      type="button"
                      className={`btn btn--sm ${started ? 'btn--outline' : 'btn--primary'}`}
                      id={`course-${course.id}-cta`}
                      onClick={() => onGetStarted(course)}
                      aria-pressed={started}
                      aria-label={`${started ? 'Started' : 'Get Started with'} ${course.title}`}
                    >
                      {started && <Icon name="check" size={16} />}
                      {started ? 'Started' : 'Get Started'}
                    </button>
                  </div>
                </div>
              </li>
              );
            })}
          </ul>
        ))}
      </div>
    </section>
  );
}

export default CourseCarousel;
