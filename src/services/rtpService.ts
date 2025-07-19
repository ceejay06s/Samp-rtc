import { supabase } from '../../lib/supabase';
import {
    CallStatus,
    CallType,
    RTPCall,
    RTPCallQuality,
    RTPCallStats,
    RTPConnection,
    RTPIceCandidate,
    RTPOffer
} from '../types';

export interface RTPCallData {
  matchId: string;
  receiverId: string;
  callType: CallType;
}

export interface RTPConnectionData {
  callId: string;
  userId: string;
  peerConnectionId: string;
}

export interface RTPOfferData {
  callId: string;
  fromUserId: string;
  toUserId: string;
  sdp: string;
  type: 'offer' | 'answer';
}

export interface RTPIceCandidateData {
  connectionId: string;
  candidate: string;
  sdpMid?: string;
  sdpMLineIndex?: number;
}

export class RTPService {
  private static instance: RTPService;
  private activeConnections: Map<string, RTPConnection> = new Map();
  private callSubscriptions: Map<string, any> = new Map();
  private offerSubscriptions: Map<string, any> = new Map();
  private iceCandidateSubscriptions: Map<string, any> = new Map();

  static getInstance(): RTPService {
    if (!RTPService.instance) {
      RTPService.instance = new RTPService();
    }
    return RTPService.instance;
  }

  // Call Management
  async initiateCall(data: RTPCallData): Promise<RTPCall> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: callData, error } = await supabase
        .from('rtp_calls')
        .insert({
          match_id: data.matchId,
          caller_id: user.id,
          receiver_id: data.receiverId,
          call_type: data.callType,
          status: CallStatus.INITIATED,
        })
        .select()
        .single();

      if (error) throw error;
      return callData;
    } catch (error) {
      throw new Error(`Failed to initiate call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateCallStatus(callId: string, status: CallStatus): Promise<RTPCall> {
    try {
      const updateData: Partial<RTPCall> = {
        status,
        updated_at: new Date().toISOString(),
      };

      // Set start time when call connects
      if (status === CallStatus.CONNECTED) {
        updateData.start_time = new Date().toISOString();
      }

      // Set end time and calculate duration when call ends
      if ([CallStatus.ENDED, CallStatus.MISSED, CallStatus.REJECTED].includes(status)) {
        updateData.end_time = new Date().toISOString();
        
        // Calculate duration if start time exists
        const { data: existingCall } = await supabase
          .from('rtp_calls')
          .select('start_time')
          .eq('id', callId)
          .single();

        if (existingCall?.start_time) {
          const startTime = new Date(existingCall.start_time).getTime();
          const endTime = new Date().getTime();
          updateData.duration = Math.round((endTime - startTime) / 1000); // Duration in seconds
        }
      }

      const { data, error } = await supabase
        .from('rtp_calls')
        .update(updateData)
        .eq('id', callId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(`Failed to update call status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getActiveCall(matchId: string): Promise<RTPCall | null> {
    try {
      const { data, error } = await supabase
        .from('rtp_calls')
        .select('*')
        .eq('match_id', matchId)
        .in('status', [CallStatus.INITIATED, CallStatus.RINGING, CallStatus.CONNECTED])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      return data || null;
    } catch (error) {
      throw new Error(`Failed to get active call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCallHistory(userId: string, limit: number = 20): Promise<RTPCall[]> {
    try {
      const { data, error } = await supabase
        .from('rtp_calls')
        .select(`
          *,
          match:matches!rtp_calls_match_id_fkey(*)
        `)
        .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
        .in('status', [CallStatus.ENDED, CallStatus.MISSED, CallStatus.REJECTED])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to get call history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Connection Management
  async createConnection(data: RTPConnectionData): Promise<RTPConnection> {
    try {
      const { data: connectionData, error } = await supabase
        .from('rtp_connections')
        .insert({
          call_id: data.callId,
          user_id: data.userId,
          peer_connection_id: data.peerConnectionId,
          is_connected: false,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Store in local cache
      this.activeConnections.set(data.callId, connectionData);
      
      return connectionData;
    } catch (error) {
      throw new Error(`Failed to create connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateConnection(connectionId: string, updates: Partial<RTPConnection>): Promise<RTPConnection> {
    try {
      const { data, error } = await supabase
        .from('rtp_connections')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', connectionId)
        .select()
        .single();

      if (error) throw error;
      
      // Update local cache
      if (data.call_id) {
        this.activeConnections.set(data.call_id, data);
      }
      
      return data;
    } catch (error) {
      throw new Error(`Failed to update connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getConnection(callId: string): Promise<RTPConnection | null> {
    try {
      // Check local cache first
      const cachedConnection = this.activeConnections.get(callId);
      if (cachedConnection) return cachedConnection;

      const { data, error } = await supabase
        .from('rtp_connections')
        .select('*')
        .eq('call_id', callId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        this.activeConnections.set(callId, data);
      }
      
      return data || null;
    } catch (error) {
      throw new Error(`Failed to get connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // SDP Offer/Answer Management
  async createOffer(data: RTPOfferData): Promise<RTPOffer> {
    try {
      const { data: offerData, error } = await supabase
        .from('rtp_offers')
        .insert({
          call_id: data.callId,
          from_user_id: data.fromUserId,
          to_user_id: data.toUserId,
          sdp: data.sdp,
          type: data.type,
        })
        .select()
        .single();

      if (error) throw error;
      return offerData;
    } catch (error) {
      throw new Error(`Failed to create offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getLatestOffer(callId: string, type: 'offer' | 'answer'): Promise<RTPOffer | null> {
    try {
      const { data, error } = await supabase
        .from('rtp_offers')
        .select('*')
        .eq('call_id', callId)
        .eq('type', type)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      throw new Error(`Failed to get latest offer: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ICE Candidate Management
  async addIceCandidate(data: RTPIceCandidateData): Promise<RTPIceCandidate> {
    try {
      const { data: candidateData, error } = await supabase
        .from('rtp_ice_candidates')
        .insert({
          connection_id: data.connectionId,
          candidate: data.candidate,
          sdp_mid: data.sdpMid,
          sdp_mline_index: data.sdpMLineIndex,
        })
        .select()
        .single();

      if (error) throw error;
      return candidateData;
    } catch (error) {
      throw new Error(`Failed to add ICE candidate: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getIceCandidates(connectionId: string): Promise<RTPIceCandidate[]> {
    try {
      const { data, error } = await supabase
        .from('rtp_ice_candidates')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw new Error(`Failed to get ICE candidates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Real-time Subscriptions
  async subscribeToCalls(userId: string, callback: (call: RTPCall) => void): Promise<void> {
    const channel = supabase
      .channel(`rtp_calls:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rtp_calls',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as RTPCall);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rtp_calls',
          filter: `or(caller_id.eq.${userId},receiver_id.eq.${userId})`,
        },
        (payload) => {
          callback(payload.new as RTPCall);
        }
      )
      .subscribe();

    this.callSubscriptions.set(userId, channel);
  }

  async subscribeToOffers(callId: string, callback: (offer: RTPOffer) => void): Promise<void> {
    const channel = supabase
      .channel(`rtp_offers:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rtp_offers',
          filter: `call_id=eq.${callId}`,
        },
        (payload) => {
          callback(payload.new as RTPOffer);
        }
      )
      .subscribe();

    this.offerSubscriptions.set(callId, channel);
  }

  async subscribeToIceCandidates(connectionId: string, callback: (candidate: RTPIceCandidate) => void): Promise<void> {
    const channel = supabase
      .channel(`rtp_ice:${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rtp_ice_candidates',
          filter: `connection_id=eq.${connectionId}`,
        },
        (payload) => {
          callback(payload.new as RTPIceCandidate);
        }
      )
      .subscribe();

    this.iceCandidateSubscriptions.set(connectionId, channel);
  }

  // Unsubscribe from channels
  async unsubscribeFromCalls(userId: string): Promise<void> {
    const channel = this.callSubscriptions.get(userId);
    if (channel) {
      await supabase.removeChannel(channel);
      this.callSubscriptions.delete(userId);
    }
  }

  async unsubscribeFromOffers(callId: string): Promise<void> {
    const channel = this.offerSubscriptions.get(callId);
    if (channel) {
      await supabase.removeChannel(channel);
      this.offerSubscriptions.delete(callId);
    }
  }

  async unsubscribeFromIceCandidates(connectionId: string): Promise<void> {
    const channel = this.iceCandidateSubscriptions.get(connectionId);
    if (channel) {
      await supabase.removeChannel(channel);
      this.iceCandidateSubscriptions.delete(connectionId);
    }
  }

  // Call Statistics
  async getCallStats(userId: string): Promise<RTPCallStats> {
    try {
      const { data, error } = await supabase
        .from('rtp_calls')
        .select('status, duration')
        .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
        .in('status', [CallStatus.ENDED, CallStatus.MISSED, CallStatus.REJECTED]);

      if (error) throw error;

      const calls = data || [];
      const totalCalls = calls.length;
      const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
      const averageDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
      const missedCalls = calls.filter(call => call.status === CallStatus.MISSED).length;
      const successfulCalls = calls.filter(call => call.status === CallStatus.ENDED).length;

      return {
        total_calls: totalCalls,
        total_duration: totalDuration,
        average_duration: Math.round(averageDuration),
        missed_calls: missedCalls,
        successful_calls: successfulCalls,
        call_quality_rating: 0, // TODO: Implement quality rating
      };
    } catch (error) {
      throw new Error(`Failed to get call stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Call Quality Monitoring
  async reportCallQuality(data: Omit<RTPCallQuality, 'id' | 'timestamp'>): Promise<void> {
    try {
      await supabase
        .from('rtp_call_quality')
        .insert({
          call_id: data.call_id,
          user_id: data.user_id,
          audio_level: data.audio_level,
          video_quality: data.video_quality,
          network_latency: data.network_latency,
          packet_loss: data.packet_loss,
          jitter: data.jitter,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to report call quality:', error);
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Unsubscribe from all channels
    for (const [userId] of this.callSubscriptions) {
      await this.unsubscribeFromCalls(userId);
    }
    
    for (const [callId] of this.offerSubscriptions) {
      await this.unsubscribeFromOffers(callId);
    }
    
    for (const [connectionId] of this.iceCandidateSubscriptions) {
      await this.unsubscribeFromIceCandidates(connectionId);
    }

    // Clear local caches
    this.activeConnections.clear();
    this.callSubscriptions.clear();
    this.offerSubscriptions.clear();
    this.iceCandidateSubscriptions.clear();
  }
}

export default RTPService; 