import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Header from './Header.jsx';

function renderHeader(theme = 'light') {
  const props = { onToggleTheme: vi.fn(), onHome: vi.fn(), onLogOut: vi.fn() };
  render(<Header theme={theme} {...props} />);
  return { ...props, user: userEvent.setup() };
}

describe('Header', () => {
  it('logs out from a labelled Log out button', async () => {
    const { onLogOut, user } = renderHeader();
    const logOut = screen.getByRole('button', { name: 'Log out' });
    expect(logOut).toHaveTextContent('Log out');

    await user.click(logOut);
    expect(onLogOut).toHaveBeenCalledTimes(1);
  });

  it('has no Join Now button', () => {
    renderHeader();
    expect(screen.queryByRole('button', { name: /join now/i })).not.toBeInTheDocument();
  });

  it('toggles the theme and goes home from the logo', async () => {
    const { onToggleTheme, onHome, user } = renderHeader('dark');

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    await user.click(screen.getByRole('button', { name: 'SkillStack home' }));

    expect(onToggleTheme).toHaveBeenCalledTimes(1);
    expect(onHome).toHaveBeenCalledTimes(1);
  });
});
