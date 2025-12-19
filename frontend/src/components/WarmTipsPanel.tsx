import React from 'react';

const WarmTipsPanel: React.FC = () => {
  return (
    <div className="payment-warm-tips-section" style={{
      backgroundColor: '#fffbe5',
      border: '1px solid #f5e6a8',
      padding: '10px 15px',
      marginTop: '20px',
      marginBottom: '0',
      maxWidth: '1100px',
      width: '100%',
      margin: '20px auto 0 auto' // Centered
    }}>
      <div className="payment-tips-title" style={{
        fontSize: '15px',
        fontWeight: 700,
        color: '#333333',
        marginBottom: '5px'
      }}>
        温馨提示：
      </div>
      <ol className="payment-tips-list" style={{
        paddingLeft: '15px',
        listStylePosition: 'outside',
        listStyleType: 'decimal',
        margin: 0
      }}>
        {[
          "请在指定时间内完成网上支付。",
          "逾期未支付，系统将取消本次交易。",
          "在完成支付或取消本订单之前，您将无法购买其他车票。",
          <>购买铁路乘意险保障您的出行安全，提供意外伤害身故伤残、意外伤害医疗费用、意外伤害住院津贴、突发急性病身故保障，同时保障您和随行被监护人因疏忽或过失造成第三者人身伤亡和财产损失依法应由您承担的直接经济赔偿责任，详见保险条款</>,
          <>请充分理解保险责任、责任免除、保险期间、合同解除等约定，详见保险条款。凭保单号或保单查询号登录<a href="#" style={{ color: '#0073e7', textDecoration: 'none' }}>www.china-ric.com</a> 查看电子保单或下载电子发票。</>,
          "如因运力原因或其他不可控因素导致列车调度调整时，当前车型可能会发生变动。",
          "跨境旅客旅行须知详见铁路跨境旅客相关运输组织规则和车站公告。",
          "未尽事宜详见《国铁集团铁路旅客运输规程》等有关规定和车站公告。"
        ].map((item, index) => (
          <li key={index} className="payment-tip-item" style={{
            fontSize: '14px',
            color: '#000000',
            lineHeight: '22px',
            marginBottom: index === 7 ? 0 : '2px',
            paddingLeft: '4px'
          }}>
            {item}
          </li>
        ))}
      </ol>
    </div>
  );
};

export default WarmTipsPanel;
