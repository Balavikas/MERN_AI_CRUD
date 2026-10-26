import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Footer from './Footer.jsx';

const columnTitles = () => screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);

describe('Footer', () => {
  it('shows every column and navigates when nothing is hidden', async () => {
    const onNavigate = vi.fn();
    const onCategoryPick = vi.fn();
    const user = userEvent.setup();
    render(<Footer onNavigate={onNavigate} onCategoryPick={onCategoryPick} />);

    expect(columnTitles()).toEqual(['About', 'Courses', 'Resources', 'Contact']);

    await user.click(screen.getByRole('button', { name: 'Manage Crew' }));
    expect(onNavigate).toHaveBeenCalledWith('crew', undefined);
    await user.click(within(screen.getByRole('navigation', { name: 'Courses' })).getAllByRole('button')[0]);
    expect(onCategoryPick).toHaveBeenCalledTimes(1);
  });

  it('drops links into hidden pages, and columns left empty', () => {
    render(<Footer onNavigate={vi.fn()} onCategoryPick={vi.fn()} hiddenPages={new Set(['home', 'crew', 'toolkit'])} />);

    // Courses (category links open Home) and Resources (toolkit, crew, home) have nothing left to show.
    expect(columnTitles()).toEqual(['About', 'Contact']);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps links to pages that are still visible', () => {
    render(<Footer onNavigate={vi.fn()} onCategoryPick={vi.fn()} hiddenPages={new Set(['crew'])} />);

    const resources = screen.getByRole('navigation', { name: 'Resources' });
    expect(within(resources).queryByText('Manage Crew')).not.toBeInTheDocument();
    expect(within(resources).getByRole('button', { name: 'The Toolkit' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Courses' })).toBeInTheDocument();
  });
});
