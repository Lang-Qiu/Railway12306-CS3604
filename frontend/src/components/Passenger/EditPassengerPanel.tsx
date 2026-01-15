import React from 'react';
import PassengerForm, { PassengerFormData } from './PassengerForm';
import './EditPassengerPanel.css';

interface EditPassengerPanelProps {
  passenger: any;
  onSubmit: (passengerData: any) => void;
  onCancel: () => void;
}

const EditPassengerPanel: React.FC<EditPassengerPanelProps> = ({
  passenger,
  onSubmit,
  onCancel
}) => {
  const handleSubmit = async (data: PassengerFormData) => {
    // 传递所有字段，包括不可编辑的字段，以避免数据丢失
    await onSubmit({
      name: passenger.name,
      idCardType: passenger.idCardType || passenger.id_card_type,
      idCardNumber: passenger.idCardNumber || passenger.id_card_number,
      phone: data.phone,
      discountType: data.discountType
    });
  };

  return (
    <div className="edit-passenger-panel">
      <PassengerForm
        mode="edit"
        initialData={{
          name: passenger.name,
          idCardType: passenger.idCardType || passenger.id_card_type,
          idCardNumber: passenger.idCardNumber || passenger.id_card_number,
          phone: passenger.phone,
          discountType: passenger.discountType || passenger.discount_type
        }}
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
    </div>
  );
};

export default EditPassengerPanel;

