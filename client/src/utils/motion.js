import { flushSync } from 'react-dom';

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function scrollBehavior() {
  return prefersReducedMotion() ? 'auto' : 'smooth';
}

// Runs a React state update inside a CSS View Transition when the browser supports it.
export function withViewTransition(update) {
  if (!document.startViewTransition || prefersReducedMotion()) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}
