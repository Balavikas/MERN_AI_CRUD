import { useEffect, useRef } from 'react';

// Calls `onTimeout` once nobody has clicked or pressed a key for `timeoutMs`. Each click or key press restarts the
// countdown. Key presses count too so keyboard users, who press buttons with Enter or Space, aren't timed out.
// While `enabled` is false the timer is off; turning it back on starts a fresh countdown.
function useInactivityTimer(enabled, timeoutMs, onTimeout) {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let timer;
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onTimeoutRef.current(), timeoutMs);
    };
    const activityEvents = ['click', 'keydown'];

    restart();
    activityEvents.forEach((type) => document.addEventListener(type, restart, true));
    return () => {
      clearTimeout(timer);
      activityEvents.forEach((type) => document.removeEventListener(type, restart, true));
    };
  }, [enabled, timeoutMs]);
}

export default useInactivityTimer;
