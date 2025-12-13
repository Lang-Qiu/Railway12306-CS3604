import React from 'react'
import './AddressTips.css'

export default function AddressTips() {
  return (
    <div className="tips">
      <div className="tips-title">温馨提示</div>
      <ul className="tips-list">
        <li>1. 您最多可添加20个地址，对已支付的地址30天内不可删除与修改。</li>
        <li>2. 请您准确完整的填写收件地址、收件人姓名、手机号码等信息，并保持电话畅通，以免耽误接收车票。</li>
      </ul>
    </div>
  )
}
