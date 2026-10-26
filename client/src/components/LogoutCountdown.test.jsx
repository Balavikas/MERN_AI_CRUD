import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LogoutCountdown from './LogoutCountdown.jsx';

describe('LogoutCountdown', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const clock = () => screen.getByText(/:\d\d$/).textContent;

  it('counts down in minutes and seconds every second', () => {
    render(<LogoutCountdown deadline={Date.now() + 3 * 60 * 1000} />);
    expect(clock()).toBe('3:00');

    act(() => { vi.advanceTimersByTime(1000); });
    expect(clock()).toBe('2:59');

    act(() => { vi.advanceTimersByTime(2 * 60 * 1000 + 50 * 1000); });
    expect(clock()).toBe('0:09');
  });

  it('stops at 0:00 instead of going negative', () => {
    render(<LogoutCountdown deadline={Date.now() + 2000} />);
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(clock()).toBe('0:00');
  });
});
