import React, { useState } from 'react';
import { Liveness } from '@diguiux/liveness-react';
import type { CaptureResult, PromptConfig } from '@diguiux/liveness-core';

const prompts: PromptConfig[] = [
  { id: 'center_face', instruction: 'Center your face in the circle', timeout: 10000 },
  { id: 'look_straight', instruction: 'Look straight at the camera', timeout: 8000 },
  { id: 'turn_left', instruction: 'Turn your head to the left', timeout: 6000 },
  { id: 'smile', instruction: 'Give us a smile 😊', timeout: 5000 },
  { id: 'blink', instruction: 'Blink naturally', timeout: 5000 },
];

export default function App() {
  const [capturing, setCapturing] = useState(false);
  const [result, setResult] = useState<CaptureResult | null>(null);

  const handleComplete = (captureResult: CaptureResult) => {
    console.log('[React Demo] Complete:', captureResult);
    setResult(captureResult);
    setCapturing(false);
  };

  if (capturing) {
    return (
      <div style={styles.livenessContainer}>
        <Liveness
          prompts={prompts}
          themePrimary="#F97316"
          onComplete={handleComplete}
          onCancel={() => setCapturing(false)}
          onError={(err) => {
            console.error(err);
            setCapturing(false);
            alert('Error: ' + err.message);
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <h1 style={styles.title}>Liveness React Demo</h1>
        <p style={styles.subtitle}>
          This demonstrates <code>@diguiux/liveness-react</code> — a React wrapper
          around the Web Component.
        </p>

        {result && (
          <div style={styles.resultCard}>
            <h3 style={styles.resultTitle}>Last Result</h3>
            <p style={styles.resultText}>Frames: {result.frames.length}</p>
            <p style={styles.resultText}>Duration: {result.durationMs}ms</p>
            <p style={styles.resultText}>SDK: v{result.metadata.sdkVersion}</p>
            <div style={styles.framesRow}>
              {result.frames.map((frame, i) => (
                <div key={i} style={styles.frameCard}>
                  <img src={frame.uri} alt={frame.prompt.id} style={styles.frameImg} />
                  <span style={styles.frameLabel}>{frame.prompt.id}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button style={styles.button} onClick={() => setCapturing(true)}>
          Start Liveness Capture
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F5F6F8',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  content: {
    maxWidth: 420,
    width: '100%',
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  title: { fontSize: 24, fontWeight: 700, color: '#111', margin: 0 },
  subtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 1.5, margin: 0 },
  resultCard: {
    background: '#fff',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  resultTitle: { fontSize: 16, fontWeight: 700, color: '#111', margin: '0 0 8px' },
  resultText: { fontSize: 14, color: '#6B7280', margin: '0 0 4px' },
  framesRow: { display: 'flex', gap: 8, overflowX: 'auto', marginTop: 12 },
  frameCard: { textAlign: 'center', flexShrink: 0 },
  frameImg: { width: 72, height: 100, objectFit: 'cover', borderRadius: 8, background: '#E5E7EB' },
  frameLabel: { fontSize: 11, color: '#6B7280', display: 'block', marginTop: 4 },
  button: {
    marginTop: 16,
    padding: '16px 32px',
    background: '#F97316',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
  },
  livenessContainer: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100dvh',
    zIndex: 9999,
  },
};
