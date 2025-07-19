import React from 'react';
import { GENDER_OPTIONS } from '../../services/genderService';
import { Dropdown, DropdownOption } from './Dropdown';

interface GenderDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const GenderDropdown: React.FC<GenderDropdownProps> = ({
  value,
  onValueChange,
  error,
  label = 'Gender',
  placeholder = 'Select your gender',
  disabled = false,
}) => {
  // Convert gender options to dropdown options
  const dropdownOptions: DropdownOption[] = GENDER_OPTIONS.map(option => ({
    label: option.label,
    value: option.value,
  }));

  return (
    <Dropdown
      options={dropdownOptions}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      error={error}
      label={label}
      disabled={disabled}
    />
  );
}; 