import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

// A native <dialog> shown as a modal while `open` is true. Children only mount while open, so forms start fresh.
// With `dismissible={false}` there is no close button and Escape and backdrop clicks do nothing, so the user has to
// pick one of the dialog's own actions; it is then announced as an alert dialog.
function Modal({ id, open, title, description, wide, dismissible = true, onClose, children }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className={`modal${wide ? ' modal--wide' : ''}`}
      role={dismissible ? undefined : 'alertdialog'}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-description` : undefined}
      onClose={() => onClose?.()}
      onCancel={(event) => !dismissible && event.preventDefault()}
      onClick={(event) => dismissible && event.target === event.currentTarget && onClose?.()}
    >
      {open && (
        <div className="modal__body">
          <div className="modal__head">
            <div>
              <h2 id={`${id}-title`}>{title}</h2>
              {description && <p className="section__sub" id={`${id}-description`}>{description}</p>}
            </div>
            {dismissible && (
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
                <Icon name="x" />
              </button>
            )}
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export default Modal;
