import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, PanResponder, Platform, StyleSheet, Text, View } from 'react-native';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  valueLabel?: string;
  disabled?: boolean;
}

export const SingleSlider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  minValue = 0,
  maxValue = 100,
  step = 1,
  label,
  showValue = true,
  valueLabel,
  disabled = false,
}) => {
  const theme = useTheme();
  const [localValue, setLocalValue] = useState(value);
  const [sliderWidth, setSliderWidth] = useState(Dimensions.get('window').width - 80);
  const sliderRef = useRef<View>(null);

  // Update local state when props change
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleValueChange = (newValue: number) => {
    // Round to nearest step
    const steppedValue = Math.round(newValue / step) * step;
    // Clamp to bounds
    const clampedValue = Math.max(minValue, Math.min(maxValue, steppedValue));
    
    setLocalValue(clampedValue);
    onValueChange(clampedValue);
  };

  const getValueLabel = () => {
    if (valueLabel) return valueLabel;
    return `${localValue}`;
  };

  const percentage = ((localValue - minValue) / (maxValue - minValue)) * 100;

  // Convert touch position to value with proper coordinate mapping
  const getValueFromTouchPosition = (touchX: number) => {
    // Clamp touch position to slider bounds
    const clampedX = Math.max(0, Math.min(touchX, sliderWidth));
    // Calculate percentage
    const touchPercentage = clampedX / sliderWidth;
    // Convert to value
    const newValue = minValue + touchPercentage * (maxValue - minValue);
    return newValue;
  };

  // Create pan responder for mobile touch handling
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => !disabled,
    onMoveShouldSetPanResponder: () => !disabled,
    onPanResponderGrant: (evt) => {
      if (disabled) return;
      
      // Use pageX for global coordinate, subtract slider offset
      sliderRef.current?.measure((x, y, width, height, pageX, pageY) => {
        const touchX = evt.nativeEvent.pageX - pageX;
        const newValue = getValueFromTouchPosition(touchX);
        handleValueChange(newValue);
      });
    },
    onPanResponderMove: (evt) => {
      if (disabled) return;
      
      // Use pageX for global coordinate, subtract slider offset  
      sliderRef.current?.measure((x, y, width, height, pageX, pageY) => {
        const touchX = evt.nativeEvent.pageX - pageX;
        const newValue = getValueFromTouchPosition(touchX);
        handleValueChange(newValue);
      });
    },
  });

  // Calculate thumb position more precisely
  const thumbPosition = (percentage / 100) * sliderWidth;
  const thumbLeft = Math.max(11, Math.min(sliderWidth - 11, thumbPosition));

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      
      <View style={styles.sliderContainer}>
        {Platform.OS === 'web' ? (
          <>
            <input
              type="range"
              min={minValue}
              max={maxValue}
              step={step}
              value={localValue}
              onChange={(e) => handleValueChange(Number(e.target.value))}
              disabled={disabled}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: `linear-gradient(to right, ${theme.colors.primary} 0%, ${theme.colors.primary} ${percentage}%, ${theme.colors.border} ${percentage}%, ${theme.colors.border} 100%)`,
                outline: 'none',
                opacity: disabled ? 0.5 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none',
              }}
            />
            
            {/* Custom CSS for web range input */}
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: ${theme.colors.primary};
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                border: 2px solid ${theme.colors.background};
              }
              
              input[type="range"]::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: ${theme.colors.primary};
                cursor: pointer;
                border: 2px solid ${theme.colors.background};
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              
              input[type="range"]::-ms-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: ${theme.colors.primary};
                cursor: pointer;
                border: 2px solid ${theme.colors.background};
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
              }
              
              input[type="range"]:disabled::-webkit-slider-thumb {
                opacity: 0.5;
                cursor: not-allowed;
              }
              
              input[type="range"]:disabled::-moz-range-thumb {
                opacity: 0.5;
                cursor: not-allowed;
              }
              
              input[type="range"]:disabled::-ms-thumb {
                opacity: 0.5;
                cursor: not-allowed;
              }
            `}</style>
          </>
        ) : (
          // Interactive native slider implementation
          <View 
            ref={sliderRef}
            style={[styles.nativeSliderContainer, { opacity: disabled ? 0.5 : 1 }]}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              setSliderWidth(width);
            }}
            {...panResponder.panHandlers}
          >
            <View style={[styles.track, { backgroundColor: theme.colors.border }]}>
              <View 
                style={[
                  styles.trackFill,
                  { 
                    backgroundColor: theme.colors.primary,
                    width: `${percentage}%`,
                  }
                ]}
              />
              <View 
                style={[
                  styles.thumb,
                  { 
                    backgroundColor: theme.colors.primary,
                    left: thumbLeft - 11, // Use calculated position with offset
                    shadowColor: theme.colors.primary,
                    borderColor: theme.colors.background,
                  }
                ]}
              />
            </View>
          </View>
        )}
        
        {showValue && (
          <View style={styles.valueContainer}>
            <Text style={[styles.valueText, { color: theme.colors.primary }]}>
              {getValueLabel()}
            </Text>
          </View>
        )}
      </View>
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
  },
  nativeSliderContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: getResponsiveSpacing('md'), // Add padding for touch area
    paddingHorizontal: getResponsiveSpacing('sm'),
  },
  track: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    position: 'relative',
  },
  trackFill: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    position: 'absolute',
    top: -8,
    marginLeft: -11,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  valueContainer: {
    marginTop: getResponsiveSpacing('xs'),
  },
  valueText: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: '600',
    textAlign: 'center',
  },
}); 