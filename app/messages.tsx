import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getResponsiveSpacing } from '../src/utils/responsive';
import { useTheme } from '../src/utils/themes';

export default function MessagesScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Messages
        </Text>
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          Messages feature coming soon!
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          You'll be able to chat with your matches here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: getResponsiveSpacing('lg'),
    paddingVertical: getResponsiveSpacing('lg'),
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
  },
  message: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing('md'),
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 