import Icon from './Icon.jsx';
import ProgressCard from './ProgressCard.jsx';
import { categories, continueLearning, courses, nextUp } from '../data.js';

const continueCourse = courses.find((course) => course.id === continueLearning.courseId);

function Hero({ learnerName, activeCategory, onCategoryToggle, onDiscover, onJumpBackIn, onResume }) {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__main">
          <span className="badge-pill">
            <Icon name="sparkles" size={16} />
            Curated just for you
          </span>
          <h1 className="hero__title" id="hero-title">
            Welcome back, <span className="accent">{learnerName}</span>
          </h1>
          <p className="hero__lead">
            Pick up where you left off, ship something real this week, and skip the fluff.
            No BS, just builds.
          </p>
          <div className="hero__ctas">
            <button type="button" className="btn btn--primary btn--lg" onClick={onDiscover}>
              Discover what's next
              <Icon name="arrowRight" size={18} />
            </button>
            <button type="button" className="btn btn--outline btn--lg" onClick={onJumpBackIn}>
              Jump back in
            </button>
          </div>
          <div className="pill-row" role="group" aria-label="Filter courses by vibe">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className="pill"
                aria-pressed={activeCategory === category}
                onClick={() => onCategoryToggle(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="hero__aside">
          <ProgressCard course={continueCourse} progress={continueLearning} nextUp={nextUp} onResume={onResume} />
        </div>
      </div>
    </section>
  );
}

export default Hero;
