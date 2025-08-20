import { useEffect } from 'react';
import AudioManager from '../services/audioManager';

/**
 * Hook to manage audio manager lifecycle
 * Ensures proper cleanup when components unmount
 */
export const useAudioManager = () => {
  useEffect(() => {
    // Cleanup function to stop all audio when component unmounts
    return () => {
      AudioManager.getInstance().cleanup();
    };
  }, []);
};
