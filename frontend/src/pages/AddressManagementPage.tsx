import React from 'react'
import TopNavigation from '../components/TopNavigation'
import SideMenu from '../components/SideMenu'
import AddressListTable from '../components/AddressListTable'
import AddressTips from '../components/AddressTips'

export default function AddressManagementPage() {
  return (
    <div style={{ backgroundColor: '#f5f5f5', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'none' }}>
        <TopNavigation showAddressLink={false} />
      </div>
      <div style={{ width: '1200px', margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '20px' }}>
        <div style={{ width: 240 }}>
          <SideMenu />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ display: 'none' }}>地址管理</h2>
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px' }}>
            <AddressListTable />
            <div style={{ marginTop: 16 }}>
              <AddressTips />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
