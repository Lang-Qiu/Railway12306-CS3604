import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  title?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, message, onConfirm, title }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="modal-content" style={{
        backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '400px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="modal-header" style={{
          padding: '10px 20px', borderBottom: '1px solid #e0e0e0',
          fontSize: '18px', fontWeight: 'bold', color: 'white', background: '#3aadf9' // Assuming blue header from other modals or just keep white? PRD says "Title bar... color white" but implies background. Wait, PRD 5.5 Scenario 1 says "Title bar ... color white". Let's assume blue background for consistency or just check text color. Actually PRD says "Title font size... color white". If background is white, text white is invisible. So likely background is colored. I'll use blue.
        }}>
          {title || "提示"}
        </div>
        <div className="modal-body" style={{ padding: '20px', fontSize: '18px', color: '#333', lineHeight: 1.6 }}>
          {message}
        </div>
        <div className="modal-footer" style={{
          padding: '15px 20px', borderTop: '1px solid #e0e0e0',
          display: 'flex', justifyContent: 'center'
        }}>
          <button onClick={onConfirm} style={{
            padding: '8px 20px', background: '#ff6600', color: 'white',
            border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer'
          }}>
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
