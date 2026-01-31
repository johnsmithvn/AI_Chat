/**
 * InputDialog - Reusable input popup component for rename, etc.
 */
import { useEffect, useRef, useState } from 'react';
import './ConfirmDialog.css';

export interface InputDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  initialValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function InputDialog({
  isOpen,
  title,
  message,
  placeholder = '',
  initialValue = '',
  confirmText = 'Save',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: InputDialogProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset value when dialog opens
  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      // Focus input after animation
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (value.trim()) {
        onConfirm(value.trim());
      }
    }
  };

  return (
    <div className="confirm-dialog-backdrop" onClick={handleBackdropClick}>
      <div 
        className="confirm-dialog" 
        ref={dialogRef} 
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="input-dialog-title"
      >
        <h3 id="input-dialog-title" className="confirm-dialog-title">
          {title}
        </h3>
        {message && <p className="confirm-dialog-message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="input-dialog-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
          <div className="confirm-dialog-actions">
            <button 
              type="button"
              className="confirm-dialog-btn confirm-dialog-btn-cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button 
              type="submit"
              className="confirm-dialog-btn confirm-dialog-btn-confirm"
              disabled={!value.trim()}
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
