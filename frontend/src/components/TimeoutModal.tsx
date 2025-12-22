import React from 'react';

interface TimeoutModalProps {
  visible: boolean;
  onConfirm: () => void;
}

const TimeoutModal: React.FC<TimeoutModalProps> = ({ visible, onConfirm }) => {
  if (!visible) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div className="timeout-modal" style={{
        width: '90%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}>
        <div className="timeout-modal-body" style={{
          padding: '30px 20px',
          textAlign: 'center'
        }}>
          <div className="timeout-modal-message" style={{
            fontSize: '16px',
            color: '#333',
            fontWeight: 500
          }}>
            支付超时，请重新购票
          </div>
        </div>

        <div className="timeout-modal-footer" style={{
          padding: '15px 20px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <button 
            onClick={onConfirm}
            style={{
              padding: '10px 30px',
              backgroundColor: '#ff6600',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              minWidth: '100px',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ff8833'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6600'}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeoutModal;
