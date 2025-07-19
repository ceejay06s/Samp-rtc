import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GENDER_OPTIONS, GENDER_PREFERENCE_OPTIONS } from '../../services/genderService';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface GenderSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  label?: string;
  type?: 'gender' | 'preference';
  multiple?: boolean;
  selectedValues?: string[];
  onValuesChange?: (values: string[]) => void;
}

export const GenderSelector: React.FC<GenderSelectorProps> = ({
  value,
  onValueChange,
  error,
  label = 'Gender',
  type = 'gender',
  multiple = false,
  selectedValues = [],
  onValuesChange,
}) => {
  const theme = useTheme();
  
  const options = type === 'gender' ? GENDER_OPTIONS : GENDER_PREFERENCE_OPTIONS;

  const handleOptionPress = (optionValue: string) => {
    if (multiple && onValuesChange) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter(v => v !== optionValue)
        : [...selectedValues, optionValue];
      onValuesChange(newValues);
    } else {
      onValueChange(optionValue);
    }
  };

  const isSelected = (optionValue: string) => {
    if (multiple) {
      return selectedValues.includes(optionValue);
    }
    return value === optionValue;
  };

  const renderOption = (option: { value: string; label: string }) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              {
                backgroundColor: isSelected(option.value) 
                  ? theme.colors.primary 
                  : theme.colors.surface,
                borderColor: theme.colors.border,
              }
            ]}
            onPress={() => handleOptionPress(option.value)}
          >
            <Text style={[
              styles.optionText,
              { 
                color: isSelected(option.value) 
                  ? 'white' 
                  : theme.colors.text 
              }
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      ) : null}
      
      <View style={styles.optionsContainer}>
        {options.map(renderOption)}
      </View>
      
      {error ? (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: getResponsiveSpacing('md'),
  },
  label: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    paddingVertical: getResponsiveSpacing('sm'),
    paddingHorizontal: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
    borderWidth: 1,
    minWidth: 80,
    alignItems: 'center',
    marginRight: getResponsiveSpacing('sm'),
    marginBottom: getResponsiveSpacing('sm'),
  },
  optionText: {
    fontSize: getResponsiveFontSize('sm'),
    fontWeight: '500',
    textAlign: 'center',
  },
  errorText: {
    fontSize: getResponsiveFontSize('sm'),
    marginTop: getResponsiveSpacing('xs'),
  },
}); 