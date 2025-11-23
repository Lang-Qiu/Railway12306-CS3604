import React, { useState } from 'react'
import './TrainList.css'
import TrainItem from './TrainItem'

type Props = {
  trains: any[]
  onReserve: (trainNo: string) => void
  isLoggedIn: boolean
  queryTimestamp: string
  departureCity?: string
  arrivalCity?: string
  departureDate?: string
}

type SortField = 'departureTime' | 'arrivalTime' | 'duration' | null
type SortOrder = 'asc' | 'desc'

const TrainList: React.FC<Props> = ({ trains, onReserve, isLoggedIn, queryTimestamp, departureCity, arrivalCity, departureDate }) => {
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr); const m = d.getMonth()+1; const day = d.getDate(); const w = ['周日','周一','周二','周三','周四','周五','周六'][d.getDay()]
    return `${m}月${day}日 ${w}`
  }
  const handleSort = (f: SortField) => { if (sortField === f) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortField(f); setSortOrder('asc') } }
  const sorted = [...trains].sort((a,b)=>{ if(!sortField) return 0; let c=0; if(sortField==='departureTime') c=String(a.departureTime||'').localeCompare(String(b.departureTime||'')); else if(sortField==='arrivalTime') c=String(a.arrivalTime||'').localeCompare(String(b.arrivalTime||'')); else if(sortField==='duration') c=(a.duration||0)-(b.duration||0); return sortOrder==='asc'?c:-c })
  const icon = (f: SortField, isArrival=false) => sortField!==f ? <span className="sort-icon neutral">{isArrival?'▼':'▲'}</span> : (sortOrder==='asc'?<span className="sort-icon asc">▲</span>:<span className="sort-icon desc">▼</span>)

  return (
    <div className="train-list">
      {sorted.length>0 && (
        <div className="train-list-info">
          <div className="train-list-summary">
            <span className="summary-route">{departureCity||'--'} → {arrivalCity||'--'} </span>
            <span className="summary-date">({formatDate(departureDate)})</span>
            <span className="summary-count"> 共{sorted.length}个车次</span>
            <span className="summary-transfer">您可使用<span className="transfer-highlight">中转换乘</span>功能，查询途中换乘一次的部分列车余票情况。</span>
          </div>
          <div className="train-list-hints">
            <label className="hint-checkbox"><input type="checkbox" /><span>显示折扣车次</span></label>
            <label className="hint-checkbox"><input type="checkbox" /><span>显示积分兑换车次</span></label>
            <label className="hint-checkbox"><input type="checkbox" /><span>显示全部可预订车次</span></label>
          </div>
        </div>
      )}
      <div className="train-list-container">
        <div className="train-list-header">
          <div className="train-list-header-cell">车次</div>
          <div className="train-list-header-cell">出发站<br/>到达站</div>
          <div className="train-list-header-cell">
            <span className="header-line sortable-line" onClick={()=>handleSort('departureTime')}>出发时间 {icon('departureTime')}</span>
            <span className="header-line sortable-line" onClick={()=>handleSort('arrivalTime')}>到达时间 {icon('arrivalTime',true)}</span>
          </div>
          <div className="train-list-header-cell sortable" onClick={()=>handleSort('duration')}><span className="header-line">历时 {icon('duration')}</span></div>
          <div className="train-list-header-cell">商务座<br/>特等座</div>
          <div className="train-list-header-cell">优选<br/>一等座</div>
          <div className="train-list-header-cell">一等座</div>
          <div className="train-list-header-cell">二等座<br/>二等包座</div>
          <div className="train-list-header-cell">高级<br/>软卧</div>
          <div className="train-list-header-cell">软卧/动卧<br/>一等卧</div>
          <div className="train-list-header-cell">硬卧<br/>二等卧</div>
          <div className="train-list-header-cell">软座</div>
          <div className="train-list-header-cell">硬座</div>
          <div className="train-list-header-cell">无座</div>
          <div className="train-list-header-cell">其他</div>
          <div className="train-list-header-cell">备注</div>
        </div>
        {sorted.length===0 ? (
          <div className="train-list-empty">
            <div className="train-list-empty-text">很抱歉，按您的查询条件，当前未找到从{departureCity||'--'} 到 {arrivalCity||'--'} 的列车。</div>
            <div className="train-list-empty-hint">您可以使用<span className="transfer-highlight">中转换乘</span>功能，查询途中换乘一次的部分列车余票情况。</div>
          </div>
        ) : (
          <div className="train-list-body">
            {sorted.map((train,index)=>(
              <TrainItem key={train.trainNo} train={train} onReserve={onReserve} isLoggedIn={isLoggedIn} queryTimestamp={queryTimestamp} rowIndex={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default TrainList