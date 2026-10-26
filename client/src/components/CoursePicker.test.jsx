import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CoursePicker from './CoursePicker.jsx';
import { mockFetch } from '../test/mockFetch.js';

const mcp = {
  id: 'mcp-servers', title: 'Model Context Protocol: Ship MCP Servers', description: 'Expose your APIs to agents.',
  instructor: 'Mei Lin', category: 'Agentic AI', level: 'Intermediate', duration: '3h 05m', badge: 'New', icon: 'plug',
};
const rag = {
  id: 'rag-chat-with-your-data', title: 'RAG: Chat with Your Own Data', description: 'Embeddings and retrieval.',
  instructor: 'Sofia Marchetti', category: 'Gen AI', level: 'Intermediate', duration: '4h 10m', badge: 'Popular', icon: 'fileSearch',
};

describe('CoursePicker', () => {
  it('lists the courses the student is not taking yet, fetched with their token', async () => {
    const fetchMock = mockFetch({ '/api/student/available-courses': { body: [mcp, rag] } });
    render(<CoursePicker token="student-token" onEnrolled={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: mcp.title })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: rag.title })).toBeInTheDocument();
    expect(screen.getByText('with Mei Lin')).toBeInTheDocument();
    expect(screen.getByText('Expose your APIs to agents.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/student/available-courses',
      expect.objectContaining({ headers: { Authorization: 'Bearer student-token' } }),
    );
  });

  it('enrolls in a course, drops it from the list and tells the dashboard', async () => {
    let enrolled = false;
    const fetchMock = mockFetch({
      '/api/student/available-courses': () => ({ body: enrolled ? [rag] : [mcp, rag] }),
      'POST /api/student/courses': () => {
        enrolled = true;
        return { status: 201, body: { course_id: mcp.id } };
      },
    });
    const onEnrolled = vi.fn();
    const user = userEvent.setup();
    render(<CoursePicker token="student-token" onEnrolled={onEnrolled} />);

    await user.click(await screen.findByRole('button', { name: `Add ${mcp.title}` }));

    expect(await screen.findByText(`Added ${mcp.title}. It's in “Courses I'm taking” now.`)).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('heading', { name: mcp.title })).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: rag.title })).toBeInTheDocument();
    expect(onEnrolled).toHaveBeenCalledTimes(1);

    const [, enrollRequest] = fetchMock.mock.calls.find(([url, options]) => url === '/api/student/courses' && options.method === 'POST');
    expect(JSON.parse(enrollRequest.body)).toEqual({ courseId: mcp.id });
    expect(enrollRequest.headers.Authorization).toBe('Bearer student-token');
  });

  it('shows the server error and does not report an enrollment when adding fails', async () => {
    mockFetch({
      '/api/student/available-courses': { body: [mcp] },
      'POST /api/student/courses': { status: 409, body: { error: "You're already taking that course." } },
    });
    const onEnrolled = vi.fn();
    const user = userEvent.setup();
    render(<CoursePicker token="student-token" onEnrolled={onEnrolled} />);

    await user.click(await screen.findByRole('button', { name: `Add ${mcp.title}` }));

    expect(await screen.findByRole('alert')).toHaveTextContent("You're already taking that course.");
    expect(onEnrolled).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: mcp.title })).toBeInTheDocument();
  });

  it('says so when the student already takes every course', async () => {
    mockFetch({ '/api/student/available-courses': { body: [] } });
    render(<CoursePicker token="student-token" onEnrolled={vi.fn()} />);
    expect(await screen.findByText("You're taking every course we've got. Legend.")).toBeInTheDocument();
  });
});
