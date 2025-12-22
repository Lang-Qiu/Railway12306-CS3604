import React from 'react';

const OrderFooter: React.FC = () => {
  return (
    <div className="order-footer" style={{ marginTop: '30px', padding: '20px 0', borderTop: '1px solid #ddd' }}>
      <div className="content" style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '1100px' }}>
         <div className="links" style={{ fontSize: '14px', color: '#666' }}>
             {/* Simple placeholder for links as per PRD "same as home page" */}
             友情链接 | 关于我们 | 网站声明
         </div>
         <div className="qr-codes" style={{ display: 'flex', gap: '20px' }}>
             <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                 <img src="/images/qr-china-railway-wechat.png" alt="中国铁路官方微信" style={{ width: '80px', height: '80px', border: '1px solid #eee', marginBottom: '5px' }} />
                 <div>中国铁路官方微信</div>
             </div>
             <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                 <img src="/images/qr-china-railway-weibo.png" alt="中国铁路官方微博" style={{ width: '80px', height: '80px', border: '1px solid #eee', marginBottom: '5px' }} />
                 <div>中国铁路官方微博</div>
             </div>
             <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                 <img src="/images/qr-12306.png" alt="12306 公众号" style={{ width: '80px', height: '80px', border: '1px solid #eee', marginBottom: '5px' }} />
                 <div>12306 公众号</div>
             </div>
             <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
                 <img src="/images/qr-12306-official.png" alt="铁路 12306" style={{ width: '80px', height: '80px', border: '1px solid #eee', marginBottom: '5px' }} />
                 <div>铁路 12306</div>
             </div>
         </div>
      </div>
    </div>
  );
};

export default OrderFooter;
