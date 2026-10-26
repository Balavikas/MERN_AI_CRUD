import { useEffect, useState } from 'react';

// "2:41" until `deadline` (a Date.now() timestamp), updated every second. Display only: App.jsx owns the actual
// logout timer. Not a live region, so screen readers aren't interrupted every second.
function LogoutCountdown({ deadline }) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const seconds = Math.max(0, Math.ceil((deadline - now) / 1000));
  const clock = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <p className="field__hint">
      For your security, you'll be logged out automatically in <strong>{clock}</strong>.
    </p>
  );
}

export default LogoutCountdown;
