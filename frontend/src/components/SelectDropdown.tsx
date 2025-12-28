import React from 'react';

interface SelectDropdownProps {
  options: ({ label: string; value: string | number; disabled?: boolean } | string)[];
  value: string | number;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  placeholder?: string;
  testId?: string;
}

const SelectDropdown: React.FC<SelectDropdownProps> = ({ options, value, onChange, disabled, placeholder, testId }) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      disabled={disabled}
      data-testid={testId}
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
      {placeholder && (
         <option value="" disabled hidden>
           {placeholder}
         </option>
      )}
      {options.map((opt) => {
        const optionValue = typeof opt === 'string' ? opt : opt.value;
        const optionLabel = typeof opt === 'string' ? opt : opt.label;
        const optionDisabled = typeof opt === 'string' ? false : opt.disabled;
        
        return (
          <option key={optionValue} value={optionValue} disabled={optionDisabled}>
            {optionLabel}
          </option>
        );
      })}
    </select>
  );
};

export default SelectDropdown;
