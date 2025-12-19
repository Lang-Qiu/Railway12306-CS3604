import React, { useState } from 'react';

interface OrderSubmitSectionProps {
  onSubmit?: () => void;
  onBack?: () => void;
}

const OrderSubmitSection: React.FC<OrderSubmitSectionProps> = ({ onSubmit, onBack }) => {
  const [backBtnHover, setBackBtnHover] = useState(false);
  const [submitBtnHover, setSubmitBtnHover] = useState(false);

  return (
    <div className="order-submit-section" style={{ marginTop: '20px', maxWidth: '1100px' }}>
      {/* Payment Method Selection (Mock) */}
      <div className="payment-method-selection" style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', border: '1px solid #c0d7eb', borderRadius: '4px', color: '#000000' }}>
         <div style={{ fontWeight: 600, marginBottom: '10px' }}>支付方式预选</div>
         <div style={{ display: 'flex', gap: '20px' }}>
             <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                 <input type="radio" name="payment" defaultChecked />
                 <span style={{ marginLeft: '5px' }}>支付宝</span>
             </label>
             <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                 <input type="radio" name="payment" />
                 <span style={{ marginLeft: '5px' }}>微信支付</span>
             </label>
             <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                 <input type="radio" name="payment" />
                 <span style={{ marginLeft: '5px' }}>中国银联</span>
             </label>
         </div>
      </div>

      <div className="submit-area" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div className="agreement" style={{ fontSize: '12px', marginBottom: '15px', color: '#000000' }}>
            提交订单表示阅读并同意 <a href="#" style={{ color: '#0066cc', textDecoration: 'underline' }}>《中国集团铁路旅客运输规程》《服务条款》</a>
        </div>
        <div className="buttons" style={{ display: 'flex', justifyContent: 'center', gap: '50px' }}>
            <button 
                style={{ 
                    width: '180px', height: '40px', 
                    background: backBtnHover ? '#f5f5f5' : 'white', 
                    border: backBtnHover ? '1px solid #999999' : '1px solid #c0c0c0', 
                    borderRadius: '3px', fontSize: '16px', fontWeight: 500, cursor: 'pointer',
                    color: '#333333'
                }}
                onMouseEnter={() => setBackBtnHover(true)}
                onMouseLeave={() => setBackBtnHover(false)}
                onClick={onBack}
            >
                上一步
            </button>
            <button 
                style={{ 
                    width: '180px', height: '40px', 
                    background: submitBtnHover ? '#ff921d' : '#fd8100', 
                    border: 'none', 
                    borderRadius: '3px', fontSize: '16px', fontWeight: 500, color: 'white', cursor: 'pointer' 
                }}
                onMouseEnter={() => setSubmitBtnHover(true)}
                onMouseLeave={() => setSubmitBtnHover(false)}
                onClick={onSubmit}
            >
                提交订单
            </button>
        </div>
      </div>
      
      <div className="warm-tips" style={{ 
          backgroundColor: '#fffbe5', border: '1px solid #f5e6a8', borderRadius: '10px', 
          padding: '10px 15px', marginTop: '20px' 
      }}>
          <div className="title" style={{ fontSize: '15px', fontWeight: 700, color: '#333', marginBottom: '5px' }}>温馨提示</div>
          <ol style={{ paddingLeft: '20px', fontSize: '14px', color: '#404040', lineHeight: '22px' }}>
              <li>一张有效身份证件同一乘车日期同一车次只能购买一张车票，高铁动卧列车除外。</li>
              <li>购买铁路乘意险的注册用户年龄须在18周岁以上，使用非中国居民身份证注册的用户如购买铁路乘意险，须在我的12306——个人信息 如实填写"出生日期"。</li>
              <li>父母为未成年子女投保，须在我的乘车人 登记未成年子女的有效身份证件信息。</li>
              <li>未尽事宜详见《铁路旅客运输规程》等有关规定和车站公告。</li>
          </ol>
      </div>
    </div>
  );
};

export default OrderSubmitSection;
