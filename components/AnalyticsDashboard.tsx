import { useAnalytics } from '@/hooks/useAnalytics'
import { config } from '@/lib/config'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export default function AnalyticsDashboard() {
  const [eventCount, setEventCount] = useState(0)
  const { 
    trackButtonClick, 
    trackUserAction, 
    trackEvent, 
    trackScreenView,
    setUserProperties 
  } = useAnalytics()

  const handleTestEvent = (eventType: string) => {
    setEventCount(prev => prev + 1)
    
    switch (eventType) {
      case 'button_click':
        trackButtonClick('test_button', { 
          testId: 'analytics_dashboard',
          eventCount: eventCount + 1 
        })
        break
      case 'user_action':
        trackUserAction('test_action', { 
          actionType: 'analytics_test',
          eventCount: eventCount + 1 
        })
        break
      case 'custom_event':
        trackEvent('test_custom_event', { 
          customProperty: 'test_value',
          eventCount: eventCount + 1 
        })
        break
      case 'screen_view':
        trackScreenView('Analytics Dashboard', { 
          source: 'test',
          eventCount: eventCount + 1 
        })
        break
    }
  }

  const handleSetUserProperties = () => {
    setUserProperties({
      testProperty: 'test_value',
      lastTestTime: new Date().toISOString(),
      testCount: eventCount,
    })
    trackUserAction('user_properties_set', { testCount: eventCount })
  }

  const TestButton = ({ title, onPress, color = '#007AFF' }: { 
    title: string; 
    onPress: () => void; 
    color?: string;
  }) => (
    <TouchableOpacity
      style={[styles.testButton, { backgroundColor: color }]}
      onPress={onPress}
    >
      <Text style={styles.testButtonText}>{title}</Text>
    </TouchableOpacity>
  )

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Analytics Dashboard</Text>
      
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Status</Text>
        <Text style={styles.statusText}>
          Analytics: {config.features.analytics ? '✅ Enabled' : '❌ Disabled'}
        </Text>
        <Text style={styles.statusText}>
          Events Tracked: {eventCount}
        </Text>
        <Text style={styles.statusText}>
          App Version: {config.app.version}
        </Text>
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>Test Events</Text>
        
        <TestButton
          title="Test Button Click"
          onPress={() => handleTestEvent('button_click')}
          color="#007AFF"
        />
        
        <TestButton
          title="Test User Action"
          onPress={() => handleTestEvent('user_action')}
          color="#34C759"
        />
        
        <TestButton
          title="Test Custom Event"
          onPress={() => handleTestEvent('custom_event')}
          color="#FF9500"
        />
        
        <TestButton
          title="Test Screen View"
          onPress={() => handleTestEvent('screen_view')}
          color="#AF52DE"
        />
        
        <TestButton
          title="Set User Properties"
          onPress={handleSetUserProperties}
          color="#FF3B30"
        />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Information</Text>
        <Text style={styles.infoText}>
          • Analytics events are logged to the console when enabled
        </Text>
        <Text style={styles.infoText}>
          • Check your browser/device console to see events
        </Text>
        <Text style={styles.infoText}>
          • Events include user context when available
        </Text>
        <Text style={styles.infoText}>
          • To enable real analytics, configure your provider in lib/analytics.ts
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  statusSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  testSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  testButton: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
    lineHeight: 20,
  },
}) 