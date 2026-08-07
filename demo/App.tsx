import React, { useState } from 'react';
import { Alert, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  LivenessCapture,
  type CaptureResult,
  type PromptConfig,
  LivenessError,
} from '@diguiux/liveness-react-native';

// Simulated prompts — in production these come from your backend's /liveness/start response
const DEMO_PROMPTS: PromptConfig[] = [
  { id: 'center_face', instruction: 'Center your face in the circle', timeout: 10000 },
  { id: 'look_straight', instruction: 'Look straight at the camera', timeout: 8000 },
  { id: 'turn_left', instruction: 'Turn your head to the left', timeout: 6000 },
  { id: 'smile', instruction: 'Give us a smile 😊', timeout: 5000 },
  { id: 'blink', instruction: 'Blink naturally', timeout: 5000 },
];

export default function App() {
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [showFrames, setShowFrames] = useState(false);

  const handleComplete = (captureResult: CaptureResult) => {
    setResult(captureResult);
    setCapturing(false);

    console.log('[LivenessSDK Result]', JSON.stringify(captureResult, null, 2));

    // In production you'd send captureResult.frames to your /liveness/verify endpoint
    Alert.alert(
      'Capture Complete',
      `Captured ${captureResult.frames.length} frames in ${captureResult.durationMs}ms\nSDK v${captureResult.metadata.sdkVersion}`,
    );
  };

  const handleError = (error: LivenessError) => {
    setCapturing(false);
    Alert.alert('Error', `${error.code}: ${error.message}`);
  };

  if (capturing) {
    return (
      <LivenessCapture
        prompts={DEMO_PROMPTS}
        showInstructions={true}
        onComplete={handleComplete}
        onCancel={() => setCapturing(false)}
        onError={handleError}
        onProgress={({ completed, total, currentPrompt }) => {
          console.log(`[Progress] ${completed}/${total} — ${currentPrompt.id}`);
        }}
        onPromptStart={(prompt, index) => {
          console.log(`[Prompt Start] #${index}: ${prompt.id}`);
        }}
        theme={{ primary: '#F97316' }}
        enableLogs={true}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Liveness SDK Example</Text>
        <Text style={styles.subtitle}>
          This simulates a consuming app that starts the liveness capture flow.
        </Text>

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Last Result</Text>
            <Text style={styles.resultText}>Frames: {result.frames.length}</Text>
            <Text style={styles.resultText}>Duration: {result.durationMs}ms</Text>
            <Text style={styles.resultText}>Version: {result.version}</Text>
            {/* full result */}
            <ScrollView style={styles.resultJson} nestedScrollEnabled>
              <Text style={styles.resultJsonText}>{JSON.stringify(result, null, 2)}</Text>
            </ScrollView>
            <Pressable style={styles.framesBtn} onPress={() => setShowFrames(!showFrames)}>
              <Text style={styles.framesBtnText}>{showFrames ? 'Hide Frames' : 'View Captured Frames'}</Text>
            </Pressable>
            {showFrames && (
              <ScrollView horizontal style={styles.framesScroll} showsHorizontalScrollIndicator={false}>
                {result.frames.map((frame, i) => (
                  <View key={i} style={styles.frameCard}>
                    <Image source={{ uri: frame.uri }} style={styles.frameImage} />
                    <Text style={styles.frameLabel}>{frame.prompt.id}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
        <Pressable style={styles.button} onPress={() => setCapturing(true)}>
          <Text style={styles.buttonText}>Start Liveness Capture</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#6B7280', lineHeight: 22, marginBottom: 32 },
  resultCard: { backgroundColor: '#F7F8FA', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#E5E7EB' },
  resultTitle: { fontWeight: '700', fontSize: 16, marginBottom: 8, color: '#111' },
  resultText: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  resultJson: { marginTop: 8, maxHeight: 200, backgroundColor: '#F3F4F6', padding: 8, borderRadius: 8 },
  resultJsonText: { fontSize: 12, fontFamily: 'Courier', color: '#374151' },
  framesBtn: { marginTop: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: '#E5E7EB', borderRadius: 8 },
  framesBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  framesScroll: { marginTop: 12 },
  frameCard: { marginRight: 12, alignItems: 'center' },
  frameImage: { width: 80, height: 110, borderRadius: 8, backgroundColor: '#D1D5DB' },
  frameLabel: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  button: { backgroundColor: '#F97316', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
