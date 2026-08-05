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

const sceneGuidance: Record<string, string> = {
  hook: '👋 Introduce yourself\nBe friendly, energetic, and get their attention',
  body: '💬 Explain the offer\nShare key benefits clearly and confidently',
  cta: '✅ Call to action\nTell them exactly what to do next',
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
  const [recordingTime, setRecordingTime] = useState(0)
  const [videoId, setVideoId] = useState<string | null>(null)
  const recordingStartRef = useRef<number>(0)
  const cameraRef = useRef<CameraView>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const { user, signOut } = useAuth()

  useEffect(() => {
    fetchScripts()
  }, [])

  useEffect(() => {
    if (recording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t) => t + 0.1)
      }, 100)
    } else {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
      setRecordingTime(0)
    }
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    }
  }, [recording])

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
          <Text style={styles.subtitle}>Available Scripts</Text>
          {user && <Text style={styles.userEmail}>{user.email}</Text>}
        </View>

        <ScrollView style={styles.scriptList} contentContainerStyle={styles.listContent}>
          {scripts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📹</Text>
              <Text style={styles.emptyText}>No scripts available yet</Text>
              <Text style={styles.emptySubText}>Ask your admin to publish a script</Text>
            </View>
          ) : (
            scripts.map((script) => (
              <TouchableOpacity
                key={script.id}
                style={styles.scriptCard}
                onPress={() => {
                  setSelectedScript(script)
                  setCurrentSceneIdx(0)
                  setRecordedScenes(new Set())
                  setVideoId(null)
                }}
              >
                <View style={styles.scriptCardHeader}>
                  <View>
                    <Text style={styles.scriptTitle}>{script.title}</Text>
                    <Text style={styles.scriptSub}>Ready to record →</Text>
                  </View>
                  <Text style={styles.sceneCount}>{script.scenes.length}</Text>
                </View>
                <Text style={styles.scriptDuration}>
                  ~{script.scenes.reduce((sum: number, s: Scene) => sum + s.duration_seconds, 0)}s total
                </Text>
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
      recordingStartRef.current = Date.now()
      const recorded = await cameraRef.current.recordAsync()
      const durationSeconds = (Date.now() - recordingStartRef.current) / 1000
      setRecording(false)
      if (recorded?.uri) {
        await uploadSceneClip(recorded.uri, currentScene, durationSeconds)
      }
    } catch (error) {
      setRecording(false)
      Alert.alert('Error', 'Failed to record video')
    }
  }

  const stopRecording = () => {
    cameraRef.current?.stopRecording()
  }

  // Ensure a videos row exists and return its id
  const ensureVideoRecord = async (): Promise<string> => {
    if (videoId) return videoId
    const { data, error } = await supabase
      .from('videos')
      .insert({
        user_id: user?.id,
        script_id: selectedScript!.id,
        status: 'recording',
      })
      .select('id')
      .single()
    if (error || !data) throw new Error('Could not create video record: ' + error?.message)
    setVideoId(data.id)
    return data.id
  }

  const uploadSceneClip = async (uri: string, scene: Scene, durationSeconds: number) => {
    try {
      setUploading(true)

      const vid = await ensureVideoRecord()

      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      const clipFileName = `${vid}/${scene.id}.mp4`

      // upsert so re-recording a scene replaces the old clip
      const { error: uploadError } = await supabase.storage
        .from('video-clips')
        .upload(clipFileName, Buffer.from(base64, 'base64'), {
          contentType: 'video/mp4',
          upsert: true,
        })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('video-clips')
        .getPublicUrl(clipFileName)
      const clipUrl = urlData.publicUrl

      // Upsert the video_clips row with real duration and URL
      const { error: clipError } = await supabase
        .from('video_clips')
        .upsert({
          video_id: vid,
          scene_id: scene.id,
          clip_url: clipUrl,
          duration_seconds: Math.round(durationSeconds * 100) / 100,
        }, { onConflict: 'video_id,scene_id' })
      if (clipError) throw clipError

      const newRecorded = new Set(recordedScenes)
      newRecorded.add(currentSceneIdx)
      setRecordedScenes(newRecorded)

      if (currentSceneIdx < selectedScript!.scenes.length - 1) {
        setCurrentSceneIdx(currentSceneIdx + 1)
      }
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Failed to upload clip')
    } finally {
      setUploading(false)
    }
  }

  const handleRender = async () => {
    if (!videoId) {
      Alert.alert('Error', 'No video session found. Please re-record.')
      return
    }
    try {
      setUploading(true)
      // Update video status to awaiting render
      await supabase.from('videos').update({ status: 'awaiting_render' }).eq('id', videoId)

      const response = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      })
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Render request failed')
      }
      Alert.alert('Rendering started!', 'Your video will be ready in about a minute.')
      setSelectedScript(null)
      setCurrentSceneIdx(0)
      setRecordedScenes(new Set())
      setVideoId(null)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start rendering')
    } finally {
      setUploading(false)
    }
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="front" />

      <View style={styles.overlay}>
        {/* Top progress bar */}
        <View style={styles.progressBar}>
          {selectedScript.scenes.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.progressBarSegment,
                recordedScenes.has(idx) && styles.progressBarSegmentDone,
                idx === currentSceneIdx && styles.progressBarSegmentActive,
              ]}
            />
          ))}
        </View>

        {/* Scene guidance card */}
        <View style={styles.sceneCard}>
          <Text style={styles.sceneNumber}>Scene {currentSceneIdx + 1} of {selectedScript.scenes.length}</Text>
          <Text style={styles.sceneKindLabel}>{currentScene.kind.toUpperCase()}</Text>
          <Text style={styles.sceneGuidance}>{sceneGuidance[currentScene.kind] || ''}</Text>
          <Text style={styles.sceneInstruction}>{currentScene.text}</Text>
          <Text style={styles.sceneDuration}>Record for ~{currentScene.duration_seconds}s</Text>
        </View>

        {/* Recording timer */}
        {recording && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{recordingTime.toFixed(1)}s</Text>
          </View>
        )}

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.recordButton, recording && styles.recordingActive]}
            onPress={recording ? stopRecording : startRecording}
            disabled={uploading}
          >
            <Text style={styles.recordButtonIcon}>{recording ? '⏹' : '🔴'}</Text>
            <Text style={styles.recordButtonText}>
              {uploading ? 'Uploading...' : recording ? 'Stop' : 'Record'}
            </Text>
          </TouchableOpacity>

          {isAllRecorded && (
            <TouchableOpacity style={styles.renderButton} onPress={handleRender} disabled={uploading}>
              <Text style={styles.renderButtonIcon}>✨</Text>
              <Text style={styles.renderButtonText}>Render Video</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Back button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedScript(null)}
          disabled={uploading}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Status message */}
        {recordedScenes.has(currentSceneIdx) && !isAllRecorded && (
          <View style={styles.statusMessage}>
            <Text style={styles.statusText}>✓ Scene recorded! Swipe down or tap back to next scene.</Text>
          </View>
        )}

        {isAllRecorded && (
          <View style={styles.completeMessage}>
            <Text style={styles.completeText}>🎬 All scenes recorded! Ready to render.</Text>
          </View>
        )}
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
    backgroundColor: '#000a15',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2DAEFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
    marginTop: 4,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  scriptList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  scriptCard: {
    backgroundColor: 'rgba(45, 174, 255, 0.08)',
    borderWidth: 1,
    borderColor: '#2DAEFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  scriptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scriptTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  scriptSub: {
    color: '#2DAEFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  sceneCount: {
    color: '#2DAEFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  scriptDuration: {
    color: '#999',
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubText: {
    color: '#666',
    fontSize: 13,
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  signOutButton: {
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#666',
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 24,
  },
  progressBar: {
    flexDirection: 'row',
    height: 4,
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  progressBarSegment: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progressBarSegmentDone: {
    backgroundColor: '#2DAEFF',
  },
  progressBarSegmentActive: {
    backgroundColor: '#7A33F5',
  },
  sceneCard: {
    backgroundColor: 'rgba(0, 10, 21, 0.92)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(45, 174, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginHorizontal: 12,
    borderRadius: 8,
  },
  sceneNumber: {
    color: '#999',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  sceneKindLabel: {
    color: '#2DAEFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  sceneGuidance: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
    fontWeight: '500',
  },
  sceneInstruction: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  sceneDuration: {
    color: '#999',
    fontSize: 12,
    fontStyle: 'italic',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  timerText: {
    color: '#ff4444',
    fontSize: 32,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'column',
    gap: 12,
    paddingHorizontal: 16,
  },
  recordButton: {
    backgroundColor: '#2DAEFF',
    paddingVertical: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  recordingActive: {
    backgroundColor: '#ff4444',
  },
  recordButtonIcon: {
    fontSize: 20,
  },
  recordButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 16,
  },
  renderButton: {
    backgroundColor: '#7A33F5',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  renderButtonIcon: {
    fontSize: 18,
  },
  renderButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  backText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  statusMessage: {
    backgroundColor: 'rgba(45, 174, 255, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#2DAEFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 4,
  },
  statusText: {
    color: '#2DAEFF',
    fontSize: 12,
    fontWeight: '600',
  },
  completeMessage: {
    backgroundColor: 'rgba(122, 51, 245, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: '#7A33F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    borderRadius: 4,
  },
  completeText: {
    color: '#7A33F5',
    fontSize: 12,
    fontWeight: '600',
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
