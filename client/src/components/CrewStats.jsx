import Icon from './Icon.jsx';

function statValue(source, count) {
  if (source.status === 'success') {
    return count;
  }
  return source.status === 'error' ? '—' : '…';
}

function CrewStats({ learners, mentors }) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = learners.records.filter((record) => new Date(record.created_at).getTime() >= weekAgo).length;

  const stats = [
    {
      label: 'Learners',
      icon: 'users',
      source: learners,
      value: statValue(learners, learners.records.length),
      hint: learners.status === 'error' ? "Couldn't reach Postgres" : 'Grinding a track right now',
    },
    {
      label: 'Mentors',
      icon: 'userCheck',
      source: mentors,
      value: statValue(mentors, mentors.records.length),
      hint: mentors.status === 'error' ? "Couldn't reach MongoDB" : 'Ready to unblock you',
    },
    {
      label: 'New',
      icon: 'sparkles',
      source: learners,
      value: statValue(learners, newThisWeek),
      hint: 'Joined in the last 7 days',
    },
  ];

  return (
    <ul className="stat-grid row row-cols-1 row-cols-sm-3 g-3">
      {stats.map((stat) => (
        <li key={stat.label} className="col" aria-busy={stat.source.status === 'loading'}>
          <div className="stat h-100">
            <span className="stat__label">
              <Icon name={stat.icon} size={16} />
              {stat.label}
            </span>
            <span className="stat__value">{stat.value}</span>
            <span className="stat__hint">{stat.hint}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default CrewStats;
