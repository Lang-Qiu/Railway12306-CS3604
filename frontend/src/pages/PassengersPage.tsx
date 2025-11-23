import React, { useEffect, useMemo, useState } from 'react'
import { listPassengers, searchPassengers, addPassenger, updatePassenger, deletePassenger } from '../api/passengers'
import TopNavigation from '../components/TopNavigation'
import MainNavigation from '../components/MainNavigation'
import BottomNavigation from '../components/BottomNavigation'
import '../styles/base.css'
import './PassengersPage.css'

type Passenger = {
  id: number
  name: string
  phone?: string
  id_card_type?: string
  id_card_number?: string
  discount_type?: string
  status?: '已通过' | '待核验' | '未通过'
}

const PassengersPage: React.FC = () => {
  const [userId] = useState<number>(1)
  const [list, setList] = useState<Passenger[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Passenger | null>(null)
  const [confirmId, setConfirmId] = useState<number | null>(null)

  const fetchList = async () => {
    setLoading(true); setError('')
    try {
      const data = await listPassengers(userId)
      const arr = Array.isArray(data.passengers) ? data.passengers : []
      setList(arr as Passenger[])
    } catch {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchList() }, [])

  const filtered = useMemo(() => list, [list])

  const [formName, setFormName] = useState('')
  const [formPhone, setFormPhone] = useState('')
  const [formIdType, setFormIdType] = useState('二代居民身份证')
  const [formIdNumber, setFormIdNumber] = useState('')
  const [formDiscount, setFormDiscount] = useState('成人')

  const resetForm = () => {
    setFormName('')
    setFormPhone('')
    setFormIdType('二代居民身份证')
    setFormIdNumber('')
    setFormDiscount('成人')
  }

  const submitAdd = async () => {
    if (!formName) return
    await addPassenger({ userId, name: formName, phone: formPhone, id_card_type: formIdType, id_card_number: formIdNumber, discount_type: formDiscount })
    setShowAdd(false)
    resetForm()
    await fetchList()
  }

  const openEdit = (p: Passenger) => {
    setEditing(p)
    setFormName(p.name || '')
    setFormPhone(p.phone || '')
    setFormIdType(p.id_card_type || '二代居民身份证')
    setFormIdNumber(p.id_card_number || '')
    setFormDiscount(p.discount_type || '成人')
  }

  const submitEdit = async () => {
    if (!editing) return
    await updatePassenger(editing.id, { userId, name: formName, phone: formPhone, id_card_type: formIdType, id_card_number: formIdNumber, discount_type: formDiscount })
    setEditing(null)
    resetForm()
    await fetchList()
  }

  const submitDelete = async () => {
    if (confirmId == null) return
    await deletePassenger(confirmId, userId)
    setConfirmId(null)
    await fetchList()
  }

  return (
    <div className="passengers-page">
      <TopNavigation />
      <MainNavigation />
      <div className="page-wrapper">
        <div className="breadcrumb">
          <a href="javascript:;" className="crumb">我的12306</a>
          <span className="sep">&gt;</span>
          <span className="crumb current">乘车人</span>
        </div>

        <div className="tool-bar">
          <div className="tool-bar-inner">
            <div className="left-tools">
              <button className="primary" onClick={() => { resetForm(); setShowAdd(true) }}>新增乘车人</button>
              <button className="ghost" onClick={fetchList}>刷新</button>
            </div>
            <div className="right-tools">
              <input className="search" value={q} onChange={(e)=>setQ(e.target.value)} placeholder="姓名/手机号/证件号" />
              <button className="search-btn" onClick={async ()=>{ const kw = q.trim(); if (kw) { try { const data = await searchPassengers(userId, kw); const arr = Array.isArray(data.passengers)? data.passengers: []; setList(arr as Passenger[]) } catch {} } }}>搜索</button>
            </div>
          </div>
        </div>

        <div className="notice">
          <span className="notice-icon">i</span>
          <span className="notice-text">{' ${unlinkText} '}</span>
        </div>

        <div className="list-panel">
          {loading && (<div className="loading">加载中…</div>)}
          {error && (<div className="error">{error}</div>)}
          {!loading && !error && (
            <table className="table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>手机号</th>
                  <th>证件类型</th>
                  <th>证件号码</th>
                  <th>优惠类型</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="empty">暂无乘车人</td></tr>
                )}
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.phone || '-'}</td>
                    <td>{p.id_card_type || '-'}</td>
                    <td>{p.id_card_number || '-'}</td>
                    <td>{p.discount_type || '-'}</td>
                    <td>
                      {p.status === '已通过' && (<span className="tag pass">已通过</span>)}
                      {p.status === '待核验' && (<span className="tag pending">待核验</span>)}
                      {p.status === '未通过' && (<span className="tag fail">未通过</span>)}
                      {!p.status && (<span className="tag unknown">—</span>)}
                    </td>
                    <td>
                      <button className="link" onClick={() => openEdit(p)}>编辑</button>
                      <span className="split">|</span>
                      <button className="link danger" onClick={() => setConfirmId(p.id)}>删除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {showAdd && (
          <div className="dialog-mask" onClick={() => setShowAdd(false)}>
            <div className="dialog" onClick={(e)=>e.stopPropagation()}>
              <div className="dialog-hd">新增乘车人</div>
              <div className="dialog-bd">
                <div className="form-row"><label>姓名</label><input value={formName} onChange={(e)=>setFormName(e.target.value)} /></div>
                <div className="form-row"><label>手机号</label><input value={formPhone} onChange={(e)=>setFormPhone(e.target.value)} /></div>
                <div className="form-row"><label>证件类型</label>
                  <select value={formIdType} onChange={(e)=>setFormIdType(e.target.value)}>
                    <option>二代居民身份证</option>
                    <option>护照</option>
                    <option>港澳居民来往内地通行证</option>
                    <option>台湾居民来往大陆通行证</option>
                  </select>
                </div>
                <div className="form-row"><label>证件号码</label><input value={formIdNumber} onChange={(e)=>setFormIdNumber(e.target.value)} /></div>
                <div className="form-row"><label>优惠类型</label>
                  <select value={formDiscount} onChange={(e)=>setFormDiscount(e.target.value)}>
                    <option>成人</option>
                    <option>学生</option>
                    <option>儿童</option>
                  </select>
                </div>
              </div>
              <div className="dialog-ft">
                <button className="primary" onClick={submitAdd}>确 定</button>
                <button className="ghost" onClick={() => setShowAdd(false)}>取 消</button>
              </div>
            </div>
          </div>
        )}

        {editing && (
          <div className="dialog-mask" onClick={() => setEditing(null)}>
            <div className="dialog" onClick={(e)=>e.stopPropagation()}>
              <div className="dialog-hd">编辑乘车人</div>
              <div className="dialog-bd">
                <div className="form-row"><label>姓名</label><input value={formName} onChange={(e)=>setFormName(e.target.value)} /></div>
                <div className="form-row"><label>手机号</label><input value={formPhone} onChange={(e)=>setFormPhone(e.target.value)} /></div>
                <div className="form-row"><label>证件类型</label>
                  <select value={formIdType} onChange={(e)=>setFormIdType(e.target.value)}>
                    <option>二代居民身份证</option>
                    <option>护照</option>
                    <option>港澳居民来往内地通行证</option>
                    <option>台湾居民来往大陆通行证</option>
                  </select>
                </div>
                <div className="form-row"><label>证件号码</label><input value={formIdNumber} onChange={(e)=>setFormIdNumber(e.target.value)} /></div>
                <div className="form-row"><label>优惠类型</label>
                  <select value={formDiscount} onChange={(e)=>setFormDiscount(e.target.value)}>
                    <option>成人</option>
                    <option>学生</option>
                    <option>儿童</option>
                  </select>
                </div>
              </div>
              <div className="dialog-ft">
                <button className="primary" onClick={submitEdit}>保 存</button>
                <button className="ghost" onClick={() => setEditing(null)}>取 消</button>
              </div>
            </div>
          </div>
        )}

        {confirmId != null && (
          <div className="confirm-mask" onClick={() => setConfirmId(null)}>
            <div className="confirm" onClick={(e)=>e.stopPropagation()}>
              <div className="confirm-hd">删除确认</div>
              <div className="confirm-bd">确定要删除该乘车人吗？</div>
              <div className="confirm-ft">
                <button className="danger" onClick={submitDelete}>删 除</button>
                <button className="ghost" onClick={() => setConfirmId(null)}>取 消</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  )
}

export default PassengersPage