import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Modal from './Modal.jsx';

function renderModal(props = {}) {
  const onClose = vi.fn();
  const result = render(
    <Modal id="test" open title="Add a course" description="Pick one." onClose={onClose} {...props}>
      <p>Dialog body</p>
    </Modal>,
  );
  return { ...result, onClose, dialog: result.container.querySelector('dialog') };
}

describe('Modal', () => {
  it('opens as a dialog labelled by its title, with the description and children', () => {
    const { dialog } = renderModal();

    expect(dialog.open).toBe(true);
    expect(screen.getByRole('dialog', { name: 'Add a course' })).toBeInTheDocument();
    expect(screen.getByText('Pick one.')).toBeInTheDocument();
    expect(screen.getByText('Dialog body')).toBeInTheDocument();
  });

  it('does not render its children while closed, so forms start fresh each time it opens', () => {
    const { dialog, rerender, onClose } = renderModal({ open: false });
    expect(dialog.open).toBe(false);
    expect(screen.queryByText('Dialog body')).not.toBeInTheDocument();

    rerender(
      <Modal id="test" open title="Add a course" onClose={onClose}>
        <p>Dialog body</p>
      </Modal>,
    );
    expect(dialog.open).toBe(true);
    expect(screen.getByText('Dialog body')).toBeInTheDocument();
  });

  it('calls onClose from the close button', async () => {
    const { onClose } = renderModal();
    await userEvent.setup().click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the backdrop is clicked but not when the content is', () => {
    const { onClose, dialog } = renderModal();

    fireEvent.click(screen.getByText('Dialog body'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(dialog);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the browser closes the dialog (for example with Escape)', () => {
    const { onClose, dialog } = renderModal();
    fireEvent(dialog, new Event('close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('wide adds the wide layout', () => {
    const { dialog } = renderModal({ wide: true });
    expect(dialog).toHaveClass('modal', 'modal--wide');
  });
});
