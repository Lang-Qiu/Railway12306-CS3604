import React from 'react';

interface CancelOrderModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const CancelOrderModal: React.FC<CancelOrderModalProps> = ({ visible, onCancel, onConfirm }) => {
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
      <div className="cancel-order-modal" style={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: 'white',
        border: '1px solid #c0d7eb',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div className="cancel-order-modal-header" style={{
          background: 'linear-gradient(to right, #3698d5, #1d82bd)',
          borderRadius: '10px 10px 0px 0px',
          padding: '5px 20px',
          borderBottom: '2px solid #8fcdec'
        }}>
          <div className="cancel-order-modal-title" style={{
            marginTop: '5px',
            marginBottom: '5px',
            fontSize: '16px',
            fontWeight: 500,
            color: 'white',
            letterSpacing: '0.5px'
          }}>
            交易提示
          </div>
        </div>

        {/* Body */}
        <div className="cancel-order-modal-body" style={{
          padding: '30px 50px 10px 50px',
          backgroundColor: 'white'
        }}>
          <div className="cancel-order-modal-content-wrapper" style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start'
          }}>
            <img src="/images/question.png" alt="question" style={{
              flexShrink: 0,
              width: '80px',
              height: '80px',
              marginTop: '10px'
            }} />
            
            <div className="cancel-order-text-content" style={{
              flex: 1,
              paddingTop: '5px'
            }}>
              <div className="cancel-order-question" style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#000000',
                marginBottom: '5px',
                lineHeight: 1.4
              }}>
                您确认取消订单吗？
              </div>
              <div className="cancel-order-warning" style={{
                fontSize: '13px',
                color: '#666666',
                lineHeight: 1.8
              }}>
                一天内3次申请车票成功后取消订单（包含无座车票或不符合选铺需求车票时取消5次计为取消1次），当日将不能在12306继续购票。
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="cancel-order-modal-footer" style={{
          padding: '20px',
          backgroundColor: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '30px'
        }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '10px 40px',
              border: '1px solid #d0d0d0',
              borderRadius: '5px',
              fontSize: '15px',
              fontWeight: 500,
              minWidth: '140px',
              backgroundColor: 'white',
              color: '#666',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5'; e.currentTarget.style.borderColor = '#b0b0b0'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#d0d0d0'; }}
          >
            取消
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '10px 40px',
              border: '1px solid #ff7200',
              borderRadius: '5px',
              fontSize: '15px',
              fontWeight: 500,
              minWidth: '140px',
              backgroundColor: '#ff7200',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ff8533'; e.currentTarget.style.borderColor = '#ff8533'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ff7200'; e.currentTarget.style.borderColor = '#ff7200'; }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelOrderModal;
