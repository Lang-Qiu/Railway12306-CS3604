import React from 'react'
import { useLocation } from 'react-router-dom'

const TrainsPage: React.FC = () => {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const entries = Array.from(params.entries())
  return (
    <div style={{ padding: 24 }}>
      <h2>车次列表（占位）</h2>
      <div>参数：</div>
      <ul>
        {entries.map(([k, v]) => (
          <li key={k}>{k}: {v}</li>
        ))}
      </ul>
      <div>后续将接入查询接口并展示结果。</div>
    </div>
  )
}

export default TrainsPage

