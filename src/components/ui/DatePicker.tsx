import DateTimePicker from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePlatform } from '../../hooks/usePlatform';
import { useTheme } from '../../utils/themes';

interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  error?: string;
  maximumDate?: Date;
  minimumDate?: Date;
  mode?: 'date' | 'time' | 'datetime';
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  error,
  maximumDate,
  minimumDate,
  mode = 'date',
}) => {
  const theme = useTheme();
  const { isWeb, isDesktopBrowser } = usePlatform();
  const [showPicker, setShowPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const formatDate = (date: Date): string => {
    if (mode === 'date') {
      return date.toLocaleDateString();
    } else if (mode === 'time') {
      return date.toLocaleTimeString();
    } else {
      return date.toLocaleString();
    }
  };

  const getDisplayValue = (): string => {
    if (!value) return placeholder;
    return formatDate(value);
  };

  // Web-specific date input handler
  const handleWebDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const dateString = event.target.value;
    if (dateString) {
      const newDate = new Date(dateString);
      onChange(newDate);
    }
  };

  // Format date for HTML input (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Web version using HTML input
  if (isWeb) {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.input,
            {
              borderColor: error ? theme.colors.error : theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <input
            type="date"
            value={value ? formatDateForInput(value) : ''}
            onChange={handleWebDateChange}
            style={{
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              fontSize: 16,
              color: theme.colors.text,
              width: '100%',
              padding: 0,
              fontFamily: 'inherit',
            }}
            max={maximumDate ? formatDateForInput(maximumDate) : undefined}
            min={minimumDate ? formatDateForInput(minimumDate) : undefined}
          />
        </View>

        {error && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}
      </View>
    );
  }

  // Mobile version using React Native DateTimePicker
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.input,
          {
            borderColor: error ? theme.colors.error : theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.text,
            {
              color: value ? theme.colors.text : theme.colors.textSecondary,
            },
          ]}
        >
          {getDisplayValue()}
        </Text>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      {showPicker && (
        <DateTimePicker
          value={value || new Date()}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          style={styles.picker}
        />
      )}

      {Platform.OS === 'ios' && showPicker && (
        <View style={styles.iosButtonContainer}>
          <TouchableOpacity
            style={[styles.iosButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => setShowPicker(false)}
          >
            <Text style={[styles.iosButtonText, { color: 'white' }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  text: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  picker: {
    width: Platform.OS === 'ios' ? '100%' : 0,
    height: Platform.OS === 'ios' ? 200 : 0,
  },
  iosButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  iosButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  iosButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 