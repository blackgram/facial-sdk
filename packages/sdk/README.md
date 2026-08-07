# @diguiux/liveness-react-native

React Native liveness capture SDK with Vision Camera and ML Kit face detection.

## Installation

```bash
npx expo install @diguiux/liveness-react-native
```

### Peer Dependencies

```bash
npx expo install react-native-vision-camera react-native-vision-camera-face-detector react-native-svg react-native-safe-area-context expo-brightness react-native-reanimated
```

### iOS Setup

Add to your `Info.plist`:

```xml
<key>NSCameraUsageDescription</key>
<string>Required for liveness verification</string>
```

## Usage

```tsx
import { LivenessCapture, type CaptureResult, type PromptConfig } from '@diguiux/liveness-react-native';

const prompts: PromptConfig[] = [
  { id: 'center_face', instruction: 'Center your face in the circle' },
  { id: 'look_straight', instruction: 'Look straight at the camera' },
  { id: 'turn_left', instruction: 'Turn your head to the left' },
  { id: 'blink', instruction: 'Blink naturally' },
];

function App() {
  return (
    <LivenessCapture
      prompts={prompts}
      showInstructions={true}
      enableLogs={false}
      onComplete={(result) => {
        // Send result.frames to your /liveness/verify endpoint
      }}
      onCancel={() => navigation.goBack()}
      onError={(error) => console.error(error.code, error.message)}
      theme={{ primary: '#F97316' }}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `prompts` | `PromptConfig[]` | required | Array of capture prompts |
| `showInstructions` | `boolean` | `true` | Show instructions screen before capture |
| `enableLogs` | `boolean` | `false` | Enable SDK console logging |
| `theme` | `Partial<LivenessTheme>` | — | Theme overrides |
| `messages` | `Partial<LivenessMessages>` | — | Localization overrides |
| `plugins` | `LivenessPlugin[]` | — | Custom frame validation plugins |
| `onComplete` | `(result: CaptureResult) => void` | required | Called with all captured frames |
| `onCancel` | `() => void` | required | Called when user cancels |
| `onError` | `(error: LivenessError) => void` | required | Called on unrecoverable errors |
| `onPromptStart` | `(prompt, index) => void` | — | Called when a prompt begins |
| `onPromptComplete` | `(prompt, frame) => void` | — | Called after each frame capture |
| `onProgress` | `(event) => void` | — | Progress updates |

## Built-in Prompts

| ID | Action |
|----|--------|
| `center_face` | Readiness check — no frame captured |
| `look_straight` | Face centered, eyes open, straight pose |
| `turn_left` | Head turned to the left |
| `turn_right` | Head turned to the right |
| `blink` | Natural blink detected |
| `smile` | Smile detected |
| `nod` | Head nod detected |

## CaptureResult

```ts
{
  version: 1,
  frames: [
    { prompt, uri, width, height, timestamp }
  ],
  durationMs: 8500,
  deviceOrientation: 'portrait',
  metadata: { sdkVersion: '0.2.0' }
}
```

## License

MIT
