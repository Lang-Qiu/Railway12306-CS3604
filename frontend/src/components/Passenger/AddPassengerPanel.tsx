import React from 'react';
import PassengerForm, { PassengerFormData } from './PassengerForm';
import './AddPassengerPanel.css';

interface AddPassengerPanelProps {
  onSubmit: (passengerData: any) => void;
  onCancel: () => void;
}

const AddPassengerPanel: React.FC<AddPassengerPanelProps> = ({
  onSubmit,
  onCancel
}) => {
  const handleSubmit = async (data: PassengerFormData) => {
    await onSubmit(data);
  };

  return (
    <div className="add-passenger-panel">
      <PassengerForm
        mode="add"
        onSubmit={handleSubmit}
        onCancel={onCancel}
      />
    </div>
  );
};

export default AddPassengerPanel;

