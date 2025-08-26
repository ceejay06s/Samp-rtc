/**
 * App Configuration
 * This file helps control various intervals and timers to prevent excessive reloading
 */

export const APP_CONFIG = {
  // Notification intervals
  NOTIFICATIONS: {
    IN_APP_UPDATE_INTERVAL: 10000, // 10 seconds (was 1 second)
    PUSH_CHECK_INTERVAL: 30000, // 30 seconds
  },

  // RTP Call intervals
  RTP_CALL: {
    DURATION_UPDATE_INTERVAL: 5000, // 5 seconds (was 1 second)
    STATS_UPDATE_INTERVAL: 10000, // 10 seconds (was 5 seconds)
  },

  // App state change intervals
  APP_STATE: {
    UPDATE_INTERVAL: 30000, // 30 seconds (was 5 seconds)
    STATUS_UPDATE_DELAY: 2000, // 2 seconds (was 1 second)
  },

  // Session checking
  SESSION: {
    CHECK_INTERVAL: 15 * 60 * 1000, // 15 minutes (was 5 minutes)
  },

  // Location updates
  LOCATION: {
    MIN_UPDATE_INTERVAL: 30 * 60 * 1000, // 30 minutes
    MIN_APP_STATE_UPDATE_INTERVAL: 15 * 60 * 1000, // 15 minutes
    INITIAL_DELAY: 3000, // 3 seconds
    APP_STATE_CHANGE_DELAY: 5000, // 5 seconds
  },

  // Online status
  ONLINE_STATUS: {
    POLLING_INTERVAL: 30000, // 30 seconds
    UPDATE_DELAY: 2000, // 2 seconds
  },

  // Auto-scroll carousel
  CAROUSEL: {
    AUTO_SCROLL_INTERVAL: 5000, // 5 seconds
  },

  // Voice message player
  VOICE_PLAYER: {
    POSITION_UPDATE_INTERVAL: 1000, // 1 second (keep this for smooth playback)
  },

  // Recording timers
  RECORDING: {
    TIMER_INTERVAL: 1000, // 1 second (keep this for accurate recording time)
  },

  // Development mode settings
  DEVELOPMENT: {
    ENABLE_VERBOSE_LOGGING: false,
    REDUCE_INTERVALS: true, // Reduce intervals in development to prevent reloading
    DISABLE_AUTO_SCROLL: true, // Completely disable auto-scroll in development
    DISABLE_VOICE_PLAYER_UPDATES: true, // Disable voice player position updates in development
    DISABLE_RECORDING_TIMERS: true, // Disable recording timers in development
    DISABLE_AUTO_LOCATION: true, // Completely disable auto-location in development to stop infinite loops
  },
};

/**
 * Get interval value with development mode consideration
 */
export const getInterval = (key: keyof typeof APP_CONFIG, subKey: string): number => {
  const config = APP_CONFIG[key] as any;
  const value = config[subKey];
  
  if (APP_CONFIG.DEVELOPMENT.REDUCE_INTERVALS && value > 1000) {
    // In development, increase intervals to prevent excessive reloading
    return Math.min(value * 2, 60000); // Max 1 minute
  }
  
  return value;
};

/**
 * Check if we're in development mode
 */
export const isDevelopment = (): boolean => {
  return __DEV__ || process.env.NODE_ENV === 'development';
};

/**
 * Get optimized intervals for current environment
 */
export const getOptimizedIntervals = () => {
  if (isDevelopment()) {
    return {
      notifications: APP_CONFIG.NOTIFICATIONS.IN_APP_UPDATE_INTERVAL * 2,
      rtpCall: {
        duration: APP_CONFIG.RTP_CALL.DURATION_UPDATE_INTERVAL * 2,
        stats: APP_CONFIG.RTP_CALL.STATS_UPDATE_INTERVAL * 2,
      },
      appState: APP_CONFIG.APP_STATE.UPDATE_INTERVAL * 2,
      session: APP_CONFIG.SESSION.CHECK_INTERVAL * 2,
    };
  }
  
  return {
    notifications: APP_CONFIG.NOTIFICATIONS.IN_APP_UPDATE_INTERVAL,
    rtpCall: {
      duration: APP_CONFIG.RTP_CALL.DURATION_UPDATE_INTERVAL,
      stats: APP_CONFIG.RTP_CALL.STATS_UPDATE_INTERVAL,
    },
    appState: APP_CONFIG.APP_STATE.UPDATE_INTERVAL,
    session: APP_CONFIG.SESSION.CHECK_INTERVAL,
  };
};
