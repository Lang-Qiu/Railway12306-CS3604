import React from 'react'
import './TrainItem.css'
import ReserveButton from './ReserveButton'

type Props = { train: any; onReserve: (trainNo: string) => void; isLoggedIn: boolean; queryTimestamp: string; rowIndex: number }

const TrainItem: React.FC<Props> = ({ train, onReserve, isLoggedIn, queryTimestamp, rowIndex }) => {
  const seats = {
    business: train.availableSeats?.['商务座'] ?? null,
    firstClass: train.availableSeats?.['一等座'] ?? null,
    secondClass: train.availableSeats?.['二等座'] ?? null,
    softSleeper: train.availableSeats?.['软卧'] ?? null,
    hardSleeper: train.availableSeats?.['硬卧'] ?? null,
    noSeat: train.availableSeats?.['无座'] ?? null,
  }
  const fmtStatus = (n: number | null | undefined) => { if (n==null) return '--'; if (n===0) return '无'; if (n>=20) return '有'; return String(n) }
  const cls = (n: number | null | undefined) => { if (n==null) return 'not-available'; if (n===0) return 'sold-out'; if (n>=20) return 'available'; return 'limited' }
  const fmtDuration = (min?: number) => { if(!min&&min!==0) return '--'; const h=Math.floor((min||0)/60); const m=(min||0)%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` }

  return (
    <div className={`train-item ${rowIndex % 2 === 0 ? 'train-item-even' : 'train-item-odd'}`}>
      <div className="train-item-cell align-left">
        <div className="train-number-container">
          <span className="train-number">{train.trainNo || '--'}</span>
          <svg className="train-dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 8L2 4H10L6 8Z" fill="#2196f3"/></svg>
        </div>
        <div className="train-badges">
          {train.trainNo?.startsWith('G') && <span className="train-badge">高</span>}
          {train.trainNo?.startsWith('D') && <span className="train-badge">动</span>}
        </div>
      </div>
      <div className="train-item-cell">
        <div className="train-stations-vertical">
          <div className="station-name-with-badge"><span className="station-badge station-badge-start">始</span><span className="station-name">{train.departureStation || '--'}</span></div>
          <div className="station-name-with-badge"><span className="station-badge station-badge-end">终</span><span className="station-name">{train.arrivalStation || '--'}</span></div>
        </div>
      </div>
      <div className="train-item-cell">
        <div className="train-times-vertical">
          <div className="train-time train-time-departure">{train.departureTime || '--'}</div>
          <div className="train-time train-time-arrival">{train.arrivalTime || '--'}</div>
        </div>
      </div>
      <div className="train-item-cell">
        <div className="train-duration">{fmtDuration(train.duration)}</div>
        <div className="train-arrival-date">
          {(() => {
            if (!train.departureTime || !train.arrivalTime) return <span className="arrival-day-tag">当日到达</span>
            const [dh,dm]=String(train.departureTime).split(':').map(Number); const [ah,am]=String(train.arrivalTime).split(':').map(Number)
            const dep=dh*60+dm, arr=ah*60+am
            return arr<dep ? <span className="arrival-day-tag">次日到达</span> : <span className="arrival-day-tag">当日到达</span>
          })()}
        </div>
      </div>
      <div className="train-item-cell"><div className={`seat-info ${cls(seats.business)}`}>{fmtStatus(seats.business)}</div></div>
      <div className="train-item-cell"><div className="seat-info">--</div></div>
      <div className="train-item-cell"><div className={`seat-info ${cls(seats.firstClass)}`}>{fmtStatus(seats.firstClass)}</div></div>
      <div className="train-item-cell"><div className={`seat-info ${cls(seats.secondClass)}`}>{fmtStatus(seats.secondClass)}</div></div>
      <div className="train-item-cell"><div className="seat-info">--</div></div>
      <div className="train-item-cell"><div className={`seat-info ${cls(seats.softSleeper)}`}>{fmtStatus(seats.softSleeper)}</div></div>
      <div className="train-item-cell"><div className={`seat-info ${cls(seats.hardSleeper)}`}>{fmtStatus(seats.hardSleeper)}</div></div>
      <div className="train-item-cell"><div className="seat-info">--</div></div>
      <div className="train-item-cell"><div className="seat-info">--</div></div>
      <div className="train-item-cell"><div className={`seat-info ${cls(seats.noSeat)}`}>{fmtStatus(seats.noSeat)}</div></div>
      <div className="train-item-cell"><div className="seat-info">--</div></div>
      <div className="train-item-cell train-reserve-cell">
        <ReserveButton trainNo={train.trainNo} departureStation={train.departureStation} arrivalStation={train.arrivalStation} departureDate={train.departureDate} departureTime={train.departureTime} hasSoldOut={false} isLoggedIn={isLoggedIn} onReserve={onReserve} queryTimestamp={queryTimestamp} />
      </div>
    </div>
  )
}

export default TrainItem