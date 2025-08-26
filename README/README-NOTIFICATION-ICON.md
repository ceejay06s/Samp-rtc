# Notification Icon System

## Overview

The notification icon system provides a consistent way to display notification-related icons throughout the dating app. It uses a custom bell icon image that can be styled and sized according to different contexts.

## Components

### NotificationIcon

The main component for displaying notification icons with consistent styling and theming.

### NotificationBadge

A badge component using the exclamation mark icon for alerts and notification counts.

#### Props

- `size?: number` - Badge size in pixels (default: 16)
- `count?: number` - Number to display in the badge
- `style?: ImageStyle` - Additional React Native styles to apply
- `variant?: 'default' | 'alert' | 'count'` - Badge variant for different states
- `showCount?: boolean` - Whether to show the count text

#### Variants

- **default**: Uses theme text color with subtle background
- **alert**: Uses theme error color for important alerts
- **count**: Uses theme primary color for notification counts

### NotificationWithBadge

A combined component that shows both the notification icon and badge overlay.

#### Props

- `iconSize?: number` - Size of the notification icon
- `badgeSize?: number` - Size of the badge overlay
- `count?: number` - Number to display in the badge
- `showBadge?: boolean` - Whether to show the badge
- `badgeVariant?: 'default' | 'alert' | 'count'` - Badge variant
- `iconVariant?: 'default' | 'active' | 'muted'` - Icon variant

#### Props

- `size?: number` - Icon size in pixels (default: 24)
- `style?: ImageStyle` - Additional React Native styles to apply
- `variant?: 'default' | 'active' | 'muted'` - Icon variant for different states

#### Variants

- **default**: Uses theme text color
- **active**: Uses theme primary color (for active states, headers)
- **muted**: Uses theme secondary text color (for disabled/inactive states)

#### Usage Examples

```tsx
import { NotificationIcon } from '../components/ui/NotificationIcon';

// Basic usage
<NotificationIcon />

// Custom size
<NotificationIcon size={32} />

// Different variants
<NotificationIcon size={24} variant="active" />
<NotificationIcon size={20} variant="muted" />

// With custom styles
<NotificationIcon 
  size={48} 
  variant="active" 
  style={{ marginRight: 8 }} 
/>

### NotificationBadge Usage

```tsx
import { NotificationBadge } from '../components/ui/NotificationBadge';

// Basic alert badge
<NotificationBadge size={20} variant="alert" />

// Badge with count
<NotificationBadge size={16} count={5} showCount />

// Different variants
<NotificationBadge size={24} variant="default" />
<NotificationBadge size={20} variant="count" count={12} showCount />
```

### NotificationWithBadge Usage

```tsx
import { NotificationWithBadge } from '../components/ui/NotificationWithBadge';

// Icon with count badge
<NotificationWithBadge 
  iconSize={24} 
  badgeSize={16} 
  count={3} 
  showBadge 
/>

// Large icon with alert badge
<NotificationWithBadge 
  iconSize={32} 
  badgeSize={20} 
  showBadge 
  badgeVariant="alert"
  iconVariant="active"
/>
```

## Integration

### In NotificationSettings Component

The `NotificationSettings` component has been updated to use the custom `NotificationIcon`:

- Header icon: 32px active variant
- Loading state icon: 48px active variant

### In Other Components

You can use the `NotificationIcon` anywhere you need to represent notifications:

```tsx
// Header with notification icon
<View style={styles.header}>
  <NotificationIcon size={24} variant="active" />
  <Text>New Messages</Text>
</View>

// Button with notification icon
<TouchableOpacity style={styles.button}>
  <NotificationIcon size={20} variant="muted" />
  <Text>Enable Notifications</Text>
</TouchableOpacity>

// List item with notification icon
<View style={styles.listItem}>
  <NotificationIcon size={16} />
  <Text>Notification item</Text>
</View>

// Navigation bar with badge
<View style={styles.navItem}>
  <NotificationWithBadge 
    iconSize={24} 
    badgeSize={16} 
    count={unreadCount} 
    showBadge={unreadCount > 0}
  />
  <Text>Messages</Text>
</View>

// Alert indicator
<View style={styles.alertItem}>
  <NotificationBadge size={20} variant="alert" />
  <Text>Important update</Text>
</View>

// Settings with count
<View style={styles.settingsItem}>
  <NotificationWithBadge 
    iconSize={20} 
    badgeSize={14} 
    count={pendingNotifications} 
    showBadge={pendingNotifications > 0}
    iconVariant="muted"
  />
  <Text>Notification Settings</Text>
</View>

## Assets

### Current Status
⚠️ **Important**: The `notification-icon.png` file is currently empty (0 bytes), which will cause errors.

### Required Assets

1. **Notification Icon** (Bell icon):
   - **Location**: `assets/images/notification-icon.png`
   - **Status**: ❌ Missing/Empty
   - **Current Solution**: Uses `favicon.png` with fallback to Ionicons
   - **Purpose**: Bell icon for notifications, alerts, and reminders

2. **Badge Icon** (Exclamation mark):
   - **Location**: `assets/images/badge.png`
   - **Status**: ❌ Missing
   - **Current Solution**: Uses `NotificationBadgeSimple` with Ionicons
   - **Purpose**: Exclamation mark for alerts, warnings, and notification counts

### Working Solutions
- **NotificationIcon**: Uses `favicon.png` with automatic fallback to Ionicons
- **NotificationBadge**: Pure component using Ionicons (always works)
- **NotificationBadgeSimple**: Alternative pure component using Ionicons (always works)
- **NotificationIconFallback**: Ionicons-based backup (always works)

## Theming

The icon automatically adapts to the current theme:
- Colors are pulled from the theme system
- Supports light/dark mode automatically
- Maintains consistency with other UI elements

## Best Practices

1. **Size Guidelines**:
   - 16px: Small icons in lists or compact spaces
   - 20px: Button icons
   - 24px: Standard size for most use cases
   - 32px: Section headers
   - 48px: Large display icons (loading states, empty states)

2. **Variant Usage**:
   - Use `active` for primary actions and headers
   - Use `default` for general notification indicators
   - Use `muted` for disabled or secondary states

3. **Accessibility**:
   - The icon automatically supports screen readers
   - Maintains proper contrast ratios
   - Scales appropriately with system font size changes

## Example Component

See `NotificationIconExample.tsx` for a comprehensive demonstration of all icon variants, sizes, and usage patterns.

## Troubleshooting

### Common Issues

1. **"Empty file" error for notification-icon.png**
   - **Cause**: The image file is 0 bytes or corrupted
   - **Solution**: Replace the file with your actual bell icon image
   - **Alternative**: Use `NotificationIconFallback` component temporarily

2. **Image not loading**
   - **Cause**: Incorrect file path or missing asset
   - **Solution**: Verify the image exists in `assets/images/`
   - **Check**: File size should be > 0 bytes

3. **Metro bundler cache issues**
   - **Solution**: Clear Metro cache: `npx expo start --clear`
   - **Alternative**: Restart the development server

### Testing Components

Use the test page at `app/notification-test.tsx` to verify all components are working:
- Test both image-based and fallback icons
- Verify badge functionality
- Check theme integration

## Future Enhancements

- Add animation support for notification alerts
- Support for different icon styles (outline, filled, etc.)
- Badge support for notification counts
- Custom icon themes for different app sections
