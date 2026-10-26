import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AuthPage from './AuthPage.jsx';
import { mockFetch } from '../test/mockFetch.js';

describe('AuthPage', () => {
  it('shows real courses with assigned faculty instead of the old mocked trending list', async () => {
    mockFetch({
      '/api/courses/taught': { body: [{
        id: 'genai-foundations', title: 'Generative AI Foundations', faculty_names: ['Ravi Shastri'],
        category: 'Gen AI', level: 'Beginner', duration: '3h 20m', badge: 'New', icon: 'brain', enrollment_count: 6,
      }] },
    });
    render(<AuthPage theme="light" onToggleTheme={vi.fn()} onAuthenticated={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Courses open now' })).toBeInTheDocument();
    expect(await screen.findByText('Generative AI Foundations')).toBeInTheDocument();
    expect(screen.getByText('with Ravi Shastri')).toBeInTheDocument();
    // The old hard-coded courses are gone.
    expect(screen.queryByText('Trending AI courses')).not.toBeInTheDocument();
    expect(screen.queryByText('Generative AI for Everyone')).not.toBeInTheDocument();
  });

  it('still offers the login role dropdown', () => {
    mockFetch({ '/api/courses/taught': { body: [] } });
    render(<AuthPage theme="light" onToggleTheme={vi.fn()} onAuthenticated={vi.fn()} />);

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Student', 'Faculty', 'Director']);
  });
});
