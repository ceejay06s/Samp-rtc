import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useAuth } from '../../lib/AuthContext';
import RTPService from '../services/rtpService';
import WebRTCManager from '../services/webRTCManager';
import { CallStatus, CallType, RTPCall } from '../types';

export interface UseRTPCallOptions {
  onCallStateChange?: (status: CallStatus) => void;
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
}

export interface UseRTPCallReturn {
  // Call state
  isInCall: boolean;
  callStatus: CallStatus | null;
  currentCall: RTPCall | null;
  isConnected: boolean;
  
  // Media state
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  
  // Call actions
  initiateCall: (matchId: string, receiverId: string, callType: CallType) => Promise<void>;
  answerCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: () => Promise<void>;
  
  // Media controls
  toggleAudio: () => Promise<void>;
  toggleVideo: () => Promise<void>;
  switchCamera: () => Promise<void>;
  
  // Call info
  callDuration: number;
  callStats: any;
  
  // Loading states
  isInitializing: boolean;
  isConnecting: boolean;
}

export function useRTPCall(options: UseRTPCallOptions = {}): UseRTPCallReturn {
  const { user } = useAuth();
  const rtpService = RTPService.getInstance();
  const webRTCManager = WebRTCManager.getInstance();
  
  // State
  const [isInCall, setIsInCall] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null);
  const [currentCall, setCurrentCall] = useState<RTPCall | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStats, setCallStats] = useState<any>(null);
  
  // Refs
  const callStartTime = useRef<number | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const statsInterval = useRef<NodeJS.Timeout | null>(null);

  // Set up WebRTC callbacks
  useEffect(() => {
    webRTCManager.setCallbacks({
      onCallStateChange: (status) => {
        setCallStatus(status);
        options.onCallStateChange?.(status);
        
        if (status === CallStatus.CONNECTED) {
          setIsConnected(true);
          setIsConnecting(false);
          callStartTime.current = Date.now();
          startDurationTimer();
          startStatsTimer();
        } else if ([CallStatus.ENDED, CallStatus.MISSED, CallStatus.REJECTED].includes(status)) {
          setIsInCall(false);
          setIsConnected(false);
          setIsConnecting(false);
          stopDurationTimer();
          stopStatsTimer();
        }
      },
      onLocalStream: (stream) => {
        setLocalStream(stream);
        options.onLocalStream?.(stream);
      },
      onRemoteStream: (stream) => {
        setRemoteStream(stream);
        options.onRemoteStream?.(stream);
      },
      onConnectionStateChange: (state) => {
        options.onConnectionStateChange?.(state);
      },
      onError: (error) => {
        console.error('WebRTC error:', error);
        options.onError?.(error);
        Alert.alert('Call Error', error.message);
      },
    });

    return () => {
      webRTCManager.setCallbacks({});
    };
  }, [options]);

  // Subscribe to incoming calls
  useEffect(() => {
    if (!user?.id) return;

    const handleIncomingCall = async (call: RTPCall) => {
      if (call.receiver_id === user.id && call.status === CallStatus.INITIATED) {
        setCurrentCall(call);
        setIsInCall(true);
        setCallStatus(call.status);
        
        // Show incoming call alert
        Alert.alert(
          'Incoming Call',
          `You have an incoming ${call.call_type} call`,
          [
            {
              text: 'Reject',
              style: 'destructive',
              onPress: () => rejectCall(call.id),
            },
            {
              text: 'Answer',
              onPress: () => answerCall(call.id),
            },
          ]
        );
      }
    };

    rtpService.subscribeToCalls(user.id, handleIncomingCall);

    return () => {
      rtpService.unsubscribeFromCalls(user.id);
    };
  }, [user?.id]);

  // Duration timer
  const startDurationTimer = useCallback(() => {
    durationInterval.current = setInterval(() => {
      if (callStartTime.current) {
        const duration = Math.floor((Date.now() - callStartTime.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000) as any;
  }, []);

  const stopDurationTimer = useCallback(() => {
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    setCallDuration(0);
    callStartTime.current = null;
  }, []);

  // Stats timer
  const startStatsTimer = useCallback(() => {
    statsInterval.current = setInterval(async () => {
      try {
        const stats = await webRTCManager.getCallStats();
        setCallStats(stats);
      } catch (error) {
        console.error('Failed to get call stats:', error);
      }
    }, 5000) as any; // Update stats every 5 seconds
  }, []);

  const stopStatsTimer = useCallback(() => {
    if (statsInterval.current) {
      clearInterval(statsInterval.current);
      statsInterval.current = null;
    }
    setCallStats(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDurationTimer();
      stopStatsTimer();
      webRTCManager.cleanup();
    };
  }, []);

  // Call actions
  const initiateCall = useCallback(async (matchId: string, receiverId: string, callType: CallType) => {
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      setIsInitializing(true);
      
      // Create call record
      const call = await rtpService.initiateCall({
        matchId,
        receiverId,
        callType,
      });

      setCurrentCall(call);
      setIsInCall(true);
      setCallStatus(call.status);

      // Initialize WebRTC
      await webRTCManager.initializeCall({
        callId: call.id,
        matchId,
        isInitiator: true,
        callType,
        localUserId: user.id,
        remoteUserId: receiverId,
      });

      // Get local stream
      const stream = await webRTCManager.getLocalStream({
        audio: true,
        video: callType === CallType.VIDEO,
      });

      setLocalStream(stream);

      // Create and send offer
      await webRTCManager.createOffer();
      
      setIsInitializing(false);
      setIsConnecting(true);
    } catch (error) {
      setIsInitializing(false);
      console.error('Failed to initiate call:', error);
      throw error;
    }
  }, [user?.id]);

  const answerCall = useCallback(async (callId: string) => {
    if (!user?.id || !currentCall) return;

    try {
      setIsConnecting(true);
      
      // Update call status to ringing
      await rtpService.updateCallStatus(callId, CallStatus.RINGING);

      // Initialize WebRTC
      await webRTCManager.initializeCall({
        callId,
        matchId: currentCall.match_id,
        isInitiator: false,
        callType: currentCall.call_type,
        localUserId: user.id,
        remoteUserId: currentCall.caller_id,
      });

      // Get local stream
      const stream = await webRTCManager.getLocalStream({
        audio: true,
        video: currentCall.call_type === CallType.VIDEO,
      });

      setLocalStream(stream);
      setIsConnecting(true);
    } catch (error) {
      setIsConnecting(false);
      console.error('Failed to answer call:', error);
      throw error;
    }
  }, [user?.id, currentCall]);

  const rejectCall = useCallback(async (callId: string) => {
    try {
      await rtpService.updateCallStatus(callId, CallStatus.REJECTED);
      setIsInCall(false);
      setCurrentCall(null);
      setCallStatus(null);
    } catch (error) {
      console.error('Failed to reject call:', error);
      throw error;
    }
  }, []);

  const endCall = useCallback(async () => {
    try {
      await webRTCManager.endCall();
      setIsInCall(false);
      setCurrentCall(null);
      setCallStatus(null);
      setIsConnected(false);
      setLocalStream(null);
      setRemoteStream(null);
      stopDurationTimer();
      stopStatsTimer();
    } catch (error) {
      console.error('Failed to end call:', error);
      throw error;
    }
  }, [stopDurationTimer, stopStatsTimer]);

  // Media controls
  const toggleAudio = useCallback(async () => {
    try {
      await webRTCManager.toggleAudio(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  }, [isAudioEnabled]);

  const toggleVideo = useCallback(async () => {
    try {
      await webRTCManager.toggleVideo(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  }, [isVideoEnabled]);

  const switchCamera = useCallback(async () => {
    try {
      await webRTCManager.switchCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  }, []);

  return {
    // Call state
    isInCall,
    callStatus,
    currentCall,
    isConnected,
    
    // Media state
    isAudioEnabled,
    isVideoEnabled,
    localStream,
    remoteStream,
    
    // Call actions
    initiateCall,
    answerCall,
    rejectCall,
    endCall,
    
    // Media controls
    toggleAudio,
    toggleVideo,
    switchCamera,
    
    // Call info
    callDuration,
    callStats,
    
    // Loading states
    isInitializing,
    isConnecting,
  };
} 