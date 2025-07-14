# Auth Components

This directory contains reusable authentication components for the dating app.

## Components

### LoginForm
A reusable login form component with validation and error handling.

```tsx
import { LoginForm } from '../src/components/auth';

<LoginForm
  onSuccess={() => console.log('Login successful')}
  onNavigateToSignup={() => router.push('/signup')}
  showForgotPassword={true}
  showSignupLink={true}
  title="Welcome Back"
  subtitle="Sign in to continue your dating journey"
/>
```

**Props:**
- `onSuccess?: () => void` - Callback when login is successful
- `onNavigateToSignup?: () => void` - Callback to navigate to signup
- `showForgotPassword?: boolean` - Show forgot password link (default: true)
- `showSignupLink?: boolean` - Show signup navigation link (default: true)
- `title?: string` - Custom title (default: "Welcome Back")
- `subtitle?: string` - Custom subtitle

### SignupForm
A reusable signup form component with comprehensive validation.

```tsx
import { SignupForm } from '../src/components/auth';

<SignupForm
  onSuccess={() => console.log('Signup successful')}
  onNavigateToLogin={() => router.push('/login')}
  showLoginLink={true}
  title="Create Account"
  subtitle="Join our dating community"
  showTerms={true}
/>
```

**Props:**
- `onSuccess?: () => void` - Callback when signup is successful
- `onNavigateToLogin?: () => void` - Callback to navigate to login
- `showLoginLink?: boolean` - Show login navigation link (default: true)
- `title?: string` - Custom title (default: "Create Account")
- `subtitle?: string` - Custom subtitle
- `showTerms?: boolean` - Show terms of service text (default: true)

### AuthModal
A modal component that can switch between login and signup forms.

```tsx
import { AuthModal } from '../src/components/auth';

<AuthModal
  visible={showAuthModal}
  onClose={() => setShowAuthModal(false)}
  onSuccess={() => console.log('Authentication successful')}
  initialMode="login"
/>
```

**Props:**
- `visible: boolean` - Whether the modal is visible
- `onClose: () => void` - Callback when modal is closed
- `onSuccess: () => void` - Callback when authentication is successful
- `initialMode?: 'login' | 'signup'` - Initial form mode (default: "login")

## Usage Examples

### In a Screen
```tsx
import React from 'react';
import { View } from 'react-native';
import { LoginForm } from '../src/components/auth';

export default function LoginScreen() {
  const handleLoginSuccess = () => {
    // Navigate to dashboard or handle success
    router.replace('/dashboard');
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <LoginForm
        onSuccess={handleLoginSuccess}
        onNavigateToSignup={() => router.push('/signup')}
      />
    </View>
  );
}
```

### In a Modal
```tsx
import React, { useState } from 'react';
import { Button } from 'react-native';
import { AuthModal } from '../src/components/auth';

export default function SomeScreen() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <Button 
        title="Sign In" 
        onPress={() => setShowAuthModal(true)} 
      />
      
      <AuthModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          // Handle successful authentication
        }}
        initialMode="login"
      />
    </>
  );
}
```

## Features

- **Form Validation**: Real-time validation with error messages
- **Loading States**: Visual feedback during authentication
- **Error Handling**: User-friendly error messages
- **Customizable**: Configurable titles, subtitles, and visibility options
- **Responsive**: Works on all screen sizes
- **Theme Integration**: Consistent with app theme system
- **TypeScript**: Full type safety with proper interfaces

## Styling

All components use the app's theme system and are styled consistently. They automatically adapt to light/dark themes and follow the established design patterns. 