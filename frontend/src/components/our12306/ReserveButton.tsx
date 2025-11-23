import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ReserveButton.css'
import ConfirmModal from './ConfirmModal'

type Props = { trainNo: string; departureStation: string; arrivalStation: string; departureDate: string; departureTime: string; hasSoldOut: boolean; isLoggedIn: boolean; onReserve: (trainNo: string) => void; queryTimestamp: string }

const ReserveButton: React.FC<Props> = ({ trainNo, departureStation: _ds, arrivalStation: _as, departureDate, departureTime, hasSoldOut, isLoggedIn, onReserve, queryTimestamp }) => {
  const navigate = useNavigate()
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [modalConfig, setModalConfig] = useState<any>({})

  const handleClick = () => {
    const rules: Array<() => boolean> = [
      () => {
        if (!isLoggedIn) { setShowLoginModal(true); return false }
        return true
      },
      () => {
        const now = new Date(); const dep = new Date(`${departureDate} ${departureTime}`); const until = dep.getTime() - now.getTime()
        if (until < 3 * 60 * 60 * 1000 && until > 0) {
          setModalConfig({ title:'温馨提示', message:'您选择的列车距开车时间很近了，进站约需20分钟，请确保有足够的时间办理安全检查、实名制验证及检票等手续，以免耽误您的旅行。', confirmText:'确认', cancelText:'取消', onConfirm:()=>{ setShowConfirmModal(false); onReserve(trainNo) } })
          setShowConfirmModal(true)
          return false
        }
        return true
      }
    ]
    let idx = 0
    while (idx < rules.length) { if (!rules[idx]()) return; idx++ }
    onReserve(trainNo)
  }

  return (
    <>
      <button className={`reserve-button ${hasSoldOut ? 'soldout' : ''}`} onClick={handleClick} disabled={hasSoldOut}>预订</button>
      {showLoginModal && (<ConfirmModal isVisible={showLoginModal} title="提示" message="请先登录！" confirmText="确认" cancelText="取消" onConfirm={() => { setShowLoginModal(false); navigate('/login') }} onCancel={() => setShowLoginModal(false)} />)}
      {showConfirmModal && (<ConfirmModal isVisible={showConfirmModal} title={modalConfig.title} message={modalConfig.message} confirmText={modalConfig.confirmText} cancelText={modalConfig.cancelText} onConfirm={modalConfig.onConfirm} onCancel={() => setShowConfirmModal(false)} />)}
    </>
  )
}

export default ReserveButton