import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginScreen from './screens/LoginScreen'
import RecordingScreen from './screens/RecordingScreen'

const Stack = createNativeStackNavigator()

function RootNavigator() {
  const { session, loading } = useAuth()

  if (loading) {
    return null
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {session ? (
        <Stack.Screen name="Recording" component={RecordingScreen} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <StatusBar barStyle="light-content" />
    </AuthProvider>
  )
}
