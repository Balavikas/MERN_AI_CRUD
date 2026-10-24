import { useState } from 'react';
import Icon from './Icon.jsx';
import { fetchRecords } from '../api.js';
import { saveFile, toCsv } from '../utils/download.js';

function ResourceList({ items }) {
  const [busyId, setBusyId] = useState('');
  const [errors, setErrors] = useState({});

  async function handleDownload(resource) {
    setBusyId(resource.id);
    setErrors((current) => ({ ...current, [resource.id]: '' }));

    try {
      if (resource.kind === 'roster') {
        const records = await fetchRecords(resource.endpoint, resource.recordLabel);
        saveFile(resource.filename, toCsv(records, resource.columns), 'text/csv;charset=utf-8');
      } else {
        saveFile(resource.filename, resource.content, 'text/markdown;charset=utf-8');
      }
    } catch (error) {
      setErrors((current) => ({ ...current, [resource.id]: error.message || 'Download failed.' }));
    } finally {
      setBusyId('');
    }
  }

  if (items.length === 0) {
    return <p className="empty-state">Nothing in the toolkit matches that. Try another search.</p>;
  }

  return (
    <ul className="resource-list">
      {items.map((resource) => (
        <li key={resource.id} className="resource">
          <span className="icon-tile icon-tile--sm">
            <Icon name={resource.icon} size={18} />
          </span>
          <div className="resource__text">
            <p className="resource__title">{resource.title}</p>
            <p className="resource__meta">{resource.meta}</p>
            {errors[resource.id] && (
              <p className="resource__error" role="alert">{errors[resource.id]}</p>
            )}
          </div>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => handleDownload(resource)}
            disabled={busyId === resource.id}
            aria-label={`Download ${resource.title}`}
          >
            <Icon name="download" size={16} />
            {busyId === resource.id ? 'Grabbing…' : 'Get it'}
          </button>
        </li>
      ))}
    </ul>
  );
}

export default ResourceList;
