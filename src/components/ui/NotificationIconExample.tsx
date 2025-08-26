import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../utils/themes';
import { NotificationBadge } from './NotificationBadge';
import { NotificationIcon } from './NotificationIcon';
import { NotificationWithBadge } from './NotificationWithBadge';

/**
 * Example component showing different ways to use the NotificationIcon
 * This is for demonstration purposes and can be removed in production
 */
export const NotificationIconExample: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Notification Icon Examples
      </Text>
      
      {/* Different sizes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sizes</Text>
        <View style={styles.iconRow}>
          <View style={styles.iconItem}>
            <NotificationIcon size={16} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>16px</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationIcon size={24} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>24px</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationIcon size={32} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>32px</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationIcon size={48} />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>48px</Text>
          </View>
        </View>
      </View>

      {/* Different variants */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Variants</Text>
        <View style={styles.iconRow}>
          <View style={styles.iconItem}>
            <NotificationIcon size={32} variant="default" />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Default</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationIcon size={32} variant="active" />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Active</Text>
          </View>
          <View style={styles.iconItem}>
            <NotificationIcon size={32} variant="muted" />
            <Text style={[styles.iconLabel, { color: theme.colors.textSecondary }]}>Muted</Text>
          </View>
        </View>
      </View>

      {/* Badge Examples */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Badge Examples</Text>
        
        {/* Badge variants */}
        <View style={styles.badgeRow}>
          <View style={styles.badgeItem}>
            <NotificationBadge size={20} variant="default" />
            <Text style={[styles.badgeLabel, { color: theme.colors.textSecondary }]}>Default</Text>
          </View>
          <View style={styles.badgeItem}>
            <NotificationBadge size={20} variant="alert" />
            <Text style={[styles.badgeLabel, { color: theme.colors.textSecondary }]}>Alert</Text>
          </View>
          <View style={styles.badgeItem}>
            <NotificationBadge size={20} variant="count" count={5} showCount />
            <Text style={[styles.badgeLabel, { color: theme.colors.textSecondary }]}>Count</Text>
          </View>
        </View>

        {/* Badge sizes */}
        <View style={styles.badgeRow}>
          <View style={styles.badgeItem}>
            <NotificationBadge size={16} count={3} showCount />
            <Text style={[styles.badgeLabel, { color: theme.colors.textSecondary }]}>16px</Text>
          </View>
          <View style={styles.badgeItem}>
            <NotificationBadge size={20} count={12} showCount />
            <Text style={[styles.badgeLabel, { color: theme.colors.textSecondary }]}>20px</Text>
          </View>
          <View style={styles.badgeItem}>
            <NotificationBadge size={24} count={99} showCount />
            <Text style={[styles.badgeLabel, { color: theme.colors.textSecondary }]}>24px</Text>
          </View>
        </View>
      </View>

      {/* Combined Examples */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Combined Examples</Text>
        
        {/* Icon with badge */}
        <View style={styles.combinedRow}>
          <View style={styles.combinedItem}>
            <NotificationWithBadge 
              iconSize={24} 
              badgeSize={16} 
              count={3} 
              showBadge 
            />
            <Text style={[styles.combinedLabel, { color: theme.colors.textSecondary }]}>Icon + Badge</Text>
          </View>
          <View style={styles.combinedItem}>
            <NotificationWithBadge 
              iconSize={32} 
              badgeSize={20} 
              count={12} 
              showBadge 
              iconVariant="active"
            />
            <Text style={[styles.combinedLabel, { color: theme.colors.textSecondary }]}>Large + Active</Text>
          </View>
        </View>
      </View>

      {/* Usage in context */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Usage Examples</Text>
        
        {/* Header example */}
        <View style={styles.usageExample}>
          <View style={styles.headerExample}>
            <NotificationIcon size={24} variant="active" />
            <Text style={[styles.headerText, { color: theme.colors.text }]}>
              New Message
            </Text>
          </View>
        </View>

        {/* Button example */}
        <View style={styles.usageExample}>
          <View style={[styles.buttonExample, { backgroundColor: theme.colors.primary }]}>
            <NotificationIcon size={20} variant="muted" />
            <Text style={[styles.buttonText, { color: theme.colors.background }]}>
              Enable Notifications
            </Text>
          </View>
        </View>

        {/* Navigation example */}
        <View style={styles.usageExample}>
          <View style={styles.navExample}>
            <NotificationWithBadge 
              iconSize={24} 
              badgeSize={16} 
              count={5} 
              showBadge 
              iconVariant="active"
            />
            <Text style={[styles.navText, { color: theme.colors.text }]}>
              Notifications (5)
            </Text>
          </View>
        </View>
      </View>
    </View>
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
  usageExample: {
    marginBottom: 20,
  },
  headerExample: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  buttonExample: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeItem: {
    alignItems: 'center',
  },
  badgeLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  combinedRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  combinedItem: {
    alignItems: 'center',
  },
  combinedLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  navExample: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  navText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
});
