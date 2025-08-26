import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../utils/themes';
import { NotificationBadge } from './NotificationBadge';
import { NotificationBadgeSimple } from './NotificationBadgeSimple';
import { NotificationIcon } from './NotificationIcon';
import { NotificationIconFallback } from './NotificationIconFallback';
import { NotificationWithBadge } from './NotificationWithBadge';

export const NotificationTest: React.FC = () => {
  const theme = useTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Notification Components Test
      </Text>

      {/* Test NotificationIcon */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          NotificationIcon (Image-based)
        </Text>
        <View style={styles.iconRow}>
          <View style={styles.iconItem}>
            <NotificationIcon size={24} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Default</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationIcon size={24} variant="active" />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Active</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationIcon size={24} variant="muted" />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Muted</Text>
          </View>
        </View>
      </View>

      {/* Test NotificationIconFallback */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          NotificationIconFallback (Ionicons)
        </Text>
        <View style={styles.iconRow}>
          <View style={styles.iconItem}>
            <NotificationIconFallback size={24} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Default</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationIconFallback size={24} variant="active" />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Active</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationIconFallback size={24} variant="muted" />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Muted</Text>
          </View>
        </View>
      </View>

      {/* Test NotificationBadge */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          NotificationBadge (Image-based)
        </Text>
        <View style={styles.iconRow}>
          <View style={styles.iconItem}>
            <NotificationBadge size={20} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Default</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationBadge size={20} variant="alert" />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Alert</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationBadge size={20} count={5} showCount />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Count</Text>
          </View>
        </View>
      </View>

      {/* Test NotificationBadgeSimple */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          NotificationBadgeSimple (No images)
        </Text>
        <View style={styles.iconRow}>
          <View style={styles.iconItem}>
            <NotificationBadgeSimple size={20} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Default</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationBadgeSimple size={20} variant="alert" />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Alert</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationBadgeSimple size={20} count={5} showCount />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Count</Text>
          </View>
        </View>
      </View>

      {/* Test NotificationWithBadge */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          NotificationWithBadge
        </Text>
        <View style={styles.iconRow}>
          <View style={styles.iconItem}>
            <NotificationWithBadge 
              iconSize={24} 
              badgeSize={16} 
              count={3} 
              showBadge 
            />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Icon + Badge</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationWithBadge 
              iconSize={32} 
              badgeSize={20} 
              count={12} 
              showBadge 
              iconVariant="active"
            />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Large + Active</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
        Note: If you see errors with the image-based NotificationIcon, 
        use NotificationIconFallback instead until you add your bell icon image.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  iconItem: {
    alignItems: 'center',
  },
  iconLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});
