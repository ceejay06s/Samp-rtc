import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { config } from '../lib/config'

export default function ConfigExample() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Environment Configuration</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Info</Text>
        <Text style={styles.info}>Name: {config.app.name}</Text>
        <Text style={styles.info}>Version: {config.app.version}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Supabase</Text>
        <Text style={styles.info}>URL: {config.supabase.url ? '✅ Configured' : '❌ Not configured'}</Text>
        <Text style={styles.info}>Key: {config.supabase.anonKey ? '✅ Configured' : '❌ Not configured'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        <Text style={styles.info}>Analytics: {config.features.analytics ? '✅ Enabled' : '❌ Disabled'}</Text>
        <Text style={styles.info}>Crash Reporting: {config.features.crashReporting ? '✅ Enabled' : '❌ Disabled'}</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API</Text>
        <Text style={styles.info}>API Key: {config.api.key ? '✅ Configured' : '❌ Not configured'}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  info: {
    fontSize: 14,
    marginBottom: 4,
    color: '#666',
  },
}) 