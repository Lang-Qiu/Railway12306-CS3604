import React from 'react';

interface SelectDropdownProps {
  options: { label: string; value: string | number; disabled?: boolean }[];
  value: string | number;
  onChange: (value: string | number) => void;
  disabled?: boolean;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({ options, value, onChange, disabled }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      disabled={disabled}
      style={{
        width: '100%',
        padding: '6px 10px',
        border: '1px solid #cccccc',
        borderRadius: '2px',
        fontSize: '14px',
        color: '#333',
        background: disabled ? '#f0f0f0' : 'white',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default SelectDropdown;
