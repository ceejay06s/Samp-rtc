import { CallStatus, CallType, RTPCall, RTPConnection } from '../types';
import RTPService from './rtpService';

export interface WebRTCCallConfig {
  callId: string;
  matchId: string;
  isInitiator: boolean;
  callType: CallType;
  localUserId: string;
  remoteUserId: string;
}

export interface MediaStreamConfig {
  audio: boolean;
  video: boolean;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export class WebRTCManager {
  private static instance: WebRTCManager;
  private rtpService: RTPService;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentCall: RTPCall | null = null;
  private currentConnection: RTPConnection | null = null;
  private isConnected = false;
  private callbacks: {
    onCallStateChange?: (status: CallStatus) => void;
    onLocalStream?: (stream: MediaStream) => void;
    onRemoteStream?: (stream: MediaStream) => void;
    onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
    onIceConnectionStateChange?: (state: RTCIceConnectionState) => void;
    onError?: (error: Error) => void;
  } = {};

  private constructor() {
    this.rtpService = RTPService.getInstance();
  }

  static getInstance(): WebRTCManager {
    if (!WebRTCManager.instance) {
      WebRTCManager.instance = new WebRTCManager();
    }
    return WebRTCManager.instance;
  }

  // Initialize WebRTC for a call
  async initializeCall(config: WebRTCCallConfig): Promise<void> {
    try {
      this.currentCall = await this.rtpService.getActiveCall(config.matchId);
      if (!this.currentCall) {
        throw new Error('No active call found');
      }

      // Create peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // Add TURN servers for production
          // { urls: 'turn:your-turn-server.com:3478', username: 'username', credential: 'password' }
        ],
        iceCandidatePoolSize: 10,
      });

      // Set up event handlers
      this.setupPeerConnectionHandlers();

      // Create connection record
      this.currentConnection = await this.rtpService.createConnection({
        callId: config.callId,
        userId: config.localUserId,
        peerConnectionId: config.callId, // Use callId as connection identifier
      });

      // Subscribe to signaling
      await this.setupSignaling(config.callId);

      console.log('WebRTC call initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebRTC call:', error);
      throw error;
    }
  }

  // Set up peer connection event handlers
  private setupPeerConnectionHandlers(): void {
    if (!this.peerConnection) return;

    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate && this.currentConnection) {
        try {
          await this.rtpService.addIceCandidate({
            connectionId: this.currentConnection.id,
            candidate: event.candidate.candidate,
            sdpMid: event.candidate.sdpMid || undefined,
            sdpMLineIndex: event.candidate.sdpMLineIndex || undefined,
          });
        } catch (error) {
          console.error('Failed to add ICE candidate:', error);
        }
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state changed:', state);
      this.callbacks.onConnectionStateChange?.(state || 'closed');
      
      if (state === 'connected') {
        this.isConnected = true;
        this.callbacks.onCallStateChange?.(CallStatus.CONNECTED);
      } else if (state === 'failed' || state === 'disconnected') {
        this.isConnected = false;
        this.callbacks.onCallStateChange?.(CallStatus.ENDED);
      }
    };

    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('ICE connection state changed:', state);
      this.callbacks.onIceConnectionStateChange?.(state || 'closed');
    };

    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      this.remoteStream = event.streams[0];
      this.callbacks.onRemoteStream?.(this.remoteStream);
    };
  }

  // Set up signaling subscriptions
  private async setupSignaling(callId: string): Promise<void> {
    // Subscribe to offers
    await this.rtpService.subscribeToOffers(callId, async (offer) => {
      try {
        if (offer.type === 'offer') {
          await this.handleOffer(offer.sdp);
        } else if (offer.type === 'answer') {
          await this.handleAnswer(offer.sdp);
        }
      } catch (error) {
        console.error('Failed to handle offer/answer:', error);
        this.callbacks.onError?.(error as Error);
      }
    });

    // Subscribe to ICE candidates
    if (this.currentConnection) {
      await this.rtpService.subscribeToIceCandidates(this.currentConnection.id, async (candidate) => {
        try {
          await this.handleIceCandidate(candidate);
        } catch (error) {
          console.error('Failed to handle ICE candidate:', error);
        }
      });
    }
  }

  // Get local media stream
  async getLocalStream(config: MediaStreamConfig): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: config.audio ? {
          echoCancellation: config.echoCancellation ?? true,
          noiseSuppression: config.noiseSuppression ?? true,
          autoGainControl: config.autoGainControl ?? true,
        } : false,
        video: config.video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        } : false,
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Add tracks to peer connection
      if (this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
      }

      this.callbacks.onLocalStream?.(this.localStream);
      return this.localStream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      throw error;
    }
  }

  // Create and send offer
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);

      // Send offer through signaling
      if (this.currentCall) {
        await this.rtpService.createOffer({
          callId: this.currentCall.id,
          fromUserId: this.currentCall.caller_id,
          toUserId: this.currentCall.receiver_id,
          sdp: offer.sdp!,
          type: 'offer',
        });
      }

      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  // Handle incoming offer
  async handleOffer(sdp: string): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = new RTCSessionDescription({ type: 'offer', sdp });
      await this.peerConnection.setRemoteDescription(offer);

      // Create and send answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Send answer through signaling
      if (this.currentCall) {
        await this.rtpService.createOffer({
          callId: this.currentCall.id,
          fromUserId: this.currentCall.receiver_id,
          toUserId: this.currentCall.caller_id,
          sdp: answer.sdp!,
          type: 'answer',
        });
      }
    } catch (error) {
      console.error('Failed to handle offer:', error);
      throw error;
    }
  }

  // Handle incoming answer
  async handleAnswer(sdp: string): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const answer = new RTCSessionDescription({ type: 'answer', sdp });
      await this.peerConnection.setRemoteDescription(answer);
    } catch (error) {
      console.error('Failed to handle answer:', error);
      throw error;
    }
  }

  // Handle ICE candidate
  async handleIceCandidate(candidate: any): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const iceCandidate = new RTCIceCandidate({
        candidate: candidate.candidate,
        sdpMid: candidate.sdp_mid,
        sdpMLineIndex: candidate.sdp_mline_index,
      });

      await this.peerConnection.addIceCandidate(iceCandidate);
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
      throw error;
    }
  }

  // Toggle audio
  async toggleAudio(enabled: boolean): Promise<void> {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
      }
    }
  }

  // Toggle video
  async toggleVideo(enabled: boolean): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
      }
    }
  }

  // Switch camera (for video calls)
  async switchCamera(): Promise<void> {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities();
        if (capabilities.facingMode) {
          const facingMode = videoTrack.getSettings().facingMode;
          const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
          
          await videoTrack.applyConstraints({
            facingMode: newFacingMode
          });
        }
      }
    }
  }

  // Get call statistics
  async getCallStats(): Promise<RTCStatsReport | null> {
    if (!this.peerConnection) return null;

    try {
      return await this.peerConnection.getStats();
    } catch (error) {
      console.error('Failed to get call stats:', error);
      return null;
    }
  }

  // End call
  async endCall(): Promise<void> {
    try {
      // Update call status
      if (this.currentCall) {
        await this.rtpService.updateCallStatus(this.currentCall.id, CallStatus.ENDED);
      }

      // Stop local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }

      // Close peer connection
      if (this.peerConnection) {
        this.peerConnection.close();
        this.peerConnection = null;
      }

      // Unsubscribe from signaling
      if (this.currentCall) {
        await this.rtpService.unsubscribeFromOffers(this.currentCall.id);
      }

      if (this.currentConnection) {
        await this.rtpService.unsubscribeFromIceCandidates(this.currentConnection.id);
      }

      // Reset state
      this.currentCall = null;
      this.currentConnection = null;
      this.isConnected = false;
      this.remoteStream = null;

      console.log('Call ended successfully');
    } catch (error) {
      console.error('Failed to end call:', error);
      throw error;
    }
  }

  // Set callbacks
  setCallbacks(callbacks: typeof this.callbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  // Get current state
  getCurrentState() {
    return {
      isConnected: this.isConnected,
      currentCall: this.currentCall,
      currentConnection: this.currentConnection,
      localStream: this.localStream,
      remoteStream: this.remoteStream,
      peerConnectionState: this.peerConnection?.connectionState,
      iceConnectionState: this.peerConnection?.iceConnectionState,
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    await this.endCall();
    await this.rtpService.cleanup();
  }
}

export default WebRTCManager; 