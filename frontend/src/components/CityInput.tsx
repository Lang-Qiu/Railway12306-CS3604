import React, { useState, useRef, useEffect } from 'react';
import './CS3604_12306/StationInput.css'; // 复用StationInput的样式
import { searchStations, Station } from '../services/CS3604_12306/stationService';
import StationPicker from './StationPicker';
import SearchDropdown from './CS3604_12306/SearchDropdown';

interface CityInputProps {
  value: string;
  placeholder: string;
  type: 'departure' | 'arrival';
  onChange: (value: string) => void;
  onSelect: (city: string) => void;
}

/**
 * 城市输入组件
 * 复用StationInput的交互逻辑，使用StationPicker和SearchDropdown
 */
const CityInput: React.FC<CityInputProps> = ({
  value,
  placeholder,
  type: _type,
  onChange,
  onSelect,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Station[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close picker/suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (v: string) => {
    try {
      const results = await searchStations(v);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    }
  };

  const handleFocus = () => {
    if (!value) {
      setShowPicker(true);
      setShowSuggestions(false);
    } else {
      setShowSuggestions(true);
      setShowPicker(false);
      if (suggestions.length === 0) {
        handleSearch(value);
      }
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    
    if (!v.trim()) {
      setShowSuggestions(false);
      setShowPicker(true);
      return;
    }

    setShowPicker(false);
    setShowSuggestions(true);
    handleSearch(v);
  };

  const pick = (station: string) => {
    onSelect(station);
    setShowPicker(false);
    setShowSuggestions(false);
  };

  return (
    <div className="station-input" ref={containerRef}>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onFocus={handleFocus}
        className="station-input-field"
      />
      
      {showPicker && (
        <StationPicker 
          onSelect={pick} 
          onClose={() => setShowPicker(false)}
        />
      )}

      {showSuggestions && (
        <SearchDropdown 
          keyword={value}
          results={suggestions}
          onSelect={pick}
        />
      )}
    </div>
  );
};

export default CityInput;

