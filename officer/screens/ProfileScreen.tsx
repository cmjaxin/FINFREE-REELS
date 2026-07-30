import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>ProfileScreen</Text>
      <Text style={styles.subtitle}>(Placeholder — coming soon)</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F8FA',
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C2033',
  },
  subtitle: {
    fontSize: 14,
    color: '#7A8891',
    marginTop: 8,
  },
})
