import { supabase } from '../../lib/supabase';
import { CallStatus, VoiceCall } from '../types';

export interface InitiateCallData {
  matchId: string;
  receiverId: string;
}

export class VoiceCallService {
  static async initiateCall(data: InitiateCallData): Promise<VoiceCall> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: callData, error } = await supabase
        .from('voice_calls')
        .insert({
          match_id: data.matchId,
          caller_id: user.id,
          receiver_id: data.receiverId,
          status: 'pending' as any, // Map CallStatus to VoiceCall status
        })
        .select()
        .single();

      if (error) throw error;
      return callData;
    } catch (error) {
      throw new Error(`Failed to initiate call: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async updateCallStatus(callId: string, status: CallStatus): Promise<VoiceCall> {
    try {
      // Map CallStatus to VoiceCall status
      const voiceCallStatus = status === CallStatus.CONNECTED ? 'active' :
                             status === CallStatus.ENDED ? 'ended' :
                             status === CallStatus.MISSED ? 'missed' :
                             'pending';

      const updateData: any = {
        status: voiceCallStatus,
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
          .from('voice_calls')
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
        .from('voice_calls')
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

  static async getActiveCall(matchId: string): Promise<VoiceCall | null> {
    try {
      const { data, error } = await supabase
        .from('voice_calls')
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

  static async getCallHistory(userId: string, limit: number = 20): Promise<VoiceCall[]> {
    try {
      const { data, error } = await supabase
        .from('voice_calls')
        .select(`
          *,
          match:matches!voice_calls_match_id_fkey(*)
        `)
        .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
        .in('status', [CallStatus.ENDED, CallStatus.MISSED, CallStatus.REJECTED])
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const callsWithProfiles = await Promise.all((data || []).map(async call => {
        const match = call.match;
        const isCaller = call.caller_id === userId;
        const otherUserId = isCaller ? match.user2_id : match.user1_id;
        
        // Fetch the other user's profile separately
        const { data: otherProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', otherUserId)
          .single();
          
        if (profileError) {
          console.error('Failed to fetch other user profile:', profileError);
        }
        
        return {
          ...call,
          otherProfile: otherProfile || null,
        };
      }));

      return callsWithProfiles;
    } catch (error) {
      throw new Error(`Failed to get call history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async subscribeToCalls(userId: string, callback: (call: VoiceCall) => void): Promise<void> {
    supabase
      .channel(`calls:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'voice_calls',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as VoiceCall);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'voice_calls',
          filter: `or(caller_id.eq.${userId},receiver_id.eq.${userId})`,
        },
        (payload) => {
          callback(payload.new as VoiceCall);
        }
      )
      .subscribe();
  }

  static async checkCallPermissions(): Promise<boolean> {
    try {
      // This would integrate with expo-av permissions
      // For now, return true as a placeholder
      return true;
    } catch (error) {
      return false;
    }
  }

  static async getCallStats(userId: string): Promise<{
    totalCalls: number;
    totalDuration: number;
    averageDuration: number;
    missedCalls: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('voice_calls')
        .select('status, duration')
        .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
        .in('status', [CallStatus.ENDED, CallStatus.MISSED, CallStatus.REJECTED]);

      if (error) throw error;

      const calls = data || [];
      const totalCalls = calls.length;
      const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
      const averageDuration = totalCalls > 0 ? totalDuration / totalCalls : 0;
      const missedCalls = calls.filter(call => call.status === CallStatus.MISSED).length;

      return {
        totalCalls,
        totalDuration,
        averageDuration: Math.round(averageDuration),
        missedCalls,
      };
    } catch (error) {
      throw new Error(`Failed to get call stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 