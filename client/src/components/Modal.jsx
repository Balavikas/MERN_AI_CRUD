import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';

// A native <dialog> shown as a modal while `open` is true. Children only mount while open, so forms start fresh.
function Modal({ id, open, title, description, wide, onClose, children }) {
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
      aria-labelledby={`${id}-title`}
      onClose={onClose}
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      {open && (
        <div className="modal__body">
          <div className="modal__head">
            <div>
              <h2 id={`${id}-title`}>{title}</h2>
              {description && <p className="section__sub">{description}</p>}
            </div>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
              <Icon name="x" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export default Modal;
