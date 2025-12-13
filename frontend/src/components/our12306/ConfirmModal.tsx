import React from 'react'
import './ConfirmModal.css'

type Props = { isVisible: boolean; title: string; message: string; confirmText: string; cancelText: string; onConfirm: () => void; onCancel: () => void }

const ConfirmModal: React.FC<Props> = ({ isVisible, title, message, confirmText, cancelText, onConfirm, onCancel }) => {
  if (!isVisible) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header header-blue" style={{ height: 40 }}>
          <h3 className="modal-title white">{title}</h3>
          <button className="close-btn" aria-label="关闭" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <div className="icon-row">
            <span data-testid="question-icon" className="icon-question">?</span>
            <p className="modal-message">{message}</p>
          </div>
        </div>
        <div className="modal-footer center">
          <button className="modal-button cancel-button" onClick={onCancel}>{cancelText}</button>
          <button className="modal-button confirm-button" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
