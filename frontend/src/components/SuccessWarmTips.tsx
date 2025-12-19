import React from 'react';
import './SuccessWarmTips.css';

const SuccessWarmTips: React.FC = () => {
  return (
    <div className="success-warm-tips-wrapper">
      <div className="success-order-warm-tips-container">
        <div className="success-order-warm-tips-content">
          <div className="success-order-tips-title">温馨提示：</div>
          <ol className="success-order-tips-list">
            <li className="success-order-tip-item">
              如需换票，请尽早携带购票时使用的乘车人有效身份证件到车站、售票窗口、自动售（取）票机、铁路客票代售点办理。
            </li>
            <li className="success-order-tip-item">
              请乘车人持购票时使用的有效证件按时乘车。
            </li>
            <li className="success-order-tip-item">
              投保后可于凭保单号"查看电子保单"查看保单（登陆中国铁路保险 <a href="http://www.china-ric.com" target="_blank" rel="noopener noreferrer">www.china-ric.com</a> 查看电子保单）。
            </li>
            <li className="success-order-tip-item">
              完成微信或支付宝绑定后，购票、改签、退票、购买餐食险、退票爱路险的通知消息，将会通过微信或支付宝通知提醒发送给您；手机号码换频、通过手机号码投回密码、列车运行调整的通知仍然通过短信发送给您。
            </li>
            <li className="success-order-tip-item">
              未尽事宜详见《铁路旅客运输规程》等有关规定和车站公告。
            </li>
          </ol>
        </div>

        <div className="success-order-qr-codes-inline">
          <div className="success-order-qr-item-inline">
            <img src="/images/微信二维码.png" alt="微信二维码" className="success-order-qr-image" />
            <div className="success-order-qr-text-inline">
              使用微信扫一扫，可通过微信接收12306行程通知
            </div>
          </div>
          <div className="success-order-qr-item-inline">
            <img src="/images/支付宝二维码.png" alt="支付宝二维码" className="success-order-qr-image" />
            <div className="success-order-qr-text-inline">
              使用支付宝扫一扫，可通过支付宝通知提醒接收12306行程通知
            </div>
          </div>
        </div>
      </div>

      <div className="success-order-advertisement">
        <img src="/images/广告.png" alt="广告" />
      </div>
    </div>
  );
};

export default SuccessWarmTips;
