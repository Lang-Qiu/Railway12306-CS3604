import React from 'react'
import ConfirmModal from './ConfirmModal'

type Props = { isVisible: boolean; orderId: string; onConfirm: () => void; onBack: () => void; onSuccess: () => void }

const OrderConfirmationModal: React.FC<Props> = ({ isVisible, orderId, onBack, onSuccess }) => {
  if (!isVisible) return null
  return (
    <ConfirmModal isVisible={isVisible} title="信息核对" message={`订单已创建，ID：${orderId}`} confirmText="确认" cancelText="返回" onConfirm={onSuccess} onCancel={onBack} />
  )
}

export default OrderConfirmationModal