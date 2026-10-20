import { useEffect, useState } from 'react';

const tabs = ['Home', 'Registered Candidates'];

function App() {
  const [activeTab, setActiveTab] = useState('Home');
  const [registrations, setRegistrations] = useState([]);
  const [requestState, setRequestState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (activeTab !== 'Registered Candidates') {
      return undefined;
    }

    const controller = new AbortController();

    async function loadRegistrations() {
      setRequestState('loading');
      setErrorMessage('');

      try {
        const response = await fetch('/api/registrations', {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Unable to load registrations.');
        }
        if (!Array.isArray(result)) {
          throw new Error('The registrations API returned an invalid response.');
        }

        setRegistrations(result);
        setRequestState('success');
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setErrorMessage(error.message || 'Unable to load registrations.');
        setRequestState('error');
      }
    }

    loadRegistrations();
    return () => controller.abort();
  }, [activeTab]);

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
        {activeTab === 'Home' ? (
          <section className="welcome-panel">
            <p className="eyebrow">CANDIDATE REGISTRATIONS</p>
            <h1>Welcome</h1>
            <p className="welcome-copy">
              View the candidates registered for your courses from the Registered Candidates tab.
            </p>
          </section>
        ) : (
          <section aria-labelledby="registrations-heading">
            <div className="section-heading">
              <div>
                <p className="eyebrow">REGISTRATION DIRECTORY</p>
                <h1 id="registrations-heading">Registered Candidates</h1>
                <p className="section-copy">Candidate information from the registrations table.</p>
              </div>
            </div>

            <div className="data-panel">
              {requestState === 'loading' && (
                <p className="status-message" role="status">Loading registrations…</p>
              )}
              {requestState === 'error' && (
                <p className="status-message error-message" role="alert">
                  Error loading registrations: {errorMessage}
                </p>
              )}
              {requestState === 'success' && registrations.length === 0 && (
                <p className="status-message" role="status">No registrations found</p>
              )}
              {requestState === 'success' && registrations.length > 0 && (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">ID</th>
                        <th scope="col">Name</th>
                        <th scope="col">Email</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Course</th>
                        <th scope="col">Education</th>
                      </tr>
                    </thead>
                    <tbody>
                      {registrations.map((registration) => (
                        <tr key={registration.id}>
                          <td>{registration.id}</td>
                          <td className="candidate-name">{registration.name}</td>
                          <td>{registration.email}</td>
                          <td>{registration.phone}</td>
                          <td>{registration.course}</td>
                          <td>{registration.education}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
