import Icon from './Icon.jsx';

// The picture strip on a course card: the course's icon on a background tinted by its category.
function CourseArt({ course, compact = false }) {
  return (
    <div
      className={`course-card__art${compact ? ' course-card__art--compact' : ''}`}
      data-category={course.category}
    >
      <span className="course-card__icon">
        <Icon name={course.icon} size={compact ? 24 : 28} />
      </span>
      {course.badge && <span className={`tag tag--${course.badge.toLowerCase()}`}>{course.badge}</span>}
    </div>
  );
}

export default CourseArt;
