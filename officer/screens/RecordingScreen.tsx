import React, { useState, useRef, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as FileSystem from 'expo-file-system'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

interface Scene {
  id: string
  kind: string
  text: string
  duration_seconds: number
  scene_order: number
}

interface Script {
  id: string
  title: string
  slug: string
  scenes: Scene[]
}

export default function RecordingScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scripts, setScripts] = useState<Script[]>([])
  const [selectedScript, setSelectedScript] = useState<Script | null>(null)
  const [currentSceneIdx, setCurrentSceneIdx] = useState(0)
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [recordedScenes, setRecordedScenes] = useState<Set<number>>(new Set())
  const cameraRef = useRef<CameraView>(null)
  const { user, signOut } = useAuth()

  useEffect(() => {
    fetchScripts()
  }, [])

  const fetchScripts = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('*, scenes(*)')
        .eq('status', 'live')
        .order('created_at', { ascending: false })

      if (error) throw error
      const scriptsWithScenes = data
        .map((s: any) => ({
          ...s,
          scenes: (s.scenes || []).sort((a: any, b: any) => a.scene_order - b.scene_order),
        }))
      setScripts(scriptsWithScenes || [])
    } catch (error) {
      console.error('Error fetching scripts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permissions...</Text>
      </View>
    )
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

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2DAEFF" />
      </View>
    )
  }

  if (!selectedScript) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Splice</Text>
          <Text style={styles.subtitle}>Officer Portal</Text>
        </View>

        <ScrollView style={styles.scriptList}>
          {scripts.length === 0 ? (
            <Text style={styles.emptyText}>No scripts available</Text>
          ) : (
            scripts.map((script) => (
              <TouchableOpacity
                key={script.id}
                style={styles.scriptCard}
                onPress={() => {
                  setSelectedScript(script)
                  setCurrentSceneIdx(0)
                  setRecordedScenes(new Set())
                }}
              >
                <Text style={styles.scriptTitle}>{script.title}</Text>
                <Text style={styles.scriptSub}>{script.scenes.length} scenes</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const currentScene = selectedScript.scenes[currentSceneIdx]
  const isAllRecorded = recordedScenes.size === selectedScript.scenes.length

  const startRecording = async () => {
    if (!cameraRef.current) return

    try {
      setRecording(true)
      const video = await cameraRef.current.recordAsync()
      setRecording(false)

      if (video?.uri) {
        await uploadSceneClip(video.uri, currentScene)
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

  const uploadSceneClip = async (uri: string, scene: Scene) => {
    try {
      setUploading(true)

      // Create video record if it doesn't exist
      let videoId = selectedScript.id

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const clipFileName = `${videoId}/${scene.id}-${currentSceneIdx}.mp4`

      const { error: uploadError } = await supabase.storage
        .from('video-clips')
        .upload(clipFileName, Buffer.from(base64, 'base64'), {
          contentType: 'video/mp4',
        })

      if (uploadError) throw uploadError

      // Mark scene as recorded
      const newRecorded = new Set(recordedScenes)
      newRecorded.add(currentSceneIdx)
      setRecordedScenes(newRecorded)

      Alert.alert('Scene recorded!', 'Moving to next scene...')

      // Move to next scene or show render option
      if (currentSceneIdx < selectedScript.scenes.length - 1) {
        setCurrentSceneIdx(currentSceneIdx + 1)
      } else {
        Alert.alert('All scenes recorded!', 'Ready to render your video')
      }
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload video')
    } finally {
      setUploading(false)
    }
  }

  const handleRender = async () => {
    try {
      setUploading(true)
      // Call render API to send clips to Shotstack
      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: selectedScript.id }),
      })

      if (!response.ok) throw new Error('Render request failed')

      Alert.alert('Rendering started', 'Check Videos page to monitor progress')
      setSelectedScript(null)
      setCurrentSceneIdx(0)
      setRecordedScenes(new Set())
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start rendering')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="front" />

      <View style={styles.sceneIndicator}>
        <Text style={styles.sceneText}>
          Scene {currentSceneIdx + 1} of {selectedScript.scenes.length}
        </Text>
        <Text style={styles.sceneKind}>{currentScene.kind.toUpperCase()}</Text>
      </View>

      <View style={styles.sceneContent}>
        <Text style={styles.sceneDescription}>{currentScene.text}</Text>
        <Text style={styles.duration}>{currentScene.duration_seconds}s</Text>
      </View>

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

        {isAllRecorded && (
          <TouchableOpacity style={styles.renderButton} onPress={handleRender} disabled={uploading}>
            <Text style={styles.renderButtonText}>Render</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedScript(null)}
          disabled={uploading}
        >
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progress}>
        {selectedScript.scenes.map((_, idx) => (
          <View
            key={idx}
            style={[styles.progressDot, recordedScenes.has(idx) && styles.progressDotDone]}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000a15',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2DAEFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  scriptList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scriptCard: {
    backgroundColor: '#1a2633',
    borderWidth: 1,
    borderColor: '#2d3e4f',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  scriptTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  scriptSub: {
    color: '#999',
    fontSize: 12,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  signOutButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
  },
  signOutText: {
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
  },
  camera: {
    flex: 1,
  },
  sceneIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    alignItems: 'center',
  },
  sceneText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  sceneKind: {
    color: '#2DAEFF',
    fontSize: 10,
    marginTop: 4,
  },
  sceneContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    paddingHorizontal: 16,
  },
  sceneDescription: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  duration: {
    color: '#999',
    fontSize: 10,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#05070b',
  },
  recordButton: {
    backgroundColor: '#2DAEFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  recordingActive: {
    backgroundColor: '#ff4444',
  },
  recordButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 13,
  },
  renderButton: {
    backgroundColor: '#7A33F5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
  },
  renderButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  backButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 6,
  },
  backText: {
    color: '#999',
    fontSize: 12,
  },
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    backgroundColor: '#05070b',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2d3e4f',
  },
  progressDotDone: {
    backgroundColor: '#2DAEFF',
  },
  text: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#2DAEFF',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    textAlign: 'center',
  },
})
