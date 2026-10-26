import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import AssignmentForm from './AssignmentForm.jsx';
import { mockFetch } from '../test/mockFetch.js';

// The courses a director assigned to this faculty member (GET /api/faculty-assignments/mine).
const courses = [
  { id: 'agents-tool-use', title: 'Build AI Agents with Tool Use', category: 'Agentic AI' },
  { id: 'react-patterns', title: 'React Patterns, No BS', category: 'Web Development' },
];

function setup(postReply, myCourses = courses) {
  const fetchMock = mockFetch({
    '/api/faculty-assignments/mine': { body: myCourses },
    'POST /api/assignments': postReply,
  });
  const onCreated = vi.fn();
  render(<AssignmentForm token="faculty-token" onCreated={onCreated} />);
  return { fetchMock, onCreated, user: userEvent.setup() };
}

const postCalls = (fetchMock) => fetchMock.mock.calls.filter(([, options]) => options?.method === 'POST');

describe('AssignmentForm', () => {
  it('offers only the courses assigned to this faculty member, fetched with their token', async () => {
    const { fetchMock } = setup();
    expect(await screen.findByRole('option', { name: 'Build AI Agents with Tool Use · Agentic AI' })).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(courses.length + 1);
    expect(screen.getByLabelText('Course')).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/faculty-assignments/mine',
      expect.objectContaining({ headers: { Authorization: 'Bearer faculty-token' } }),
    );
  });

  it('explains and blocks posting when no course is assigned yet', async () => {
    setup(undefined, []);
    expect(await screen.findByText("You aren't assigned to any courses yet. Ask a director to assign you to one.")).toBeInTheDocument();
    expect(screen.getByLabelText('Course')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Post assignment' })).toBeDisabled();
  });

  it('shows the refusal on the course field when the server says the course is not theirs', async () => {
    const refusal = "You aren't assigned to this course. Ask a director to assign you first.";
    const { onCreated, user } = setup({ status: 403, body: { error: refusal, fieldErrors: { courseId: refusal } } });
    await screen.findByRole('option', { name: /Build AI Agents/ });

    await user.selectOptions(screen.getByLabelText('Course'), 'agents-tool-use');
    await user.type(screen.getByLabelText('Title'), 'Build a weather agent');
    await user.click(screen.getByRole('button', { name: 'Post assignment' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(refusal);
    expect(screen.getByLabelText('Course')).toHaveAttribute('aria-invalid', 'true');
    expect(onCreated).not.toHaveBeenCalled();
  });

  it('asks for a course and a title before posting anything', async () => {
    const { fetchMock, user } = setup();
    await screen.findByRole('option', { name: /Build AI Agents/ });

    await user.click(screen.getByRole('button', { name: 'Post assignment' }));

    expect(screen.getByText('Pick a course.')).toBeInTheDocument();
    expect(screen.getByText('Give the assignment a title.')).toBeInTheDocument();
    expect(screen.getByLabelText('Course')).toHaveFocus();
    expect(postCalls(fetchMock)).toHaveLength(0);
  });

  it('posts the assignment, reports it, and keeps the course for the next one', async () => {
    const { fetchMock, onCreated, user } = setup({
      status: 201,
      body: { id: '9', course_id: 'agents-tool-use', title: 'Build a weather agent' },
    });
    await screen.findByRole('option', { name: /Build AI Agents/ });

    await user.selectOptions(screen.getByLabelText('Course'), 'agents-tool-use');
    await user.type(screen.getByLabelText('Title'), 'Build a weather agent');
    await user.type(screen.getByLabelText('Description'), 'Call a weather API as a tool.');
    await user.type(screen.getByLabelText('Due date (optional)'), '2026-11-20');
    await user.click(screen.getByRole('button', { name: 'Post assignment' }));

    expect(await screen.findByText('Posted “Build a weather agent”.')).toBeInTheDocument();
    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: '9' }));

    const [[, request]] = postCalls(fetchMock);
    expect(request.headers.Authorization).toBe('Bearer faculty-token');
    expect(JSON.parse(request.body)).toEqual({
      courseId: 'agents-tool-use',
      title: 'Build a weather agent',
      description: 'Call a weather API as a tool.',
      dueDate: '2026-11-20',
    });

    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Course')).toHaveValue('agents-tool-use');
  });

  it('shows field errors from the server next to the field', async () => {
    const { onCreated, user } = setup({
      status: 400,
      body: { error: 'Some details need fixing.', fieldErrors: { dueDate: 'Use a real date.' } },
    });
    await screen.findByRole('option', { name: /Build AI Agents/ });

    await user.selectOptions(screen.getByLabelText('Course'), 'react-patterns');
    await user.type(screen.getByLabelText('Title'), 'Refactor to hooks');
    await user.click(screen.getByRole('button', { name: 'Post assignment' }));

    expect(await screen.findByText('Use a real date.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Some details need fixing.');
    expect(screen.getByLabelText('Due date (optional)')).toHaveAttribute('aria-invalid', 'true');
    expect(onCreated).not.toHaveBeenCalled();
  });
});
