import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../lib/AuthContext';
import { useTheme } from '../../utils/themes';

export const AuthStatusIndicator: React.FC = () => {
  const theme = useTheme();
  const { isAuthenticated, user, loading, lastLoginTime } = useAuth();

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <MaterialIcons name="hourglass-empty" size={16} color={theme.colors.textSecondary} />
        <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <MaterialIcons name="person-off" size={16} color={theme.colors.error} />
        <Text style={[styles.text, { color: theme.colors.error }]}>
          Not authenticated
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <MaterialIcons name="person" size={16} color={theme.colors.success} />
      <Text style={[styles.text, { color: theme.colors.success }]}>
        Authenticated as {user.email}
      </Text>
      {lastLoginTime && (
        <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>
          Last login: {new Date(lastLoginTime).toLocaleString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  subtext: {
    marginLeft: 8,
    fontSize: 12,
    fontStyle: 'italic',
  },
}); 