import React, { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password')
      return
    }

    try {
      setLoading(true)
      await signIn(email, password)
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Splice</Text>
      <Text style={styles.subtitle}>Officer Portal</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
      </TouchableOpacity>

      <Text style={styles.helperText}>Log in with your Splice account</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000a15',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2DAEFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: '#1a2633',
    borderWidth: 1,
    borderColor: '#2d3e4f',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2DAEFF',
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  helperText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
})
