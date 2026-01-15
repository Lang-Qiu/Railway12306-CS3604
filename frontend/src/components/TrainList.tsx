import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TrainList.css';
import TrainItem from './TrainItem';

interface TrainListProps {
  trains: any[];
  onReserve: (trainNo: string) => void;
  isLoggedIn: boolean;
  queryTimestamp: string;
  departureCity?: string;
  arrivalCity?: string;
  departureDate?: string;
}

type SortField = 'departureTime' | 'arrivalTime' | 'duration' | null;
type SortOrder = 'asc' | 'desc';

/**
 * 车次列表组件
 */
const TrainList: React.FC<TrainListProps> = ({ trains, onReserve, isLoggedIn, queryTimestamp, departureCity, arrivalCity, departureDate }) => {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // 格式化日期为"X月X日 周X"
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const weekday = weekdays[date.getDay()];
    
    return `${month}月${day}日 ${weekday}`;
  };

  // 处理排序
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 如果点击相同字段，切换排序顺序
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果点击新字段，设置为升序
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // 排序后的车次列表
  const sortedTrains = [...trains].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;
    if (sortField === 'departureTime') {
      comparison = (a.departureTime || '').localeCompare(b.departureTime || '');
    } else if (sortField === 'arrivalTime') {
      comparison = (a.arrivalTime || '').localeCompare(b.arrivalTime || '');
    } else if (sortField === 'duration') {
      comparison = (a.duration || 0) - (b.duration || 0);
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // 渲染排序图标 - 到达时间默认向下
  const renderSortIcon = (field: SortField, isArrival: boolean = false) => {
    if (sortField !== field) {
      return <span className="sort-icon neutral">{isArrival ? '▼' : '▲'}</span>;
    }
    return sortOrder === 'asc' ? 
      <span className="sort-icon asc">▲</span> : 
      <span className="sort-icon desc">▼</span>;
  };

  return (
    <div className="train-list">
      {/* 查询结果提示信息 - 始终显示 */}
      {(departureCity && arrivalCity) && (
        <div className="train-list-info">
          <div className="train-list-summary">
            <span className="summary-route">{departureCity} → {arrivalCity} </span>
            <span className="summary-date">({formatDate(departureDate)})</span>
            <span className="summary-count"> 共{sortedTrains.length}个车次</span>
            <span className="summary-transfer">您可使用<span className="transfer-highlight">中转换乘</span>功能，查询途中换乘一次的部分列车余票情况。</span>
          </div>
          <div className="train-list-hints">
            <label className="hint-checkbox">
              <input type="checkbox" />
              <span>显示折扣车次</span>
            </label>
            <label className="hint-checkbox">
              <input type="checkbox" />
              <span>显示积分兑换车次</span>
            </label>
            <label className="hint-checkbox">
              <input type="checkbox" />
              <span>显示全部可预订车次</span>
            </label>
          </div>
        </div>
      )}
      
      <div className="train-list-container">
        <div className="train-list-header">
          <div className="train-list-header-cell">车次</div>
          <div className="train-list-header-cell">
            出发站
            <br />
            到达站
          </div>
          <div className="train-list-header-cell">
            <span 
              className="header-line sortable-line"
              onClick={() => handleSort('departureTime')}
            >
              出发时间 {renderSortIcon('departureTime')}
            </span>
            <span 
              className="header-line sortable-line"
              onClick={() => handleSort('arrivalTime')}
            >
              到达时间 {renderSortIcon('arrivalTime', true)}
            </span>
          </div>
          <div 
            className="train-list-header-cell sortable"
            onClick={() => handleSort('duration')}
          >
            <span className="header-line">历时 {renderSortIcon('duration')}</span>
          </div>
          <div className="train-list-header-cell">
            商务座
            <br />
            特等座
          </div>
          <div className="train-list-header-cell">
            优选
            <br />
            一等座
          </div>
          <div className="train-list-header-cell">一等座</div>
          <div className="train-list-header-cell">
            二等座
            <br />
            二等包座
          </div>
          <div className="train-list-header-cell">
            高级
            <br />
            软卧
          </div>
          <div className="train-list-header-cell">
            软卧/动卧
            <br />
            一等卧
          </div>
          <div className="train-list-header-cell">
            硬卧
            <br />
            二等卧
          </div>
          <div className="train-list-header-cell">软座</div>
          <div className="train-list-header-cell">硬座</div>
          <div className="train-list-header-cell">无座</div>
          <div className="train-list-header-cell">其他</div>
          <div className="train-list-header-cell">备注</div>
        </div>
        {sortedTrains.length === 0 ? (
          <div className="train-list-empty">
            <div className="empty-icon-wrapper">
              <span className="empty-icon">!</span>
            </div>
            <div className="empty-content">
              <p>
                很抱歉，按您的查询条件，当前未找到从{departureCity || '出发地'} 到{arrivalCity || '目的地'} 的列车。
                您可以使用<span className="transfer-link" onClick={() => navigate('/?mode=transfer')}>中转换乘</span>功能，查询途中换乘一次的部分列车余票情况。
              </p>
            </div>
          </div>
        ) : (
          <div className="train-list-body">
            {sortedTrains.map((train, index) => (
              <TrainItem
                key={train.trainNo}
                train={train}
                onReserve={onReserve}
                isLoggedIn={isLoggedIn}
                queryTimestamp={queryTimestamp}
                rowIndex={index}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainList;

