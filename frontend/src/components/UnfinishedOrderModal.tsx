import React from 'react';
import { Link } from 'react-router-dom';

interface UnfinishedOrderModalProps {
  visible: boolean;
  onConfirm: () => void; // Close modal
}

const UnfinishedOrderModal: React.FC<UnfinishedOrderModalProps> = ({ visible, onConfirm }) => {
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
      <div className="unfinished-order-modal" style={{
        width: '90%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div className="unfinished-order-modal-header" style={{
          padding: '10px 20px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: 'white'
        }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}></div> {/* Title not specified in detail but usually empty or simple */}
        </div>

        {/* Body */}
        <div className="unfinished-order-modal-body" style={{
          padding: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '18px',
            lineHeight: 1.6,
            color: '#333'
          }}>
            您还有未处理的订单，请您到
            <Link to="/orders/unfinished" style={{
              color: '#2876c8',
              textDecoration: 'underline',
              margin: '0 5px'
            }}>
              [未完成订单]
            </Link>
            进行处理！
          </div>
        </div>

        {/* Footer */}
        <div className="unfinished-order-modal-footer" style={{
          padding: '15px 20px',
          borderTop: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '30px'
        }}>
          <button 
            onClick={onConfirm}
            style={{
              padding: '8px 20px',
              backgroundColor: '#ff6600',
              color: 'white',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              border: 'none',
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

export default UnfinishedOrderModal;
