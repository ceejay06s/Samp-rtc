import Slider from '@react-native-community/slider';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface RangeSliderProps {
  minValue: number;
  maxValue: number;
  onValueChange: (min: number, max: number) => void;
  step?: number;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
  showValues?: boolean;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  minValue,
  maxValue,
  onValueChange,
  step = 1,
  label,
  minLabel,
  maxLabel,
  showValues = true,
}) => {
  const theme = useTheme();

  const handleMinValueChange = (value: number) => {
    const newMin = Math.min(value, maxValue - step);
    onValueChange(newMin, maxValue);
  };

  const handleMaxValueChange = (value: number) => {
    const newMax = Math.max(value, minValue + step);
    onValueChange(minValue, newMax);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <Slider
            style={styles.slider}
            minimumValue={18}
            maximumValue={100}
            value={minValue}
            onValueChange={handleMinValueChange}
            step={step}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <Slider
            style={[styles.slider, styles.maxSlider]}
            minimumValue={18}
            maximumValue={100}
            value={maxValue}
            onValueChange={handleMaxValueChange}
            step={step}
            minimumTrackTintColor="transparent"
            maximumTrackTintColor={theme.colors.primary}
            thumbTintColor={theme.colors.primary}
          />
        </View>
      </View>

      {showValues && (
        <View style={styles.valueContainer}>
          <Text style={[styles.valueText, { color: theme.colors.textSecondary }]}>
            {minLabel || `${minValue} years`}
          </Text>
          <Text style={[styles.valueText, { color: theme.colors.textSecondary }]}>
            {maxLabel || `${maxValue} years`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: getResponsiveSpacing('sm'),
  },
  label: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    marginBottom: getResponsiveSpacing('sm'),
  },
  sliderContainer: {
    position: 'relative',
    height: 40,
  },
  sliderTrack: {
    position: 'relative',
  },
  slider: {
    position: 'absolute',
    width: '100%',
    height: 40,
  },
  maxSlider: {
    zIndex: 1,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  track: {
    height: 4,
    borderRadius: 2,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveSpacing('xs'),
  },
  valueText: {
    fontSize: getResponsiveFontSize('sm'),
  },
}); 