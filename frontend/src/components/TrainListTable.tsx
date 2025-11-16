import React from 'react'
import '../styles/trains.css'

type Props = {
  data?: any[]
  onBook?: (trainNo: string) => void
}

const headers = ['车次', '出发站/到达站', '出发时间/到达时间', '历时', '商务座/特等座', '优选一等座', '一等座', '二等座', '二等包座', '高级软卧', '软卧/动卧一等卧', '硬卧二等卧', '软座', '硬座', '无座', '其他', '备注', '操作']

const statusSeat = (count: number, price: number) => {
  if (!Number.isFinite(price) || price <= 0) return <span className="seat-status dash">--</span>
  if (!Number.isFinite(count)) return <span className="seat-status dash">--</span>
  if (count === 0) return <span className="seat-status none">无</span>
  if (count >= 20) return <span className="seat-status available">有</span>
  return <span className="seat-status count">{String(count)}</span>
}

const TrainListTable: React.FC<Props> = ({ data = [], onBook }) => {
  return (
    <table className="train-table">
      <thead>
        <tr>
          <th>{headers[0]}</th>
          <th>
            <span className="th-line">出发站</span>
            <span className="th-line">到达站</span>
          </th>
          <th>
            <span className="th-line">出发时间</span>
            <span className="th-line">到达时间</span>
          </th>
          <th>{headers[3]}</th>
          <th>{headers[4]}</th>
          <th>{headers[5]}</th>
          <th>{headers[6]}</th>
          <th>{headers[7]}</th>
          <th>{headers[8]}</th>
          <th>{headers[9]}</th>
          <th>{headers[10]}</th>
          <th>{headers[11]}</th>
          <th>{headers[12]}</th>
          <th>{headers[13]}</th>
          <th>{headers[14]}</th>
          <th>{headers[15]}</th>
          <th>{headers[16]}</th>
          <th>{headers[17]}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((t) => (
          <tr key={t.id || t.trainNumber}>
            <td className="cell-train">
              <span className="train-no">{t.trainNumber}</span>
            </td>
            <td className="cell-stations">
              <div className="station-line">
                <span className="station-name">{t.departure}</span>
              </div>
              <div className="station-line">
                <span className="station-name">{t.arrival}</span>
              </div>
            </td>
            <td className="cell-times">
              <div className="time-line">
                <span className="time-strong">{t.departureTime}</span>
              </div>
              <div className="time-line">
                <span className="time-strong">{t.arrivalTime}</span>
              </div>
            </td>
            <td className="cell-duration">
              <div className="duration-strong">{t.duration}</div>
              <div className="arrival-day">当日到达</div>
            </td>
            <td className="cell-seat">{statusSeat(Number(t.businessSeat), Number(t.businessPrice))}</td>
            <td className="cell-seat"><span className="seat-status dash">--</span></td>
            <td className="cell-seat">{statusSeat(Number(t.firstClassSeat), Number(t.firstClassPrice))}</td>
            <td className="cell-seat">{statusSeat(Number(t.secondClassSeat), Number(t.secondClassPrice))}</td>
            <td className="cell-seat"><span className="seat-status dash">--</span></td>
            <td className="cell-seat"><span className="seat-status dash">--</span></td>
            <td className="cell-seat">{statusSeat(Number(t.softSleeperSeat), Number(t.softSleeperPrice))}</td>
            <td className="cell-seat">{statusSeat(Number(t.hardSleeperSeat), Number(t.hardSleeperPrice))}</td>
            <td className="cell-seat"><span className="seat-status dash">--</span></td>
            <td className="cell-seat"><span className="seat-status dash">--</span></td>
            <td className="cell-seat"><span className="seat-status dash">--</span></td>
            <td className="cell-seat"><span className="seat-status dash">--</span></td>
            <td className="cell-remark"><span className="remark-dash">--</span></td>
            <td className="cell-action">
              <button
                className="book-btn"
                onClick={() => onBook?.(String(t.trainNumber))}
                disabled={
                  (Number(t.businessSeat) === 0 && Number(t.firstClassSeat) === 0 && Number(t.secondClassSeat) === 0 && Number(t.softSleeperSeat) === 0 && Number(t.hardSleeperSeat) === 0)
                }
              >预订</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default TrainListTable