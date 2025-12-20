import React, { useState, useEffect } from 'react';
import SideMenu from '../components/SideMenu';
import { Passenger, listPassengers, searchPassengers, addPassenger, updatePassenger, deletePassenger } from '../api/passengers';
import './PassengersPage.css';

const PassengersPage: React.FC = () => {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassenger, setCurrentPassenger] = useState<Passenger | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<Passenger>>({
    name: '',
    phone: '',
    idCardType: '二代居民身份证',
    idCardNumber: '',
    discountType: '成人'
  });

  const userId = 1; // TODO: Get from auth context

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    setLoading(true);
    try {
      const data = await listPassengers(userId);
      setPassengers(data);
    } catch (error) {
      console.error('Failed to fetch passengers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const data = await searchPassengers(userId, searchQuery);
        setPassengers(data);
      } else {
        await fetchPassengers();
      }
    } catch (error) {
      console.error('Failed to search passengers', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      await addPassenger({ ...formData, userId });
      setShowAddModal(false);
      setFormData({
        name: '',
        phone: '',
        idCardType: '二代居民身份证',
        idCardNumber: '',
        discountType: '成人'
      });
      fetchPassengers();
    } catch (error) {
      console.error('Failed to add passenger', error);
    }
  };

  const handleUpdate = async () => {
    if (!currentPassenger) return;
    try {
      await updatePassenger(currentPassenger.id, { ...formData, userId });
      setShowEditModal(false);
      setCurrentPassenger(null);
      fetchPassengers();
    } catch (error) {
      console.error('Failed to update passenger', error);
    }
  };

  const handleDelete = async () => {
    if (!currentPassenger) return;
    try {
      await deletePassenger(currentPassenger.id, userId);
      setShowDeleteModal(false);
      setCurrentPassenger(null);
      fetchPassengers();
    } catch (error) {
      console.error('Failed to delete passenger', error);
    }
  };

  const openEditModal = (passenger: Passenger) => {
    setCurrentPassenger(passenger);
    setFormData({
      name: passenger.name,
      phone: passenger.phone,
      idCardType: passenger.idCardType,
      idCardNumber: passenger.idCardNumber,
      discountType: passenger.discountType
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (passenger: Passenger) => {
    setCurrentPassenger(passenger);
    setShowDeleteModal(true);
  };

  return (
    <div className="passengers-page">
      <div className="content-wrapper">
        <div className="breadcrumb">
          当前位置：个人中心 &gt; 常用联系人
        </div>
        
        <div className="main-content">
          <SideMenu activeMenu="passengers" />
          
          <div className="right-panel">
            <div className="panel-header">
              <h2>乘车人</h2>
            </div>

            <div className="toolbar">
              <div className="search-box">
                <input 
                  type="text" 
                  placeholder="姓名/手机号/证件号" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn-search" onClick={handleSearch}>搜索</button>
              </div>
              <div className="actions">
                <button className="btn-add" onClick={() => setShowAddModal(true)}>+ 新增乘车人</button>
                <button className="btn-refresh" onClick={fetchPassengers}>刷新</button>
              </div>
            </div>

            <table className="passenger-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>姓名</th>
                  <th>证件类型</th>
                  <th>证件号码</th>
                  <th>手机号</th>
                  <th>旅客类型</th>
                  <th>核验状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {passengers.map((p, index) => (
                  <tr key={p.id}>
                    <td>{index + 1}</td>
                    <td>{p.name}</td>
                    <td>{p.idCardType}</td>
                    <td>{p.idCardNumber}</td>
                    <td>{p.phone}</td>
                    <td>{p.discountType}</td>
                    <td>
                      <span className={`status ${p.verificationStatus === '已通过' ? 'passed' : 'pending'}`}>
                        {p.verificationStatus}
                      </span>
                    </td>
                    <td>
                      <button className="btn-link" onClick={() => openEditModal(p)}>编辑</button>
                      <button className="btn-link" onClick={() => openDeleteModal(p)}>删除</button>
                    </td>
                  </tr>
                ))}
                {passengers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="empty-text">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="tips-panel">
              <h3>温馨提示：</h3>
              <p>1. 身份证件有效期过期前6个月，或过期后6个月内，可办理"身份证件有效期核验"。</p>
              <p>2. 请确保您的联系方式畅通，以便及时接收购票信息。</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>新增乘车人</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>姓名：</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>证件类型：</label>
                <select 
                  value={formData.idCardType} 
                  onChange={e => setFormData({...formData, idCardType: e.target.value})}
                >
                  <option value="二代居民身份证">二代居民身份证</option>
                  <option value="护照">护照</option>
                  <option value="港澳居民来往内地通行证">港澳居民来往内地通行证</option>
                  <option value="台湾居民来往大陆通行证">台湾居民来往大陆通行证</option>
                </select>
              </div>
              <div className="form-group">
                <label>证件号码：</label>
                <input 
                  type="text" 
                  value={formData.idCardNumber} 
                  onChange={e => setFormData({...formData, idCardNumber: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>手机号：</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>旅客类型：</label>
                <select 
                  value={formData.discountType} 
                  onChange={e => setFormData({...formData, discountType: e.target.value})}
                >
                  <option value="成人">成人</option>
                  <option value="儿童">儿童</option>
                  <option value="学生">学生</option>
                  <option value="残疾军人">残疾军人</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowAddModal(false)}>取 消</button>
              <button className="btn-confirm" onClick={handleAdd}>确 定</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>编辑乘车人</h3>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Similar fields as Add */}
              <div className="form-group">
                <label>姓名：</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              {/* ... other fields ... reusing for brevity in first pass, should componentize */}
               <div className="form-group">
                <label>证件类型：</label>
                <select 
                  value={formData.idCardType} 
                  onChange={e => setFormData({...formData, idCardType: e.target.value})}
                >
                  <option value="二代居民身份证">二代居民身份证</option>
                  <option value="护照">护照</option>
                </select>
              </div>
              <div className="form-group">
                <label>证件号码：</label>
                <input 
                  type="text" 
                  value={formData.idCardNumber} 
                  onChange={e => setFormData({...formData, idCardNumber: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>手机号：</label>
                <input 
                  type="text" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>旅客类型：</label>
                <select 
                  value={formData.discountType} 
                  onChange={e => setFormData({...formData, discountType: e.target.value})}
                >
                  <option value="成人">成人</option>
                  <option value="儿童">儿童</option>
                  <option value="学生">学生</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>取 消</button>
              <button className="btn-confirm" onClick={handleUpdate}>确 定</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal small">
            <div className="modal-header">
              <h3>删除确认</h3>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>您确定要删除该乘车人吗？</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>取 消</button>
              <button className="btn-confirm" onClick={handleDelete}>确 定</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengersPage;
