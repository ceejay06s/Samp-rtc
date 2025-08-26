import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AudioManager from '../../services/audioManager';
import { APP_CONFIG } from '../../utils/appConfig';
import { useTheme } from '../../utils/themes';

interface VoiceMessagePlayerProps {
  audioUrl: string;
  duration: number;
  isOwnMessage: boolean;
  messageId: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnd?: () => void;
}

export const VoiceMessagePlayer: React.FC<VoiceMessagePlayerProps> = ({
  audioUrl,
  duration,
  isOwnMessage,
  messageId,
  onPlay,
  onPause,
  onEnd
}) => {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  
  const positionUpdateInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);
  const audioManager = AudioManager.getInstance();

  useEffect(() => {
    // Register stop listener
    audioManager.addStopListener(messageId, handleAudioStopped);

    return () => {
      isMounted.current = false;
      audioManager.removeStopListener(messageId);
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    };
  }, [messageId]);

  const handleAudioStopped = () => {
    if (isMounted.current) {
      setIsPlaying(false);
      setCurrentPosition(0);
      if (positionUpdateInterval.current) {
        clearInterval(positionUpdateInterval.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (!isMounted.current || isSeeking) return;

    if (status.isLoaded) {
      if (status.isPlaying) {
        setIsPlaying(true);
        setCurrentPosition(status.positionMillis / 1000);
      } else {
        setIsPlaying(false);
        if (status.didJustFinish) {
          setCurrentPosition(0);
          onEnd?.();
          // Stop the audio in the manager
          audioManager.stopCurrentAudio();
        }
      }
    }
  };

  const togglePlayPause = async () => {
    try {
      if (isPlaying) {
        // Stop current audio
        await audioManager.stopCurrentAudio();
        setIsPlaying(false);
        onPause?.();
        if (positionUpdateInterval.current) {
          clearInterval(positionUpdateInterval.current);
        }
      } else {
        // Start playing this audio (will stop any other playing audio)
        setIsLoading(true);
        setError(null);

        const sound = await audioManager.playAudio(messageId, audioUrl, onPlaybackStatusUpdate);
        
        setIsPlaying(true);
        setIsLoading(false);
        onPlay?.();
        
        // Start position update interval
        if (!APP_CONFIG.DEVELOPMENT.DISABLE_VOICE_PLAYER_UPDATES) {
          positionUpdateInterval.current = setInterval(() => {
            sound.getStatusAsync().then((status: any) => {
              if (status.isLoaded && status.isPlaying && !isSeeking) {
                setCurrentPosition(status.positionMillis / 1000);
              }
            });
          }, 500); // Increased from 100ms to 500ms to prevent excessive reloading
        } else {
          console.log('🔄 Voice player position updates disabled in development mode');
        }

      }
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      setError('Playback failed');
      setIsLoading(false);
      Alert.alert('Error', 'Failed to play voice message');
    }
  };

  const handleProgressBarPress = async (event: any) => {
    if (!isPlaying || !duration || duration <= 0) return;
    
    // Debug: Log the entire event structure
    console.log('🎯 Progress bar pressed - Event structure:', {
      eventType: event.type,
      hasNativeEvent: !!event.nativeEvent,
      nativeEventKeys: event.nativeEvent ? Object.keys(event.nativeEvent) : [],
      hasClientX: event.clientX !== undefined,
      hasPageX: event.pageX !== undefined,
      hasOffsetX: event.offsetX !== undefined,
      eventKeys: Object.keys(event)
    });
    
    try {
      setIsSeeking(true);
      
      // Get the progress bar dimensions and touch position
      // Handle both web and mobile platforms
      let locationX: number;
      let currentWidth: number;
      
      // Check if we're on web platform (React Native Web)
      const isWebPlatform = typeof window !== 'undefined' && window.document;
      
      if (isWebPlatform && event.clientX !== undefined) {
        // Web platform - use clientX
        const rect = event.currentTarget.getBoundingClientRect();
        locationX = event.clientX - rect.left;
        currentWidth = rect.width;
        console.log('🌐 Web platform - clientX:', event.clientX, 'rect.left:', rect.left, 'locationX:', locationX, 'width:', currentWidth);
      } else if (event.nativeEvent && event.nativeEvent.locationX !== undefined) {
        // Mobile/React Native - use locationX
        locationX = event.nativeEvent.locationX;
        currentWidth = progressBarWidth > 0 ? progressBarWidth : 200;
        console.log('📱 Mobile platform - locationX:', locationX, 'width:', currentWidth);
      } else {
        // Fallback: try to extract position from various event properties
        console.log('🔍 Event analysis:', {
          isWebPlatform,
          hasNativeEvent: !!event.nativeEvent,
          nativeEventKeys: event.nativeEvent ? Object.keys(event.nativeEvent) : [],
          hasClientX: event.clientX !== undefined,
          hasPageX: event.pageX !== undefined,
          hasOffsetX: event.offsetX !== undefined,
          eventType: event.type,
          eventKeys: Object.keys(event)
        });
        
        // Try different event properties as fallback
        if (event.clientX !== undefined) {
          const rect = event.currentTarget.getBoundingClientRect();
          locationX = event.clientX - rect.left;
          currentWidth = rect.width;
          console.log('🔄 Fallback to clientX:', locationX);
        } else if (event.pageX !== undefined) {
          const rect = event.currentTarget.getBoundingClientRect();
          locationX = event.pageX - rect.left;
          currentWidth = rect.width;
          console.log('🔄 Fallback to pageX:', locationX);
        } else if (event.offsetX !== undefined) {
          locationX = event.offsetX;
          currentWidth = progressBarWidth > 0 ? progressBarWidth : 200;
          console.log('🔄 Fallback to offsetX:', locationX);
        } else {
          console.warn('❌ No usable position data found in event');
          setIsSeeking(false);
          return;
        }
      }
      
      // Validate inputs and calculate new position
      if (isNaN(locationX) || isNaN(currentWidth) || isNaN(duration)) {
        console.warn('❌ Invalid values for seeking:', { locationX, currentWidth, duration });
        setIsSeeking(false);
        return;
      }
      
      // Calculate the percentage and new position
      const percentage = Math.max(0, Math.min(1, locationX / currentWidth));
      const newPosition = Math.max(0, Math.min(duration, duration * percentage));
      
      // Validate the calculated position
      if (isNaN(newPosition) || !isFinite(newPosition)) {
        console.warn('❌ Invalid calculated position:', { newPosition, percentage, duration });
        setIsSeeking(false);
        return;
      }
      
      console.log('🎯 Seeking to position:', { 
        locationX, 
        currentWidth, 
        percentage, 
        duration, 
        newPosition 
      });
      
      // Update the current position
      setCurrentPosition(newPosition);
      
      // Seek to the new position in the audio
      await audioManager.seekToPosition(newPosition);
      
      setIsSeeking(false);
    } catch (error) {
      console.error('❌ Failed to seek audio:', error);
      setIsSeeking(false);
    }
  };

  const [progressBarWidth, setProgressBarWidth] = useState(200);
  
  const handleProgressBarLayout = (event: any) => {
    // Store the progress bar width for more accurate seeking
    const { width } = event.nativeEvent.layout;
    setProgressBarWidth(width);
    console.log('📏 Progress bar width updated:', width);
  };

  // Check if this player is currently playing
  const isCurrentlyPlaying = audioManager.isPlayerPlaying(messageId);

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.error + '20' }]}>
        <MaterialIcons name="error" size={20} color={theme.colors.error} />
        <Text style={[styles.errorText, { color: theme.colors.error }]}>
          Audio Error
        </Text>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      { backgroundColor: isOwnMessage ? theme.colors.primary + '20' : theme.colors.surfaceVariant }
    ]}>
      {/* Play/Stop Button */}
      <TouchableOpacity
        style={[
          styles.playButton,
          { backgroundColor: theme.colors.primary }
        ]}
        onPress={togglePlayPause}
        disabled={isLoading}
      >
        {isLoading ? (
          <MaterialIcons name="hourglass-empty" size={20} color={theme.colors.onPrimary} />
        ) : isCurrentlyPlaying ? (
          <MaterialIcons name="stop" size={20} color={theme.colors.onPrimary} />
        ) : (
          <MaterialIcons name="play-arrow" size={20} color={theme.colors.onPrimary} />
        )}
      </TouchableOpacity>

      {/* Audio Info and Progress Bar */}
      <View style={styles.audioInfo}>
        <Text style={[
          styles.durationText,
          { color: isOwnMessage ? theme.colors.onPrimary : theme.colors.text }
        ]}>
          {formatTime(currentPosition)} / {duration && duration > 0 ? formatTime(duration) : '--:--'}
        </Text>
        
        {/* Interactive Progress Bar */}
        {duration && duration > 0 ? (
          <TouchableOpacity
            style={[
              styles.progressBar,
              { backgroundColor: isOwnMessage ? theme.colors.onPrimary + '40' : theme.colors.border }
            ]}
            onPress={handleProgressBarPress}
            onLayout={handleProgressBarLayout}
            activeOpacity={0.8}
            disabled={!isPlaying}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.max(0, Math.min(100, (currentPosition / duration) * 100))}%`,
                  backgroundColor: theme.colors.primary
                }
              ]}
            />
            {/* Seek indicator */}
            {isPlaying && (
              <View
                style={[
                  styles.seekIndicator,
                  {
                    left: `${Math.max(0, Math.min(100, (currentPosition / duration) * 100))}%`,
                    backgroundColor: theme.colors.primary
                  }
                ]}
              />
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.progressBar, { backgroundColor: theme.colors.border }]}>
            <Text style={[styles.durationText, { fontSize: 12, opacity: 0.7 }]}>
              Duration unavailable
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 20,
    minHeight: 60,
    gap: 12,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  audioInfo: {
    flex: 1,
    gap: 8,
  },
  durationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  seekIndicator: {
    position: 'absolute',
    top: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
