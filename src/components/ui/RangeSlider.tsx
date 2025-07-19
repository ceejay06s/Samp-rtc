import React, { useEffect, useRef, useState } from 'react';
import { PanResponder, Platform, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface RangeSliderProps {
  minValue: number;    // Current selected min value (from Supabase)
  maxValue: number;    // Current selected max value (from Supabase)
  onValueChange: (min: number, max: number) => void;
  step?: number;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
  showValues?: boolean;
  minRange?: number;   // Slider minimum boundary (like HTML input min)
  maxRange?: number;   // Slider maximum boundary (like HTML input max)
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  minValue,
  maxValue,
  onValueChange,
  step = 1,
  label,
  minLabel,
  maxLabel,
  showValues = false,
  minRange = 0,
  maxRange = 100,
  disabled = false,
  containerStyle,
}) => {
  const theme = useTheme();
  const [localValues, setLocalValues] = useState<[number, number]>([minValue, maxValue]);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);
  const [sliderWidth, setSliderWidth] = useState(300);
  const sliderRef = useRef<View>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalValues(prev => {
      if (prev[0] !== minValue || prev[1] !== maxValue) {
        return [minValue, maxValue];
      }
      return prev;
    });
  }, [minValue, maxValue]);

  const handleValuesChange = (low: number, high: number) => {
    const newValues: [number, number] = [low, high];
    setLocalValues(newValues);
    onValueChange(low, high);
  };

  const getValueLabel = (value: number, isMin: boolean) => {
    if (isMin && minLabel) return minLabel;
    if (!isMin && maxLabel) return maxLabel;
    return `${value}`;
  };

  // Calculate position from value
  const getPositionFromValue = (value: number) => {
    return ((value - minRange) / (maxRange - minRange)) * sliderWidth;
  };

  // Calculate value from position
  const getValueFromPosition = (position: number) => {
    const ratio = position / sliderWidth;
    const value = minRange + ratio * (maxRange - minRange);
    return Math.round(value / step) * step;
  };

  // Clamp value to valid range
  const clampValue = (value: number, isMin: boolean) => {
    if (isMin) {
      return Math.max(minRange, Math.min(value, localValues[1] - step));
    } else {
      return Math.min(maxRange, Math.max(value, localValues[0] + step));
    }
  };

  // Web implementation
  if (Platform.OS === 'web') {
    const handleWebTouchStart = (thumbType: 'min' | 'max') => {
      if (disabled) return;
      
      setActiveThumb(thumbType);
      
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const rect = (sliderRef.current as any)?.getBoundingClientRect();
        if (!rect) return;
        
        const position = moveEvent.clientX - rect.left;
        const clampedPosition = Math.max(0, Math.min(position, sliderWidth));
        const newValue = getValueFromPosition(clampedPosition);
        const clampedValue = clampValue(newValue, thumbType === 'min');
        
        if (thumbType === 'min') {
          handleValuesChange(clampedValue, localValues[1]);
        } else {
          handleValuesChange(localValues[0], clampedValue);
        }
      };
      
      const handleMouseUp = () => {
        setActiveThumb(null);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    const minPosition = getPositionFromValue(localValues[0]);
    const maxPosition = getPositionFromValue(localValues[1]);

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: theme.colors.text }]}>
            {label}
          </Text>
        )}
        
        <View style={styles.sliderContainer}>
          <View 
            ref={sliderRef}
            style={[styles.webSliderWrapper]}
            onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
          >
            {/* Track background */}
            <View style={[styles.track, { backgroundColor: theme.colors.border }]} />
            
            {/* Active track */}
            <View
              style={[
                styles.activeTrack,
                {
                  backgroundColor: theme.colors.primary,
                  left: minPosition,
                  width: maxPosition - minPosition,
                }
              ]}
            />
            
            {/* Min thumb */}
            <TouchableOpacity
              style={[
                styles.thumb,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.background,
                  left: minPosition - 11,
                  transform: [{ scale: activeThumb === 'min' ? 1.2 : 1 }],
                  opacity: disabled ? 0.5 : 1,
                }
              ]}
              onPress={() => handleWebTouchStart('min')}
              activeOpacity={0.8}
              disabled={disabled}
            />
            
            {/* Max thumb */}
            <TouchableOpacity
              style={[
                styles.thumb,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.background,
                  left: maxPosition - 11,
                  transform: [{ scale: activeThumb === 'max' ? 1.2 : 1 }],
                  opacity: disabled ? 0.5 : 1,
                }
              ]}
              onPress={() => handleWebTouchStart('max')}
              activeOpacity={0.8}
              disabled={disabled}
            />
          </View>
        </View>
        
        {showValues && (
          <View style={styles.valueContainer}>
            <View style={styles.valueItem}>
              <Text style={[styles.valueLabel, { color: theme.colors.textSecondary }]}>
                Min
              </Text>
              <Text style={[styles.valueText, { color: theme.colors.text }]}>
                {getValueLabel(localValues[0], true)}
              </Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={[styles.valueLabel, { color: theme.colors.textSecondary }]}>
                Max
              </Text>
              <Text style={[styles.valueText, { color: theme.colors.text }]}>
                {getValueLabel(localValues[1], false)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  }

  // Native implementation
  const handleResponderGrant = (thumbType: 'min' | 'max') => {
    if (disabled) return;
    setActiveThumb(thumbType);
  };

  const handlePanResponderMove = (evt: any, gestureState: any, thumbType: 'min' | 'max') => {
    const rect = (sliderRef.current as any)?.measure;
    if (!rect) return;
    
    const position = gestureState.moveX;
    const clampedPosition = Math.max(0, Math.min(position, sliderWidth));
    const newValue = getValueFromPosition(clampedPosition);
    const clampedValue = clampValue(newValue, thumbType === 'min');
    
    if (thumbType === 'min') {
      handleValuesChange(clampedValue, localValues[1]);
    } else {
      handleValuesChange(localValues[0], clampedValue);
    }
  };

  const handleResponderRelease = () => {
    setActiveThumb(null);
  };

  const minPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => handleResponderGrant('min'),
    onPanResponderMove: (evt, gestureState) => handlePanResponderMove(evt, gestureState, 'min'),
    onPanResponderRelease: handleResponderRelease,
    onPanResponderTerminate: handleResponderRelease,
  });

  const maxPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: () => handleResponderGrant('max'),
    onPanResponderMove: (evt, gestureState) => handlePanResponderMove(evt, gestureState, 'max'),
    onPanResponderRelease: handleResponderRelease,
    onPanResponderTerminate: handleResponderRelease,
  });

  const minPosition = getPositionFromValue(localValues[0]);
  const maxPosition = getPositionFromValue(localValues[1]);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      
      <View style={styles.sliderContainer}>
        <View 
          ref={sliderRef}
          style={[styles.nativeSliderWrapper]}
          onLayout={(e) => setSliderWidth(e.nativeEvent.layout.width)}
        >
          {/* Track background */}
          <View style={[styles.track, { backgroundColor: theme.colors.border }]} />
          
          {/* Active track */}
          <View
            style={[
              styles.activeTrack,
              {
                backgroundColor: theme.colors.primary,
                left: minPosition,
                width: maxPosition - minPosition,
              }
            ]}
          />
          
          {/* Min thumb */}
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.background,
                left: minPosition - 11,
                transform: [{ scale: activeThumb === 'min' ? 1.2 : 1 }],
                opacity: disabled ? 0.5 : 1,
              }
            ]}
            {...minPanResponder.panHandlers}
          />
          
          {/* Max thumb */}
          <View
            style={[
              styles.thumb,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.background,
                left: maxPosition - 11,
                transform: [{ scale: activeThumb === 'max' ? 1.2 : 1 }],
                opacity: disabled ? 0.5 : 1,
              }
            ]}
            {...maxPanResponder.panHandlers}
          />
        </View>
      </View>
      
      {showValues && (
        <View style={styles.valueContainer}>
          <View style={styles.valueItem}>
            <Text style={[styles.valueLabel, { color: theme.colors.textSecondary }]}>
              Min
            </Text>
            <Text style={[styles.valueText, { color: theme.colors.text }]}>
              {getValueLabel(localValues[0], true)}
            </Text>
          </View>
          <View style={styles.valueItem}>
            <Text style={[styles.valueLabel, { color: theme.colors.textSecondary }]}>
              Max
            </Text>
            <Text style={[styles.valueText, { color: theme.colors.text }]}>
              {getValueLabel(localValues[1], false)}
            </Text>
          </View>
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
    alignItems: 'center',
    marginBottom: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('lg'),
    flex: 1,
  },
  webSliderWrapper: {
    position: 'relative',
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  nativeSliderWrapper: {
    position: 'relative',
    height: 40,
    justifyContent: 'center',
    width: '100%',
  },
  track: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    width: '100%',
    top: 17,
  },
  activeTrack: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    top: 17,
  },
  thumb: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    top: 6,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: getResponsiveSpacing('sm'),
  },
  valueItem: {
    alignItems: 'center',
  },
  valueLabel: {
    fontSize: getResponsiveFontSize('xs'),
    fontWeight: '500',
    marginBottom: 2,
  },
  valueText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
  },
}); 