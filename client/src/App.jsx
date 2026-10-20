import { useState } from 'react';
import RecordsView from './RecordsView.jsx';

const tabs = ['Home', 'Registered Candidates', 'Registered Tutors'];

const contactColumns = [
  { key: 'name', label: 'Name', className: 'candidate-name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'course', label: 'Course' },
  { key: 'education', label: 'Education' },
];

const candidateColumns = [{ key: 'id', label: 'ID' }, ...contactColumns];

function App() {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>Registration Portal</span>
        </div>
        <nav className="navigation" aria-label="Main navigation">
          {tabs.map((tab) => (
            <button
              className={`nav-tab${activeTab === tab ? ' active' : ''}`}
              key={tab}
              type="button"
              aria-current={activeTab === tab ? 'page' : undefined}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      <main className="content">
        {activeTab === 'Home' && (
          <section className="welcome-panel">
            <p className="eyebrow">CANDIDATE REGISTRATIONS</p>
            <h1>Welcome</h1>
            <p className="welcome-copy">
              View the candidates registered for your courses from the Registered Candidates tab,
              and the tutors from the Registered Tutors tab.
            </p>
          </section>
        )}
        {activeTab === 'Registered Candidates' && (
          <RecordsView
            endpoint="/api/registrations"
            eyebrow="REGISTRATION DIRECTORY"
            title="Registered Candidates"
            description="Candidate information from the PostgreSQL registrations table."
            recordLabel="registrations"
            columns={candidateColumns}
            getRowKey={(record) => record.id}
          />
        )}
        {activeTab === 'Registered Tutors' && (
          <RecordsView
            endpoint="/api/tutors"
            eyebrow="TUTOR DIRECTORY"
            title="Registered Tutors"
            description="Tutor information from the MongoDB ai_class.registrations collection."
            recordLabel="tutors"
            columns={contactColumns}
            getRowKey={(record) => record._id}
          />
        )}
      </main>
    </div>
  );
}

export default App;
