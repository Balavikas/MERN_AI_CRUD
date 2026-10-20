import { useEffect, useState } from 'react';

function RecordsView({ endpoint, eyebrow, title, description, recordLabel, columns, getRowKey }) {
  const [records, setRecords] = useState([]);
  const [requestState, setRequestState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const headingId = `${recordLabel}-heading`;

  useEffect(() => {
    const controller = new AbortController();

    async function loadRecords() {
      setRequestState('loading');
      setErrorMessage('');

      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `Unable to load ${recordLabel}.`);
        }
        if (!Array.isArray(result)) {
          throw new Error(`The ${recordLabel} API returned an invalid response.`);
        }

        setRecords(result);
        setRequestState('success');
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        setErrorMessage(error.message || `Unable to load ${recordLabel}.`);
        setRequestState('error');
      }
    }

    loadRecords();
    return () => controller.abort();
  }, [endpoint, recordLabel]);

  return (
    <section aria-labelledby={headingId}>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 id={headingId}>{title}</h1>
          <p className="section-copy">{description}</p>
        </div>
        {requestState === 'success' && records.length > 0 && (
          <span className="record-count">{records.length} total</span>
        )}
      </div>

      <div className="data-panel">
        {requestState === 'loading' && (
          <p className="status-message" role="status">Loading {recordLabel}…</p>
        )}
        {requestState === 'error' && (
          <p className="status-message error-message" role="alert">
            Error loading {recordLabel}: {errorMessage}
          </p>
        )}
        {requestState === 'success' && records.length === 0 && (
          <p className="status-message" role="status">No {recordLabel} found</p>
        )}
        {requestState === 'success' && records.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {columns.map((column) => (
                    <th scope="col" key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={getRowKey(record)}>
                    {columns.map((column) => (
                      <td className={column.className} key={column.key}>{record[column.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

export default RecordsView;
