import useRecords from './hooks/useRecords.js';

function cellValue(record, column) {
  const value = record[column.key];
  return column.format ? column.format(value) : value;
}

function matchesQuery(record, columns, query) {
  return columns.some((column) => String(cellValue(record, column) ?? '').toLowerCase().includes(query));
}

function RecordsView({ endpoint, source, title, description, recordLabel, columns, getRowKey, query, token }) {
  const { records, status, error, reload } = useRecords(endpoint, recordLabel, token);
  const headingId = `${recordLabel}-heading`;
  const normalizedQuery = query.trim().toLowerCase();
  const visibleRecords = normalizedQuery
    ? records.filter((record) => matchesQuery(record, columns, normalizedQuery))
    : records;

  return (
    <section className="records" aria-labelledby={headingId}>
      <div className="records__head d-flex flex-column flex-md-row align-items-start align-items-md-end justify-content-between">
        <div>
          <p className="kicker">{source}</p>
          <h2 id={headingId}>{title}</h2>
          <p className="section__sub">{description}</p>
        </div>
        {status === 'success' && records.length > 0 && (
          <span className="record-count">
            {normalizedQuery ? `${visibleRecords.length} of ${records.length}` : `${records.length} total`}
          </span>
        )}
      </div>

      <div className="data-panel">
        {status === 'loading' && (
          <p className="status-message" role="status">Loading {recordLabel}…</p>
        )}
        {status === 'error' && (
          <div className="status-message status-message--error" role="alert">
            <p>Couldn't load {recordLabel}: {error}</p>
            <button type="button" className="btn btn--outline btn--sm" onClick={reload}>
              Try again
            </button>
          </div>
        )}
        {status === 'success' && records.length === 0 && (
          <p className="status-message" role="status">No {recordLabel} yet. Be the first to join.</p>
        )}
        {status === 'success' && records.length > 0 && visibleRecords.length === 0 && (
          <p className="status-message" role="status">Nobody matches “{query.trim()}”.</p>
        )}
        {status === 'success' && visibleRecords.length > 0 && (
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
                {visibleRecords.map((record) => (
                  <tr key={getRowKey(record)}>
                    {columns.map((column) => (
                      <td className={column.className} key={column.key}>{cellValue(record, column)}</td>
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
