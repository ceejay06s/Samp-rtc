import * as SystemUI from 'expo-system-ui';
import React from 'react';
import { Platform, StatusBar } from 'react-native';
import { usePlatform } from '../hooks/usePlatform';

export interface FullscreenConfig {
  hideStatusBar?: boolean;
  hideNavigationBar?: boolean;
  immersiveMode?: boolean;
  backgroundColor?: string;
  barStyle?: 'light-content' | 'dark-content' | 'default';
}

export interface FullscreenState {
  isFullscreen: boolean;
  statusBarHidden: boolean;
  navigationBarHidden: boolean;
  immersiveMode: boolean;
}

class FullscreenService {
  private currentState: FullscreenState = {
    isFullscreen: false,
    statusBarHidden: false,
    navigationBarHidden: false,
    immersiveMode: false,
  };

  private listeners: ((state: FullscreenState) => void)[] = [];

  /**
   * Enter fullscreen mode
   */
  async enterFullscreen(config: FullscreenConfig = {}): Promise<void> {
    const {
      hideStatusBar = true,
      hideNavigationBar = true,
      immersiveMode = true,
      backgroundColor = '#000000',
      barStyle = 'light-content',
    } = config;

    try {
      // Hide status bar
      if (hideStatusBar) {
        StatusBar.setHidden(true, 'slide');
        this.currentState.statusBarHidden = true;
      }

      // Set status bar style
      StatusBar.setBarStyle(barStyle);

      // Platform-specific fullscreen handling
      if (Platform.OS === 'android') {
        // Android immersive mode
        if (immersiveMode) {
          // Note: True immersive mode requires native modules
          // For now, we'll use the available StatusBar API
          StatusBar.setTranslucent(true);
          StatusBar.setBackgroundColor(backgroundColor, true);
          this.currentState.immersiveMode = true;
        }
      } else if (Platform.OS === 'ios') {
        // iOS fullscreen handling
        await SystemUI.setBackgroundColorAsync(backgroundColor);
      }

      // Hide navigation bar on Android
      if (Platform.OS === 'android' && hideNavigationBar) {
        // This would require a native module for true navigation bar hiding
        // For now, we'll use StatusBar API
        this.currentState.navigationBarHidden = true;
      }

      this.currentState.isFullscreen = true;
      this.notifyListeners();

    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }

  /**
   * Exit fullscreen mode
   */
  async exitFullscreen(): Promise<void> {
    try {
      // Show status bar
      StatusBar.setHidden(false, 'slide');
      this.currentState.statusBarHidden = false;

      // Reset status bar style
      StatusBar.setBarStyle('default');

      // Platform-specific cleanup
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(false);
        StatusBar.setBackgroundColor('transparent', true);
        this.currentState.immersiveMode = false;
      } else if (Platform.OS === 'ios') {
        await SystemUI.setBackgroundColorAsync('#ffffff');
      }

      // Show navigation bar
      this.currentState.navigationBarHidden = false;
      this.currentState.isFullscreen = false;
      this.notifyListeners();

    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }

  /**
   * Toggle fullscreen mode
   */
  async toggleFullscreen(config?: FullscreenConfig): Promise<void> {
    if (this.currentState.isFullscreen) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen(config);
    }
  }

  /**
   * Get current fullscreen state
   */
  getState(): FullscreenState {
    return { ...this.currentState };
  }

  /**
   * Add state change listener
   */
  addListener(listener: (state: FullscreenState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  /**
   * Set status bar visibility
   */
  setStatusBarHidden(hidden: boolean, animation: 'none' | 'fade' | 'slide' = 'slide'): void {
    StatusBar.setHidden(hidden, animation);
    this.currentState.statusBarHidden = hidden;
    this.notifyListeners();
  }

  /**
   * Set status bar style
   */
  setStatusBarStyle(style: 'light-content' | 'dark-content' | 'default'): void {
    StatusBar.setBarStyle(style);
  }

  /**
   * Set status bar background color (Android only)
   */
  setStatusBarBackgroundColor(color: string, animated: boolean = true): void {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(color, animated);
    }
  }

  /**
   * Set status bar translucent (Android only)
   */
  setStatusBarTranslucent(translucent: boolean): void {
    if (Platform.OS === 'android') {
      StatusBar.setTranslucent(translucent);
    }
  }
}

// Create singleton instance
export const fullscreenService = new FullscreenService();

/**
 * React Hook for fullscreen functionality
 */
export const useFullscreen = () => {
  const platform = usePlatform();
  const [state, setState] = React.useState<FullscreenState>(fullscreenService.getState());

  React.useEffect(() => {
    const unsubscribe = fullscreenService.addListener(setState);
    return unsubscribe;
  }, []);

  const enterFullscreen = React.useCallback(async (config?: FullscreenConfig) => {
    await fullscreenService.enterFullscreen(config);
  }, []);

  const exitFullscreen = React.useCallback(async () => {
    await fullscreenService.exitFullscreen();
  }, []);

  const toggleFullscreen = React.useCallback(async (config?: FullscreenConfig) => {
    await fullscreenService.toggleFullscreen(config);
  }, []);

  const setStatusBarHidden = React.useCallback((hidden: boolean, animation?: 'none' | 'fade' | 'slide') => {
    fullscreenService.setStatusBarHidden(hidden, animation);
  }, []);

  const setStatusBarStyle = React.useCallback((style: 'light-content' | 'dark-content' | 'default') => {
    fullscreenService.setStatusBarStyle(style);
  }, []);

  return {
    ...state,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    setStatusBarHidden,
    setStatusBarStyle,
    isSupported: platform.isStandalone || platform.isWeb, // Fullscreen works best in standalone apps
  };
};

// Export the service for direct use
export default fullscreenService; 