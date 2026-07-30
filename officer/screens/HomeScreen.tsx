import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'

export default function HomeScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hey Dana 👋</Text>
        <TouchableOpacity>
          <Text style={styles.notification}>🔔</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.progressLabel}>THIS WEEK</Text>
        <Text style={styles.progressValue}>2 of 3 done</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '66%' }]} />
        </View>
        <Text style={styles.streak}>3-DAY STREAK 🔥</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ASSIGNED SCRIPTS</Text>
        <TouchableOpacity style={styles.scriptCard}>
          <Text style={styles.scriptTitle}>Refi breakeven analysis</Text>
          <Text style={styles.scriptStatus}>IN PROGRESS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity
          style={styles.composeCard}
          onPress={() => navigation.navigate('Compose')}
        >
          <Text style={styles.composeText}>Write your own script</Text>
          <Text style={styles.composeSubtext}>YOUR IDEA, BROKEN INTO SCENES</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
    paddingTop: 20,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0C2033',
  },
  notification: {
    fontSize: 20,
  },
  progressCard: {
    backgroundColor: '#0C2033',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4BC8F2',
    marginBottom: 4,
    letterSpacing: 1,
  },
  progressValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#23405A',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4BC8F2',
  },
  streak: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A8891',
    marginBottom: 12,
    letterSpacing: 1,
  },
  scriptCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCE4EA',
  },
  scriptTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0C2033',
    marginBottom: 8,
  },
  scriptStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0A6C95',
    backgroundColor: '#E2F5FC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    letterSpacing: 0.5,
  },
  composeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C3CDD4',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  composeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0C2033',
    marginBottom: 4,
  },
  composeSubtext: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7A8891',
    letterSpacing: 0.5,
  },
})
