import React, { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { View, Text, ActivityIndicator } from 'react-native'
import { getSession } from './lib/supabase/auth'

import LoginScreen from './screens/LoginScreen'
import HomeScreen from './screens/HomeScreen'
import ComposeScreen from './screens/ComposeScreen'
import ScriptDetailScreen from './screens/ScriptDetailScreen'
import RecordScreen from './screens/RecordScreen'
import ReviewScreen from './screens/ReviewScreen'
import ProcessingScreen from './screens/ProcessingScreen'
import FinishedScreen from './screens/FinishedScreen'
import VideosScreen from './screens/VideosScreen'
import ProfileScreen from './screens/ProfileScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  )
}

function ScriptsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="Compose" component={ComposeScreen} />
      <Stack.Screen name="ScriptDetail" component={ScriptDetailScreen} />
      <Stack.Screen name="Record" component={RecordScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="Processing" component={ProcessingScreen} />
      <Stack.Screen name="Finished" component={FinishedScreen} />
    </Stack.Navigator>
  )
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarActiveTintColor: '#4BC8F2',
        tabBarInactiveTintColor: '#7A8891',
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopColor: '#DCE4EA',
          borderTopWidth: 1,
          height: 76,
          paddingBottom: 20,
        },
      }}
    >
      <Tab.Screen
        name="Scripts"
        component={ScriptsStack}
        options={{
          tabBarLabel: 'Scripts',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📝</Text>,
        }}
      />
      <Tab.Screen
        name="Videos"
        component={VideosScreen}
        options={{
          tabBarLabel: 'Videos',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🎬</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await getSession()
        setIsSignedIn(!!data?.session)
      } catch (e) {
        console.error('Error checking session:', e)
      } finally {
        setIsLoaded(true)
      }
    }

    bootstrap()
  }, [])

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {isSignedIn ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
