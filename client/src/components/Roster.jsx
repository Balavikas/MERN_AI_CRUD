import { useState } from 'react';
import Icon from './Icon.jsx';
import RecordsView from '../RecordsView.jsx';

// A searchable table of accounts: `roster` is one of `rosters` in data.js (students or faculty).
function Roster({ id, token, roster }) {
  const [query, setQuery] = useState('');

  return (
    <>
      <div className="search search--block" role="search">
        <label className="sr-only" htmlFor={`${id}-search`}>Search {roster.recordLabel}</label>
        <Icon name="search" size={18} className="search__icon" />
        <input
          id={`${id}-search`}
          type="search"
          placeholder="Search by name, email or phone"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <RecordsView
        endpoint={roster.endpoint}
        source="Postgres · registrations"
        title={roster.title}
        description={roster.description}
        recordLabel={roster.recordLabel}
        columns={roster.columns}
        getRowKey={(record) => record.id}
        query={query}
        token={token}
      />
    </>
  );
}

export default Roster;
