import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import RecordsView from '../RecordsView.jsx';
import { contactColumns, learnerColumns } from '../data.js';

const crewViews = [
  {
    id: 'learners',
    label: 'Learners',
    icon: 'users',
    endpoint: '/api/registrations',
    source: 'Postgres · registrations',
    title: 'Learners',
    description: 'Everyone who created a SkillStack account, newest first.',
    columns: learnerColumns,
    getRowKey: (record) => record.id,
  },
  {
    id: 'mentors',
    label: 'Mentors',
    icon: 'userCheck',
    endpoint: '/api/tutors',
    source: 'MongoDB · ai_class.registrations',
    title: 'Mentors',
    description: 'The folks who unblock you at 2 AM.',
    columns: contactColumns,
    getRowKey: (record) => record._id,
  },
];

function CrewPage({ query, onNavigate }) {
  const [activeViewId, setActiveViewId] = useState(crewViews[0].id);
  const activeView = crewViews.find((view) => view.id === activeViewId);

  return (
    <>
      <section className="page-head" aria-labelledby="crew-title">
        <div className="container page-head__inner d-flex flex-column flex-md-row align-items-start align-items-md-end justify-content-between">
          <div>
            <span className="badge-pill">
              <Icon name="users" size={16} />
              Crew HQ
            </span>
            <h1 className="page-head__title" id="crew-title">Manage Crew</h1>
            <p className="hero__lead">
              Everyone learning and mentoring with you, pulled live from the database. Use the search bar to find anyone.
            </p>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => onNavigate('home', 'join', 'join-fullName')}>
            <Icon name="sparkles" size={16} />
            Add someone to the crew
          </button>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="segmented" role="group" aria-label="Crew type">
            {crewViews.map((view) => (
              <button
                key={view.id}
                type="button"
                aria-pressed={activeViewId === view.id}
                onClick={() => setActiveViewId(view.id)}
              >
                <Icon name={view.icon} size={16} />
                {view.label}
              </button>
            ))}
          </div>

          <RecordsView
            key={activeView.id}
            endpoint={activeView.endpoint}
            source={activeView.source}
            title={activeView.title}
            description={activeView.description}
            recordLabel={activeView.id}
            columns={activeView.columns}
            getRowKey={activeView.getRowKey}
            query={query}
          />
        </div>
      </section>
    </>
  );
}

export default CrewPage;
