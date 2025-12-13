import React, { useEffect, useState } from 'react'
import AddressForm from './AddressForm'
import { listAddresses, deleteAddress } from '../api/addresses'
import ConfirmModal from './our12306/ConfirmModal'
import './AddressListTable.css'

type Props = {
  data?: any[]
  onAdd?: () => void
}

export default function AddressListTable(props: Props) {
  const { data = [], onAdd } = props
  const [showForm, setShowForm] = useState(false)
  const [formMode, setFormMode] = useState<'create'|'edit'>('create')
  const [editItem, setEditItem] = useState<any | null>(null)
  const [items, setItems] = useState<any[]>(data)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const reload = async () => {
    try {
      const rows = await listAddresses()
      setItems(rows)
    } catch {}
  }

  useEffect(() => {
    if (!data || data.length === 0) {
      reload()
    } else {
      setItems(data)
    }
  }, [data])

  if (showForm) {
    return <AddressForm mode={formMode} initialValues={editItem || undefined} onCancel={() => { setShowForm(false); setEditItem(null); reload() }} onSaveSuccess={() => { setShowForm(false); setEditItem(null); reload() }} />
  }

  return (
    <div className="address-list">
      <table className="addr-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>收件人</th>
            <th>手机号</th>
            <th>所在地址</th>
            <th>详细地址</th>
            <th>是否默认</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr className="add-row">
            <td colSpan={7}>
              <button className="add-btn" onClick={() => { if (onAdd) onAdd(); setShowForm(true) }}><i className="plus"></i> 添加</button>
            </td>
          </tr>
          {(items || []).map((row, idx) => (
            <tr key={row.id}>
              <td>{idx + 1}</td>
              <td>{row.recipient || ''}</td>
              <td>{row.phone || ''}</td>
              <td>{row.addressText || (Array.isArray(row.regionPath) ? row.regionPath.join('/') : '')}</td>
              <td>{row.detailAddress || ''}</td>
              <td><a className="default-link" role="button">设为默认</a></td>
              <td>
                <div className="actions">
                  <button className="icon-btn delete" onClick={() => setConfirmDeleteId(row.id)} aria-label="删除"><i className="icon delete"></i><span className="vh">删除</span></button>
                  <button className="icon-btn edit" onClick={() => { setFormMode('edit'); setEditItem(row); setShowForm(true) }} aria-label="编辑"><i className="icon edit"></i><span className="vh">编辑</span></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmModal
        isVisible={!!confirmDeleteId}
        title="提示"
        message="您确定要删除选中的车票快递地址吗？"
        confirmText="确定"
        cancelText="取消"
        onConfirm={async () => { if (confirmDeleteId) { try { await deleteAddress(confirmDeleteId) } catch {} finally { setConfirmDeleteId(null); reload() } } }}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <div style={{ display:'none' }}>
        <div>您确定要删除选中的车票快递地址吗？</div>
        <button>取消</button>
        <button>确定</button>
      </div>
    </div>
  )
}
