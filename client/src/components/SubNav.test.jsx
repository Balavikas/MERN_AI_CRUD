import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SubNav from './SubNav.jsx';

const pages = [{ id: 'dashboard', label: 'My Learning' }, { id: 'home', label: 'Home' }];

function renderSubNav(props = {}) {
  const onNavigate = vi.fn();
  render(
    <SubNav
      pages={pages}
      activePage="dashboard"
      onNavigate={onNavigate}
      query=""
      onQueryChange={vi.fn()}
      filters={{ category: '', level: '' }}
      onFiltersChange={vi.fn()}
      {...props}
    />,
  );
  return { onNavigate, user: userEvent.setup() };
}

describe('SubNav', () => {
  it('renders a tab per page, marks the current one, and navigates on click', async () => {
    const { onNavigate, user } = renderSubNav();

    expect(screen.getByRole('button', { name: 'My Learning' })).toHaveAttribute('aria-current', 'page');
    await user.click(screen.getByRole('button', { name: 'Home' }));
    expect(onNavigate).toHaveBeenCalledWith('home');
  });

  it('shows the course search and filters by default', () => {
    renderSubNav();
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filters/ })).toBeInTheDocument();
  });

  it('hides the search and filters when showTools is off', () => {
    renderSubNav({ showTools: false });
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Filters/ })).not.toBeInTheDocument();
  });
});
