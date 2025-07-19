# Swipe Gestures for Match Cards

This document explains the implementation of swipe gestures for match cards, providing an intuitive mobile interaction experience.

## Overview

The swipe gesture system allows users to:
- **Tap** to view profile
- **Swipe left** to open chat
- **Swipe right** to unmatch

## Features

### 🎯 **Intuitive Gestures**
- **Natural swipe directions** that feel intuitive
- **Visual feedback** during swiping
- **Smooth animations** with spring physics
- **Background action indicators** that appear during swipes

### 📱 **Mobile-Optimized**
- **Touch-friendly** gesture detection
- **Responsive thresholds** based on screen width
- **Haptic feedback** ready for future implementation
- **Accessible** with clear visual cues

## Implementation

### 1. **Gesture Handler Setup**

```typescript
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';

const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen width
const MAX_SWIPE_DISTANCE = SCREEN_WIDTH * 0.4; // 40% of screen width
```

### 2. **Gesture Event Handling**

```typescript
const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
  const { translationX, state } = event.nativeEvent;

  if (state === 2) { // ACTIVE
    setIsSwiping(true);
  } else if (state === 5) { // END
    setIsSwiping(false);
    
    if (translationX > SWIPE_THRESHOLD) {
      // Swipe right - Unmatch
      Animated.timing(translateX, {
        toValue: SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onUnmatch();
        translateX.setValue(0);
      });
    } else if (translationX < -SWIPE_THRESHOLD) {
      // Swipe left - Chat
      Animated.timing(translateX, {
        toValue: -SCREEN_WIDTH,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onMessagePress();
        translateX.setValue(0);
      });
    } else {
      // Return to center
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }
};
```

### 3. **Visual Feedback**

#### Card Transformations
```typescript
const cardOpacity = translateX.interpolate({
  inputRange: [-MAX_SWIPE_DISTANCE, 0, MAX_SWIPE_DISTANCE],
  outputRange: [0.8, 1, 0.8],
  extrapolate: 'clamp',
});

const cardScale = translateX.interpolate({
  inputRange: [-MAX_SWIPE_DISTANCE, 0, MAX_SWIPE_DISTANCE],
  outputRange: [0.95, 1, 0.95],
  extrapolate: 'clamp',
});
```

#### Background Actions
```typescript
const leftActionOpacity = translateX.interpolate({
  inputRange: [-MAX_SWIPE_DISTANCE, -SWIPE_THRESHOLD, 0],
  outputRange: [1, 0.8, 0],
  extrapolate: 'clamp',
});

const rightActionOpacity = translateX.interpolate({
  inputRange: [0, SWIPE_THRESHOLD, MAX_SWIPE_DISTANCE],
  outputRange: [0, 0.8, 1],
  extrapolate: 'clamp',
});
```

## Component Structure

### SwipeableMatchCard Component

```typescript
interface SwipeableMatchCardProps {
  match: Match;
  otherProfile: any;
  onViewProfile: () => void;
  onMessagePress: () => void;
  onUnmatch: () => void;
  onCallStart: (match: Match, callType: CallType) => void;
  currentUserId: string;
}
```

### Layout Structure
```typescript
<View style={styles.container}>
  {/* Background Actions */}
  <View style={styles.backgroundActions}>
    <Animated.View style={[styles.leftAction, { opacity: leftActionOpacity }]}>
      <MaterialIcon name={IconNames.messages} size={32} color="white" />
      <Text>Chat</Text>
    </Animated.View>
    
    <Animated.View style={[styles.rightAction, { opacity: rightActionOpacity }]}>
      <MaterialIcon name={IconNames.close} size={32} color="white" />
      <Text>Unmatch</Text>
    </Animated.View>
  </View>

  {/* Swipeable Card */}
  <PanGestureHandler onGestureEvent={onGestureEvent} onHandlerStateChange={onHandlerStateChange}>
    <Animated.View style={[styles.cardContainer, { transform: [{ translateX }, { scale: cardScale }] }]}>
      <Card onPress={onViewProfile}>
        {/* Card content */}
      </Card>
    </Animated.View>
  </PanGestureHandler>
</View>
```

## Gesture Configuration

### Thresholds and Distances
```typescript
// Swipe threshold - minimum distance to trigger action
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen width

// Maximum swipe distance for visual feedback
const MAX_SWIPE_DISTANCE = SCREEN_WIDTH * 0.4; // 40% of screen width

// Active offset for gesture detection
activeOffsetX={[-10, 10]} // Start detecting after 10px movement
```

### Animation Timing
```typescript
// Action completion animation
Animated.timing(translateX, {
  toValue: SCREEN_WIDTH, // or -SCREEN_WIDTH
  duration: 300, // 300ms for smooth completion
  useNativeDriver: true,
}).start(() => {
  // Execute action
  onUnmatch(); // or onMessagePress()
  translateX.setValue(0); // Reset position
});

// Return to center animation
Animated.spring(translateX, {
  toValue: 0,
  useNativeDriver: true,
  // Spring physics for natural feel
}).start();
```

## Visual Design

### Background Actions
```typescript
const styles = StyleSheet.create({
  backgroundActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveSpacing('lg'),
  },
  leftAction: {
    backgroundColor: '#4ECDC4', // Teal for chat
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  rightAction: {
    backgroundColor: '#FF6B6B', // Red for unmatch
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
});
```

### Card Transformations
```typescript
// Opacity changes during swipe
cardOpacity: [0.8, 1, 0.8] // Fade slightly during swipe

// Scale changes during swipe
cardScale: [0.95, 1, 0.95] // Slightly shrink during swipe

// Transform array
transform: [
  { translateX }, // Horizontal movement
  { scale: cardScale } // Scale effect
]
```

## User Experience Features

### 1. **Visual Instructions**
```typescript
<View style={styles.swipeInstructions}>
  <View style={styles.instructionRow}>
    <View style={styles.instructionItem}>
      <MaterialIcon name={IconNames.back} size={16} color={theme.colors.primary} />
      <Text>Swipe left to chat</Text>
    </View>
    <View style={styles.instructionItem}>
      <MaterialIcon name={IconNames.forward} size={16} color={theme.colors.error} />
      <Text>Swipe right to unmatch</Text>
    </View>
  </View>
  <Text>Tap to view profile</Text>
</View>
```

### 2. **Progressive Disclosure**
- **Subtle hints** for new users
- **Background actions** appear during swipes
- **Clear visual feedback** for all interactions

### 3. **Error Prevention**
- **Threshold-based activation** prevents accidental actions
- **Spring-back animation** for incomplete swipes
- **Visual confirmation** through background actions

## Integration with Matches Screen

### Usage in Matches Screen
```typescript
const renderMatch = ({ item: match }) => {
  const otherProfile = getOtherProfile(match);
  
  if (!isDesktop) {
    return (
      <SwipeableMatchCard
        match={match}
        otherProfile={otherProfile}
        onViewProfile={() => handleMatchPress(match)}
        onMessagePress={() => handleMessagePress(match)}
        onUnmatch={() => handleUnmatch(match)}
        onCallStart={handleCallStart}
        currentUserId={user?.id || ''}
      />
    );
  }
  
  // Desktop version remains unchanged
  return <DesktopMatchCard {...props} />;
};
```

### Platform Detection
```typescript
const { isWeb } = usePlatform();
const { isBreakpoint } = useViewport();
const isDesktop = isBreakpoint.xl || isWeb;

// Use swipeable cards only on mobile
if (!isDesktop) {
  return <SwipeableMatchCard {...props} />;
}
```

## Performance Optimizations

### 1. **Native Driver**
```typescript
// Use native driver for smooth animations
Animated.timing(translateX, {
  toValue: SCREEN_WIDTH,
  duration: 300,
  useNativeDriver: true, // Runs on UI thread
}).start();
```

### 2. **Efficient Gesture Handling**
```typescript
// Only detect horizontal gestures
activeOffsetX={[-10, 10]} // Ignore vertical movements

// Use interpolate for smooth visual feedback
const opacity = translateX.interpolate({
  inputRange: [-MAX_SWIPE_DISTANCE, 0, MAX_SWIPE_DISTANCE],
  outputRange: [0.8, 1, 0.8],
  extrapolate: 'clamp',
});
```

### 3. **Memory Management**
```typescript
// Reset animation values after completion
translateX.setValue(0);

// Clean up gesture state
setIsSwiping(false);
```

## Accessibility Features

### 1. **Visual Feedback**
- **Clear action indicators** during swipes
- **Color-coded actions** (teal for chat, red for unmatch)
- **Smooth transitions** for all interactions

### 2. **Touch Targets**
- **Generous swipe areas** for easy interaction
- **Clear visual boundaries** for gesture detection
- **Consistent interaction patterns**

### 3. **Error Recovery**
- **Spring-back animation** for incomplete gestures
- **Visual confirmation** before actions execute
- **Clear instruction text** for new users

## Future Enhancements

### Potential Improvements
1. **Haptic feedback** for gesture completion
2. **Sound effects** for actions
3. **Customizable swipe directions**
4. **Advanced gesture combinations**
5. **Gesture tutorials** for new users

### Accessibility Enhancements
1. **Voice control** for actions
2. **Screen reader** support for gestures
3. **High contrast mode** for action indicators
4. **Reduced motion** preferences

## Testing

### Gesture Testing Checklist
- [ ] Swipe left triggers chat action
- [ ] Swipe right triggers unmatch action
- [ ] Tap opens profile view
- [ ] Incomplete swipes return to center
- [ ] Visual feedback appears during swipes
- [ ] Animations are smooth and responsive
- [ ] Background actions are clearly visible
- [ ] Instructions are clear and helpful

### Cross-Platform Testing
- [ ] iOS gesture handling
- [ ] Android gesture handling
- [ ] Different screen sizes
- [ ] Various gesture speeds
- [ ] Edge case scenarios

The swipe gesture implementation provides an intuitive and engaging way for users to interact with match cards, making the mobile experience more fluid and efficient. 