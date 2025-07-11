import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { supabase } from '../lib/supabase'

export default function SupabaseExample() {
  const [message, setMessage] = useState<string>('Loading...')

  useEffect(() => {
    // Example: Test Supabase connection
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('your_table_name').select('*').limit(1)
        
        if (error) {
          setMessage(`Error: ${error.message}`)
        } else {
          setMessage(`Connected to Supabase! Found ${data?.length || 0} records.`)
        }
      } catch (err) {
        setMessage(`Connection failed: ${err}`)
      }
    }

    testConnection()
  }, [])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connection Test</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
}) 