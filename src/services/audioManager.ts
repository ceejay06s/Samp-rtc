import { Audio } from 'expo-av';

class AudioManager {
  private static instance: AudioManager;
  private currentSound: Audio.Sound | null = null;
  private currentPlayerId: string | null = null;
  private listeners: Map<string, () => void> = new Map();

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Play audio, stopping any currently playing audio first
   */
  async playAudio(playerId: string, audioUrl: string, onPlaybackStatusUpdate?: (status: any) => void): Promise<Audio.Sound> {
    try {
      // Stop any currently playing audio
      await this.stopCurrentAudio();

      // Create new sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      // Set as current
      this.currentSound = sound;
      this.currentPlayerId = playerId;

      // Play the audio
      await sound.playAsync();

      console.log(`🎵 Audio started playing for player: ${playerId}`);
      return sound;

    } catch (error) {
      console.error('❌ Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Stop the currently playing audio
   */
  async stopCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.stopAsync();
        await this.currentSound.unloadAsync();
        console.log(`🎵 Stopped audio for player: ${this.currentPlayerId}`);
      } catch (error) {
        console.error('❌ Error stopping audio:', error);
      } finally {
        this.currentSound = null;
        this.currentPlayerId = null;
      }
    }
  }

  /**
   * Pause the currently playing audio
   */
  async pauseCurrentAudio(): Promise<void> {
    if (this.currentSound) {
      try {
        await this.currentSound.pauseAsync();
        console.log(`🎵 Paused audio for player: ${this.currentPlayerId}`);
      } catch (error) {
        console.error('❌ Error pausing audio:', error);
      }
    }
  }

  /**
   * Seek to a specific position in the currently playing audio
   */
  async seekToPosition(position: number): Promise<void> {
    if (this.currentSound) {
      try {
        // Validate position value
        if (isNaN(position) || !isFinite(position) || position < 0) {
          throw new Error(`Invalid position value: ${position}`);
        }
        
        const positionMs = position * 1000; // Convert to milliseconds
        
        // Additional validation for milliseconds
        if (isNaN(positionMs) || !isFinite(positionMs) || positionMs < 0) {
          throw new Error(`Invalid position in milliseconds: ${positionMs}`);
        }
        
        console.log(`🎵 Seeking to position: ${position}s (${positionMs}ms)`);
        await this.currentSound.setPositionAsync(positionMs);
        console.log(`✅ Successfully seeked to position: ${position}s`);
      } catch (error) {
        console.error('❌ Error seeking audio:', error);
        throw error;
      }
    } else {
      throw new Error('No audio currently playing');
    }
  }

  /**
   * Check if audio is currently playing
   */
  isPlaying(): boolean {
    return this.currentSound !== null;
  }

  /**
   * Get the ID of the currently playing audio
   */
  getCurrentPlayerId(): string | null {
    return this.currentPlayerId;
  }

  /**
   * Check if a specific player is currently playing
   */
  isPlayerPlaying(playerId: string): boolean {
    return this.currentPlayerId === playerId && this.currentSound !== null;
  }

  /**
   * Register a listener for when audio stops
   */
  addStopListener(playerId: string, callback: () => void): void {
    this.listeners.set(playerId, callback);
  }

  /**
   * Remove a stop listener
   */
  removeStopListener(playerId: string): void {
    this.listeners.delete(playerId);
  }

  /**
   * Notify all listeners that audio has stopped
   */
  private notifyStopListeners(): void {
    this.listeners.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error('❌ Error in stop listener:', error);
      }
    });
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    await this.stopCurrentAudio();
    this.listeners.clear();
  }
}

export default AudioManager;
