import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import TaughtCourses from './TaughtCourses.jsx';
import { mockFetch } from '../test/mockFetch.js';

const course = (id, title, faculty_names, extra = {}) => ({
  id, title, faculty_names, category: 'Gen AI', level: 'Beginner', duration: '3h 20m', badge: 'New', icon: 'brain',
  enrollment_count: 0, ...extra,
});

// Each card also holds a nested details list, so keep only the outer list's own items.
const courseItems = () => {
  const list = screen.getByRole('list', { name: 'Courses open now' });
  return within(list).getAllByRole('listitem').filter((item) => item.parentElement === list);
};

describe('TaughtCourses', () => {
  it('shows real courses from the API with their assigned faculty as instructors', async () => {
    const fetchMock = mockFetch({
      '/api/courses/taught': { body: [
        course('genai-foundations', 'Generative AI Foundations', ['Ravi Shastri']),
        course('rag', 'RAG: Chat with Your Own Data', ['Mayanti Langer', 'Rahul Dravid'], { badge: 'Popular', level: 'Intermediate' }),
        course('mcp', 'Model Context Protocol: Ship MCP Servers', ['Ada', 'Ben', 'Cy'], { badge: null }),
      ] },
    });
    render(<TaughtCourses />);

    expect(await screen.findByText('Generative AI Foundations')).toBeInTheDocument();
    expect(screen.getByText('with Ravi Shastri')).toBeInTheDocument();
    expect(screen.getByText('with Mayanti Langer and Rahul Dravid')).toBeInTheDocument();
    expect(screen.getByText('with Ada, Ben and Cy')).toBeInTheDocument();
    expect(screen.getByText('Popular')).toBeInTheDocument();
    expect(courseItems()).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledWith('/api/courses/taught', expect.anything());
  });

  it('keeps the API order and shows at most six courses', async () => {
    const many = Array.from({ length: 8 }, (_, index) => course(`c${index}`, `Course ${index}`, ['Faculty']));
    mockFetch({ '/api/courses/taught': { body: many } });
    render(<TaughtCourses />);

    await screen.findByText('Course 0');
    expect(courseItems().map((item) => item.querySelector('.trend-card__title').textContent)).toEqual([
      'Course 0', 'Course 1', 'Course 2', 'Course 3', 'Course 4', 'Course 5',
    ]);
  });

  it('explains the empty panel when no course has faculty yet', async () => {
    mockFetch({ '/api/courses/taught': { body: [] } });
    render(<TaughtCourses />);
    expect(await screen.findByText('Courses appear here once a director assigns faculty to them.')).toBeInTheDocument();
  });

  it('shows the error with a retry that loads the courses', async () => {
    let calls = 0;
    mockFetch({
      '/api/courses/taught': () => (calls++ === 0
        ? { status: 500, body: { error: 'Database is down' } }
        : { body: [course('genai-foundations', 'Generative AI Foundations', ['Ravi Shastri'])] }),
    });
    const user = userEvent.setup();
    render(<TaughtCourses />);

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load courses: Something went wrong.");
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Generative AI Foundations')).toBeInTheDocument();
  });
});
