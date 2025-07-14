import React, { useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../utils/themes';

interface WebFileInputProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  multiple?: boolean;
  children?: React.ReactNode;
  disabled?: boolean;
}

export const WebFileInput: React.FC<WebFileInputProps> = ({
  onFileSelect,
  accept = 'image/*',
  multiple = false,
  children,
  disabled = false,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePress = () => {
    if (fileInputRef.current && !disabled) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onFileSelect(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: disabled ? theme.colors.border : theme.colors.primary,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {children || (
          <Text style={[styles.buttonText, { color: 'white' }]}>
            Select File
          </Text>
        )}
      </TouchableOpacity>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        style={styles.hiddenInput}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: 'none',
  },
}); 