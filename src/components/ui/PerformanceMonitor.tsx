import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../utils/themes';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  intervalCount: number;
  timeoutCount: number;
}

export const PerformanceMonitor: React.FC = () => {
  const theme = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    lastRenderTime: Date.now(),
    intervalCount: 0,
    timeoutCount: 0,
  });
  
  const renderCountRef = useRef(0);
  const intervalCountRef = useRef(0);
  const timeoutCountRef = useRef(0);

  // Monitor render frequency
  useEffect(() => {
    renderCountRef.current += 1;
    const now = Date.now();
    
    setMetrics(prev => ({
      ...prev,
      renderCount: renderCountRef.current,
      lastRenderTime: now,
    }));

    // Log if renders are happening too frequently
    if (renderCountRef.current > 100) {
      console.warn('⚠️ High render count detected:', renderCountRef.current);
    }
  });

  // Monitor intervals and timeouts
  useEffect(() => {
    const originalSetInterval = global.setInterval;
    const originalSetTimeout = global.setTimeout;

    global.setInterval = (...args) => {
      intervalCountRef.current += 1;
      setMetrics(prev => ({ ...prev, intervalCount: intervalCountRef.current }));
      console.log('🔄 setInterval called:', intervalCountRef.current, 'times');
      return originalSetInterval(...args);
    };

    global.setTimeout = (...args) => {
      timeoutCountRef.current += 1;
      setMetrics(prev => ({ ...prev, timeoutCount: timeoutCountRef.current }));
      console.log('⏰ setTimeout called:', timeoutCountRef.current, 'times');
      return originalSetTimeout(...args);
    };

    return () => {
      global.setInterval = originalSetInterval;
      global.setTimeout = originalSetTimeout;
    };
  }, []);

  // Calculate render frequency
  const renderFrequency = metrics.renderCount > 1 
    ? Math.round(1000 / (Date.now() - metrics.lastRenderTime))
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Performance Monitor
      </Text>
      <Text style={[styles.metric, { color: theme.colors.textSecondary }]}>
        Renders: {metrics.renderCount}
      </Text>
      <Text style={[styles.metric, { color: theme.colors.textSecondary }]}>
        Render Frequency: {renderFrequency}/sec
      </Text>
      <Text style={[styles.metric, { color: theme.colors.textSecondary }]}>
        Intervals: {metrics.intervalCount}
      </Text>
      <Text style={[styles.metric, { color: theme.colors.textSecondary }]}>
        Timeouts: {metrics.timeoutCount}
      </Text>
      <Text style={[styles.warning, { color: theme.colors.warning }]}>
        {renderFrequency > 10 ? '⚠️ High render frequency!' : '✅ Normal performance'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metric: {
    fontSize: 14,
    marginBottom: 4,
  },
  warning: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
});
