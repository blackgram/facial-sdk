# @diguiux/liveness-sdk

A React Native liveness capture SDK with face detection, multi-prompt challenges, and anti-spoofing checks.

## Features

- Face position gating with oval guide overlay
- Built-in prompts: `look_straight`, `turn_left`, `turn_right`, `blink`, `smile`, `nod`
- Filler prompts (e.g. `center_face`) for readiness checks without capture
- Anti-static detection to prevent photo/screen spoofing
- Plugin system for custom frame validation
- Theming and localization support
- Animated success indicators and smooth prompt transitions

## Installation

```bash
npx expo install @diguiux/liveness-sdk
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
import { LivenessCapture, type CaptureResult, type PromptConfig } from '@diguiux/liveness-sdk';

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
      onComplete={(result: CaptureResult) => {
        // Send result.frames to your verification API
      }}
      onCancel={() => {}}
      onError={(error) => console.error(error)}
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

## Demo App

See the [`demo/`](./demo) folder for a complete working example.

## License

UNLICENSED
