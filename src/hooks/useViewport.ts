import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import {
    deviceType,
    getOrientation,
    getSafeAreaInsets,
    getStatusBarHeight,
    getViewport,
    isBreakpoint
} from '../utils/responsive';

export interface ViewportState {
  width: number;
  height: number;
  scale: number;
  pixelRatio: number;
  deviceType: typeof deviceType;
  isBreakpoint: typeof isBreakpoint;
  orientation: 'portrait' | 'landscape';
  statusBarHeight: number;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export const useViewport = (): ViewportState => {
  const [viewportState, setViewportState] = useState<ViewportState>(() => {
    const viewport = getViewport();
    return {
      ...viewport,
      deviceType,
      isBreakpoint,
      orientation: getOrientation(),
      statusBarHeight: getStatusBarHeight(),
      safeAreaInsets: getSafeAreaInsets(),
    };
  });

  useEffect(() => {
    const updateViewport = () => {
      const viewport = getViewport();
      setViewportState({
        ...viewport,
        deviceType,
        isBreakpoint,
        orientation: getOrientation(),
        statusBarHeight: getStatusBarHeight(),
        safeAreaInsets: getSafeAreaInsets(),
      });
    };

    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      updateViewport();
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return viewportState;
};

// Convenience hooks for specific viewport aspects
export const useDeviceType = () => {
  const { deviceType } = useViewport();
  return deviceType;
};

export const useBreakpoint = () => {
  const { isBreakpoint } = useViewport();
  return isBreakpoint;
};

export const useOrientation = () => {
  const { orientation } = useViewport();
  return orientation;
};

export const useSafeArea = () => {
  const { safeAreaInsets } = useViewport();
  return safeAreaInsets;
}; 