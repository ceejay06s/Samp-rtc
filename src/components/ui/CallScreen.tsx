import { MaterialIcons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import React, { useEffect, useRef } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRTPCall } from '../../hooks/useRTPCall';
import { CallStatus, CallType } from '../../types';
import { useTheme } from '../../utils/themes';

interface CallScreenProps {
  matchId: string;
  receiverId: string;
  callType: CallType;
  onCallEnd?: () => void;
}

const { width, height } = Dimensions.get('window');

export const CallScreen: React.FC<CallScreenProps> = ({
  matchId,
  receiverId,
  callType,
  onCallEnd,
}) => {
  const theme = useTheme();
  const localVideoRef = useRef<Video>(null);
  const remoteVideoRef = useRef<Video>(null);

  const {
    isInCall,
    callStatus,
    currentCall,
    isConnected,
    isAudioEnabled,
    isVideoEnabled,
    localStream,
    remoteStream,
    initiateCall,
    endCall,
    toggleAudio,
    toggleVideo,
    switchCamera,
    callDuration,
    isInitializing,
    isConnecting,
  } = useRTPCall({
    onCallStateChange: (status) => {
      if (status === CallStatus.ENDED || status === CallStatus.MISSED || status === CallStatus.REJECTED) {
        onCallEnd?.();
      }
    },
    onError: (error) => {
      Alert.alert('Call Error', error.message);
    },
  });

  // Initialize call when component mounts
  useEffect(() => {
    const startCall = async () => {
      try {
        await initiateCall(matchId, receiverId, callType);
      } catch (error) {
        console.error('Failed to start call:', error);
        Alert.alert('Error', 'Failed to start call. Please try again.');
        onCallEnd?.();
      }
    };

    startCall();
  }, [matchId, receiverId, callType]);

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status text
  const getStatusText = (): string => {
    if (isInitializing) return 'Initializing...';
    if (isConnecting) return 'Connecting...';
    if (isConnected) return `Connected • ${formatDuration(callDuration)}`;
    if (callStatus === CallStatus.INITIATED) return 'Calling...';
    if (callStatus === CallStatus.RINGING) return 'Ringing...';
    return 'Connecting...';
  };

  // Get status color
  const getStatusColor = (): string => {
    if (isConnected) return theme.colors.success;
    if (isConnecting || callStatus === CallStatus.INITIATED) return theme.colors.warning;
    return theme.colors.textSecondary;
  };

  const handleEndCall = async () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Call',
          style: 'destructive',
          onPress: async () => {
            try {
              await endCall();
              onCallEnd?.();
            } catch (error) {
              console.error('Failed to end call:', error);
            }
          },
        },
      ]
    );
  };

  const handleToggleAudio = async () => {
    try {
      await toggleAudio();
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  };

  const handleToggleVideo = async () => {
    try {
      await toggleVideo();
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  };

  const handleSwitchCamera = async () => {
    try {
      await switchCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Background gradient */}
      <View style={[styles.background, { backgroundColor: theme.colors.surface }]} />
      
      {/* Video streams */}
      {callType === CallType.VIDEO && (
        <>
          {/* Remote video */}
          {remoteStream && (
            <Video
              ref={remoteVideoRef}
              source={{ uri: remoteStream.id }} // Use stream ID for React Native
              style={styles.remoteVideo}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
            />
          )}
          
          {/* Local video */}
          {localStream && (
            <Video
              ref={localVideoRef}
              source={{ uri: localStream.id }} // Use stream ID for React Native
              style={styles.localVideo}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              shouldPlay
              isLooping
            />
          )}
        </>
      )}

      {/* Call info overlay */}
      <View style={styles.infoOverlay}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        
        {callType === CallType.VOICE && (
          <View style={styles.voiceCallInfo}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <MaterialIcons name="person" size={40} color={theme.colors.onPrimary} />
            </View>
            <Text style={[styles.callerName, { color: theme.colors.text }]}>
              {currentCall?.caller_id === receiverId ? 'Incoming Call' : 'Outgoing Call'}
            </Text>
          </View>
        )}
      </View>

      {/* Control buttons */}
      <View style={styles.controls}>
        {/* Audio toggle */}
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: isAudioEnabled ? theme.colors.surface : theme.colors.error }
          ]}
          onPress={handleToggleAudio}
        >
          <MaterialIcons
            name={isAudioEnabled ? 'mic' : 'mic-off'}
            size={24}
            color={theme.colors.onPrimary}
          />
        </TouchableOpacity>

        {/* Video toggle (only for video calls) */}
        {callType === CallType.VIDEO && (
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: isVideoEnabled ? theme.colors.surface : theme.colors.error }
            ]}
            onPress={handleToggleVideo}
          >
            <MaterialIcons
              name={isVideoEnabled ? 'videocam' : 'videocam-off'}
              size={24}
              color={theme.colors.onPrimary}
            />
          </TouchableOpacity>
        )}

        {/* Switch camera (only for video calls) */}
        {callType === CallType.VIDEO && isVideoEnabled && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: theme.colors.surface }]}
            onPress={handleSwitchCamera}
          >
            <MaterialIcons
              name="flip-camera-ios"
              size={24}
              color={theme.colors.onPrimary}
            />
          </TouchableOpacity>
        )}

        {/* End call button */}
        <TouchableOpacity
          style={[styles.endCallButton, { backgroundColor: theme.colors.error }]}
          onPress={handleEndCall}
        >
          <MaterialIcons name="call-end" size={28} color={theme.colors.onPrimary} />
        </TouchableOpacity>
      </View>

      {/* Loading overlay */}
      {(isInitializing || isConnecting) && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingSpinner, { borderColor: theme.colors.primary }]} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            {isInitializing ? 'Setting up call...' : 'Connecting...'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  remoteVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  localVideo: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  infoOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  voiceCallInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  callerName: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  endCallButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderTopColor: 'transparent',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 