import React, { useState, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as FileSystem from 'expo-file-system'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function RecordingScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const cameraRef = useRef<CameraView>(null)
  const { user, signOut } = useAuth()

  if (!permission) {
    return <View style={styles.container}><Text>Requesting camera permissions...</Text></View>
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Camera access required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const startRecording = async () => {
    if (!cameraRef.current) return

    try {
      setRecording(true)
      const video = await cameraRef.current.recordAsync()
      setRecording(false)

      if (video?.uri) {
        await uploadVideo(video.uri)
      }
    } catch (error) {
      setRecording(false)
      Alert.alert('Error', 'Failed to record video')
    }
  }

  const stopRecording = async () => {
    if (cameraRef.current) {
      cameraRef.current.stopRecording()
    }
  }

  const uploadVideo = async (uri: string) => {
    try {
      setUploading(true)
      const filename = `${user?.id}/${Date.now()}.mp4`
      
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const { error } = await supabase.storage
        .from('video-clips')
        .upload(filename, Buffer.from(base64, 'base64'), {
          contentType: 'video/mp4',
        })

      if (error) throw error
      Alert.alert('Success', 'Video uploaded!')
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload video')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="front" />

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.recordButton, recording && styles.recordingActive]}
          onPress={recording ? stopRecording : startRecording}
          disabled={uploading}
        >
          <Text style={styles.recordButtonText}>
            {uploading ? 'Uploading...' : recording ? 'Stop' : 'Record'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut} disabled={uploading}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.userInfo}>
        <Text style={styles.userText}>{user?.email}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000a15',
  },
  camera: {
    flex: 1,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#05070b',
  },
  recordButton: {
    backgroundColor: '#2DAEFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  recordingActive: {
    backgroundColor: '#ff4444',
  },
  recordButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
  },
  signOutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
  },
  signOutText: {
    color: '#999',
    fontSize: 12,
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
  },
  userText: {
    color: '#999',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#2DAEFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
  },
})
