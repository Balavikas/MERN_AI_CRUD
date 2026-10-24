import { useState } from 'react';
import Icon from './Icon.jsx';

function ProgressCard({ course, progress, nextUp, onResume }) {
  const [reminderOn, setReminderOn] = useState(false);

  return (
    <article className="progress-card" id="continue" aria-labelledby="continue-title">
      <div className="progress-card__top">
        <div>
          <p className="kicker">Continue learning</p>
          <h2 className="progress-card__title" id="continue-title">{course.title}</h2>
          <p className="progress-card__subtitle">{progress.lesson}</p>
        </div>
        <span className="icon-tile">
          <Icon name={course.icon} size={24} />
        </span>
      </div>

      <div className="progress">
        <div className="progress__meta">
          <span>{progress.completedLessons} of {progress.totalLessons} lessons crushed</span>
          <strong>{progress.progress}%</strong>
        </div>
        <div
          className="progress__track"
          role="progressbar"
          aria-label={`${course.title} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.progress}
        >
          <span className="progress__fill" style={{ width: `${progress.progress}%` }} />
        </div>
      </div>

      <button type="button" className="btn btn--primary btn--block" id="resume-button" onClick={onResume}>
        <Icon name="play" size={16} />
        Resume
      </button>

      <div className="progress-card__footer">
        <span className="icon-tile icon-tile--sm icon-tile--muted">
          <Icon name="calendar" size={18} />
        </span>
        <div className="progress-card__next">
          <p className="kicker">Next up</p>
          <p className="progress-card__next-title">{nextUp.title}</p>
          <p className="progress-card__next-when">{nextUp.when}</p>
        </div>
        <button
          type="button"
          className="icon-btn icon-btn--toggle"
          aria-pressed={reminderOn}
          aria-label={reminderOn ? 'Ping me is on, turn off reminder' : 'Ping me before this session'}
          onClick={() => setReminderOn((on) => !on)}
        >
          <Icon name="bell" size={18} />
        </button>
      </div>
      <p className="sr-only" role="status">
        {reminderOn ? `We'll ping you before ${nextUp.title}.` : ''}
      </p>
    </article>
  );
}

export default ProgressCard;
