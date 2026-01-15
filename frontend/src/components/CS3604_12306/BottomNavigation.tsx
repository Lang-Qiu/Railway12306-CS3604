import React from 'react';
import './BottomNavigation.css';

const BottomNavigation: React.FC = () => {
  return (
    <footer className="bottom-navigation" data-testid="bottom-navigation">
      <div className="bottom-content">
        <div className="qr-codes-section">
          <div className="friendship-links">
            <div className="links-title">友情链接</div>
            <div className="links-grid">
              <a href="http://www.china-railway.com.cn/" target="_blank" rel="noopener noreferrer">
                <img src="/images/link01.png" alt="友情链接" />
              </a>
              <a href="http://www.china-ric.com/" target="_blank" rel="noopener noreferrer">
                <img src="/images/link02.png" alt="中国铁路财产保险自保有限公司" />
              </a>
              <a href="http://www.95306.cn/" target="_blank" rel="noopener noreferrer">
                <img src="/images/link03.png" alt="中国铁路95306网" />
              </a>
              <a href="http://www.95572.com/" target="_blank" rel="noopener noreferrer">
                <img src="/images/link04.png" alt="中铁快运官网" />
              </a>
            </div>
          </div>
          
          <div className="qr-codes-container">
            <div className="qr-codes">
              <div className="qr-code-item">
                <img src="/images/qr-china-railway-wechat.png" alt="中国铁路官方微信" />
                <span>中国铁路官方微信</span>
              </div>
              <div className="qr-code-item">
                <img src="/images/qr-china-railway-weibo.png" alt="中国铁路官方微博" />
                <span>中国铁路官方微博</span>
              </div>
              <div className="qr-code-item">
                <img src="/images/qr-12306-official.png" alt="12306 公众号" />
                <span>12306 公众号</span>
              </div>
              <div className="qr-code-item">
                <img src="/images/qr-12306.png" alt="铁路12306" />
                <span>铁路12306</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BottomNavigation;
