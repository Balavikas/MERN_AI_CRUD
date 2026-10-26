import { useState } from 'react';
import Icon from './Icon.jsx';
import RecordsView from '../RecordsView.jsx';
import { studentColumns } from '../data.js';

// Every registered student with how many courses they're taking. Faculty and directors only.
function StudentRoster({ id, token }) {
  const [query, setQuery] = useState('');

  return (
    <>
      <div className="search search--block" role="search">
        <label className="sr-only" htmlFor={`${id}-search`}>Search students</label>
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
        endpoint="/api/students"
        source="Postgres · registrations"
        title="Registered students"
        description="Everyone with a student account, newest first."
        recordLabel="students"
        columns={studentColumns}
        getRowKey={(record) => record.id}
        query={query}
        token={token}
      />
    </>
  );
}

export default StudentRoster;
