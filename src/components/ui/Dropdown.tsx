import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getResponsiveFontSize, getResponsiveSpacing } from '../../utils/responsive';
import { useTheme } from '../../utils/themes';

export interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  disabled?: boolean;
  searchable?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onValueChange,
  placeholder = 'Select an option',
  error,
  label,
  disabled = false,
  searchable = false,
}) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find(option => option.value === value);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    setSearchQuery('');
  };

  const renderOption = ({ item }: { item: DropdownOption }) => (
    <TouchableOpacity
      style={[
        styles.option,
        { 
          backgroundColor: item.value === value 
            ? `${theme.colors.primary}20` 
            : 'transparent',
          borderBottomColor: theme.colors.border,
        }
      ]}
      onPress={() => handleSelect(item.value)}
    >
      <Text style={[
        styles.optionText,
        { 
          color: item.value === value 
            ? theme.colors.primary 
            : theme.colors.text 
        }
      ]}>
        {item.label}
      </Text>
      {item.value === value && (
        <Text style={[styles.checkIcon, { color: theme.colors.primary }]}>
          ✓
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text }]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.selector,
          {
            backgroundColor: theme.colors.surface,
            borderColor: error ? theme.colors.error : theme.colors.border,
            opacity: disabled ? 0.6 : 1,
          }
        ]}
        onPress={() => !disabled && setIsOpen(true)}
        disabled={disabled}
      >
        <Text style={[
          styles.selectorText,
          { 
            color: selectedOption 
              ? theme.colors.text 
              : theme.colors.textSecondary 
          }
        ]}>
          {displayText}
        </Text>
        <Text style={[styles.dropdownIcon, { color: theme.colors.textSecondary }]}>
          {isOpen ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          {error}
        </Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                {label || 'Select Option'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.textSecondary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {searchable && (
              <View style={[styles.searchContainer, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.searchIcon, { color: theme.colors.textSecondary }]}>
                  🔍
                </Text>
                <TouchableOpacity
                  style={styles.searchInput}
                  onPress={() => {
                    // For web compatibility, we'll use a simple alert prompt
                    // In a real implementation, you'd use TextInput
                    const query = prompt('Search options:');
                    if (query !== null) {
                      setSearchQuery(query);
                    }
                  }}
                >
                  <Text style={[
                    styles.searchInputText,
                    { color: searchQuery ? theme.colors.text : theme.colors.textSecondary }
                  ]}>
                    {searchQuery || 'Search options...'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={filteredOptions}
              renderItem={renderOption}
              keyExtractor={(item) => item.value}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                    No options found
                  </Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('md'),
    paddingVertical: getResponsiveSpacing('md'),
    borderRadius: getResponsiveSpacing('sm'),
    borderWidth: 1,
    minHeight: 50,
  },
  selectorText: {
    fontSize: getResponsiveFontSize('md'),
    flex: 1,
  },
  dropdownIcon: {
    fontSize: getResponsiveFontSize('sm'),
    marginLeft: getResponsiveSpacing('sm'),
  },
  errorText: {
    fontSize: getResponsiveFontSize('sm'),
    marginTop: getResponsiveSpacing('xs'),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: getResponsiveSpacing('lg'),
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: getResponsiveSpacing('lg'),
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: getResponsiveSpacing('xs'),
  },
  closeButtonText: {
    fontSize: getResponsiveFontSize('lg'),
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
  },
  searchIcon: {
    fontSize: getResponsiveFontSize('md'),
    marginRight: getResponsiveSpacing('sm'),
  },
  searchInput: {
    flex: 1,
    paddingVertical: getResponsiveSpacing('sm'),
  },
  searchInputText: {
    fontSize: getResponsiveFontSize('md'),
  },
  optionsList: {
    maxHeight: 300,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('md'),
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: getResponsiveFontSize('md'),
    flex: 1,
  },
  checkIcon: {
    fontSize: getResponsiveFontSize('md'),
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: getResponsiveSpacing('lg'),
    alignItems: 'center',
  },
  emptyText: {
    fontSize: getResponsiveFontSize('md'),
    textAlign: 'center',
  },
}); 