import React, { useEffect, useState } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';

import OrderSubmitSection from '../components/OrderSubmitSection';
import TrainInfoSection, { TrainData } from '../components/TrainInfoSection';
import PassengerInfoSection from '../components/PassengerInfoSection';
import ConfirmModal from '../components/ConfirmModal';
import OrderConfirmationModal from '../components/OrderConfirmationModal';

import { listPassengers } from '../api/passengers';
import { createOrder } from '../api/orders';
import { Passenger } from '../api/passengers';
import { syncService } from '../services/SyncService';

const OrderPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const state = location.state as { train: TrainData; date: string } | null;
  const train = state?.train;
  const date = state?.date;

  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  // Store seat type selection for each passenger: { passengerId: seatTypeString }
  const [seatSelections, setSeatSelections] = useState<{[key: number]: string}>({});
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showOrderConfirmModal, setShowOrderConfirmModal] = useState(false);

  useEffect(() => {
    if (!train) {
      alert('车次信息缺失，请重新选择');
      navigate('/trains');
      return;
    }

    // Fetch passengers for userId 1
    listPassengers(1).then(data => {
      if (Array.isArray(data)) {
        setPassengers(data);
      }
    });

    syncService.connect();
    const unsubscribe = syncService.subscribe((event) => {
      setPassengers(prev => {
        if (event.type === 'PASSENGER_UPDATED') {
          const updatedPassenger = event.payload;
          const index = prev.findIndex(p => p.id === updatedPassenger.id);
          if (index !== -1) {
            const newPassengers = [...prev];
            newPassengers[index] = updatedPassenger;
            return newPassengers;
          }
          return prev;
        } else if (event.type === 'PASSENGER_ADDED') {
          return [event.payload, ...prev];
        } else if (event.type === 'PASSENGER_DELETED') {
          return prev.filter(p => p.id !== event.payload.id);
        }
        return prev;
      });
    });
    return unsubscribe;
  }, [train, navigate]);

  const handleTogglePassenger = (id: number) => {
    setSelectedIds(prev => {
      const isSelected = prev.includes(id);
      if (isSelected) {
        const newSelections = { ...seatSelections };
        delete newSelections[id];
        setSeatSelections(newSelections);
        return prev.filter(pid => pid !== id);
      } else {
        // Default seat type selection (e.g., Second Class or first available)
        const defaultSeat = train?.prices?.secondClass ? '二等座' : (Object.keys(train?.prices || {})[0] || '');
        setSeatSelections(prevSel => ({ ...prevSel, [id]: defaultSeat }));
        return [...prev, id];
      }
    });
  };

  const handleSeatChange = (passengerId: number, seatType: string) => {
    setSeatSelections(prev => ({ ...prev, [passengerId]: seatType }));
  };

  const handleSubmit = () => {
    if (selectedIds.length === 0) {
      setShowConfirmModal(true);
      return;
    }
    setShowOrderConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!train) return;

    try {
      const seatTypeMap: {[key: string]: number} = {
        '二等座': 1,
        '一等座': 2,
        '商务座': 3,
        '无座': 4
      };
      
      const passengerData = selectedIds.map(pid => ({
        passengerId: pid,
        seatTypeId: seatTypeMap[seatSelections[pid]] || 1 
      }));

      const trainId = train.trainNo === 'G27' ? 1 : 1; // Fallback to 1 for testing

      const res = await createOrder({
        userId: 1,
        trainId: trainId,
        passengers: passengerData
      });

      if (res.success) {
        alert('订单创建成功！订单号: ' + res.orderId);
        setShowOrderConfirmModal(false);
        // Navigate to success page or order history
        navigate(`/pay/${res.orderId}`); 
      } else {
        alert('订单创建失败: ' + res.message);
      }
    } catch (err) {
      console.error(err);
      alert('订单创建失败');
    }
  };

  const availableSeatTypes = train ? [
    { label: `商务座（¥${train.prices?.business || '--'}）`, value: '商务座', price: train.prices?.business },
    { label: `一等座（¥${train.prices?.firstClass || '--'}）`, value: '一等座', price: train.prices?.firstClass },
    { label: `二等座（¥${train.prices?.secondClass || '--'}）`, value: '二等座', price: train.prices?.secondClass },
    { label: `无座（¥${train.prices?.noSeat || '--'}）`, value: '无座', price: train.prices?.noSeat },
  ].filter(s => s.price !== undefined && s.price !== null) : [];

  return (
    <div className="order-page" style={{ backgroundColor: 'white', padding: '0 20px' }}>
      <TrainInfoSection train={train} date={date} />
      <PassengerInfoSection 
        passengers={passengers} 
        selectedIds={selectedIds} 
        onToggle={handleTogglePassenger} 
        seatOptions={availableSeatTypes}
        seatSelections={seatSelections}
        onSeatChange={handleSeatChange}
      />
      <OrderSubmitSection onSubmit={handleSubmit} onBack={() => navigate(-1)} />
      
      <ConfirmModal 
        isOpen={showConfirmModal} 
        message="请选择乘车人！" 
        onConfirm={() => setShowConfirmModal(false)} 
      />
      <OrderConfirmationModal 
        isOpen={showOrderConfirmModal} 
        onClose={() => setShowOrderConfirmModal(false)} 
        onConfirm={handleConfirmOrder} 
        train={train}
        date={date}
        passengers={passengers.filter(p => selectedIds.includes(p.id))}
        seatSelections={seatSelections}
      />
    </div>
  );
};

export default OrderPage;
