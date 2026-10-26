import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import StudentEditor from './StudentEditor.jsx';
import { mockFetch } from '../test/mockFetch.js';

const students = [
  { id: '3', full_name: 'Rohit Sharma', email: 'rohit@example.com', phone_number: '3203105641', education: 'Postgraduate' },
  { id: '7', full_name: 'Ada Lovelace', email: 'ada@example.com', phone_number: '+1 555 010 2030', education: 'Bootcamp' },
];

function setup(patchReply) {
  const fetchMock = mockFetch({ 'PATCH /api/students/7': patchReply });
  const onSaved = vi.fn();
  render(<StudentEditor token="faculty-token" students={students} onSaved={onSaved} />);
  return { fetchMock, onSaved, user: userEvent.setup() };
}

describe('StudentEditor', () => {
  it('shows the form only after a student is picked, filled with their details', async () => {
    const { user } = setup();
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Student'), '7');

    expect(screen.getByLabelText('Name')).toHaveValue('Ada Lovelace');
    expect(screen.getByLabelText('Email')).toHaveValue('ada@example.com');
    expect(screen.getByLabelText('Phone number')).toHaveValue('+1 555 010 2030');
    expect(screen.getByLabelText('Education')).toHaveValue('Bootcamp');
  });

  it('checks the details in the browser before saving', async () => {
    const { fetchMock, user } = setup();
    await user.selectOptions(screen.getByLabelText('Student'), '7');

    await user.clear(screen.getByLabelText('Email'));
    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText("That email doesn't look right.")).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveFocus();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('saves the changes with the faculty token and reports the saved student', async () => {
    const saved = { ...students[1], full_name: 'Ada King', education: 'Postgraduate' };
    const { fetchMock, onSaved, user } = setup({ body: saved });
    await user.selectOptions(screen.getByLabelText('Student'), '7');

    await user.clear(screen.getByLabelText('Name'));
    await user.type(screen.getByLabelText('Name'), 'Ada King');
    await user.selectOptions(screen.getByLabelText('Education'), 'Postgraduate');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByText("Saved Ada King's details.")).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledWith(saved);

    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/students/7');
    expect(request.headers.Authorization).toBe('Bearer faculty-token');
    expect(JSON.parse(request.body)).toEqual({
      fullName: 'Ada King',
      email: 'ada@example.com',
      phoneNumber: '+1 555 010 2030',
      education: 'Postgraduate',
    });
  });

  it('shows a clash reported by the server on the right field', async () => {
    const { onSaved, user } = setup({
      status: 409,
      body: { error: 'That email already has an account.', fieldErrors: { email: 'That email already has an account.' } },
    });
    await user.selectOptions(screen.getByLabelText('Student'), '7');

    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('That email already has an account.');
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(onSaved).not.toHaveBeenCalled();
  });
});
