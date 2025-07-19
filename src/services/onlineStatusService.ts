import { supabase } from '../../lib/supabase';

export interface OnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen: string;
}

export class OnlineStatusService {
  private static instance: OnlineStatusService;
  private pollingIntervals: Map<string, any> = new Map();
  private callbacks: Map<string, (status: OnlineStatus[]) => void> = new Map();

  static getInstance(): OnlineStatusService {
    if (!OnlineStatusService.instance) {
      OnlineStatusService.instance = new OnlineStatusService();
    }
    return OnlineStatusService.instance;
  }

  // Start polling for online status
  async startPolling(userIds: string[], callback: (status: OnlineStatus[]) => void, intervalMs: number = 30000): Promise<void> {
    try {
      const key = userIds.sort().join(',');
      
      // Stop existing polling if any
      this.stopPolling(userIds);
      
      // Store callback
      this.callbacks.set(key, callback);
      
      // Initial fetch
      await this.fetchOnlineStatus(userIds, callback);
      
      // Start polling
      const interval = setInterval(async () => {
        await this.fetchOnlineStatus(userIds, callback);
      }, intervalMs);
      
      this.pollingIntervals.set(key, interval);
      
      console.log('🔄 Started online status polling for users:', userIds);
    } catch (error) {
      console.error('❌ Failed to start online status polling:', error);
    }
  }

  // Stop polling for specific users
  stopPolling(userIds: string[]): void {
    const key = userIds.sort().join(',');
    const interval = this.pollingIntervals.get(key);
    
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(key);
      this.callbacks.delete(key);
      console.log('🛑 Stopped online status polling for users:', userIds);
    }
  }

  // Stop all polling
  stopAllPolling(): void {
    for (const [key, interval] of this.pollingIntervals) {
      clearInterval(interval);
    }
    this.pollingIntervals.clear();
    this.callbacks.clear();
    console.log('🛑 Stopped all online status polling');
  }

  // Fetch online status for users
  private async fetchOnlineStatus(userIds: string[], callback: (status: OnlineStatus[]) => void): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, is_online, last_seen')
        .in('user_id', userIds);

      if (error) {
        console.error('❌ Failed to fetch online status:', error);
        return;
      }

      const statuses: OnlineStatus[] = (data || []).map(profile => ({
        userId: profile.user_id,
        isOnline: profile.is_online || false,
        lastSeen: profile.last_seen,
      }));

      callback(statuses);
    } catch (error) {
      console.error('❌ Error fetching online status:', error);
    }
  }

  // Update own online status
  async updateOwnStatus(isOnline: boolean): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: isOnline ? null : new Date().toISOString(),
        })
        .eq('user_id', user.id);

      console.log('🟢 Own online status updated:', isOnline);
    } catch (error) {
      console.error('❌ Failed to update own online status:', error);
    }
  }
} 