import { useEffect } from 'react'
import './ActivityDialog.css'

interface ConfirmDialogProps {
  message: string
  confirmLabel: string
  cancelLabel: string
  /** Om true får bekräftelseknappen röd (destruktiv) stil. */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Liten bekräftelsedialog (ja/nej) för t.ex. borttagning. */
export default function ConfirmDialog({
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="adlg-root" role="dialog" aria-modal="true" aria-label={message}>
      <div className="adlg-scrim" onClick={onCancel} />
      <div className="adlg adlg--narrow">
        <div className="adlg__body adlg__body--confirm">
          <p className="adlg-confirm__text">{message}</p>
        </div>
        <footer className="adlg__foot">
          <div className="adlg__foot-right">
            <button className="adlg-btn" type="button" onClick={onCancel}>
              {cancelLabel}
            </button>
            <button
              className={`adlg-btn ${danger ? 'adlg-btn--danger-solid' : 'adlg-btn--primary'}`}
              type="button"
              autoFocus
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
