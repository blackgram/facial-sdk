# @diguiux/liveness

A multi-platform liveness detection SDK with face detection, multi-prompt challenges, and anti-spoofing checks.

## Packages

| Package | Description | Platform |
|---------|-------------|----------|
| [`@diguiux/liveness-core`](./packages/core) | Platform-agnostic gatekeeper, state machine, face quality, plugin types | Any |
| [`@diguiux/liveness-react-native`](./packages/sdk) | React Native SDK (Vision Camera + ML Kit) | iOS / Android |
| [`@diguiux/liveness-web`](./packages/web) | Web Component (MediaPipe Face Landmarker) | Browser |
| [`@diguiux/liveness-react`](./packages/react) | React wrapper for the Web Component | React Web |

## Features

- Face position gating with oval guide overlay
- Built-in prompts: `look_straight`, `turn_left`, `turn_right`, `blink`, `smile`, `nod`
- Filler prompts (e.g. `center_face`) for readiness checks without capture
- Anti-static detection to prevent photo/screen spoofing
- Plugin system for custom frame validation
- Theming support
- Animated success indicators and smooth prompt transitions
- Shared core logic across all platforms

## Quick Start

### React Native

```bash
npx expo install @diguiux/liveness-react-native
```

```tsx
import { LivenessCapture } from '@diguiux/liveness-react-native';

<LivenessCapture
  prompts={prompts}
  onComplete={(result) => { /* send to your API */ }}
  onCancel={() => {}}
  onError={(err) => console.error(err)}
  theme={{ primary: '#F97316' }}
/>
```

### Web (any framework or plain HTML)

```bash
npm install @diguiux/liveness-web
```

```html
<diguiux-liveness theme-primary="#F97316"></diguiux-liveness>
<script type="module">
  import '@diguiux/liveness-web';
  const el = document.querySelector('diguiux-liveness');
  el.prompts = [
    { id: 'center_face', instruction: 'Center your face' },
    { id: 'look_straight', instruction: 'Look straight' },
    { id: 'turn_left', instruction: 'Turn left' },
    { id: 'smile', instruction: 'Smile' },
  ];
  el.addEventListener('complete', (e) => console.log(e.detail));
</script>
```

### React (Web)

```bash
npm install @diguiux/liveness-react
```

```tsx
import { Liveness } from '@diguiux/liveness-react';

<Liveness
  prompts={prompts}
  themePrimary="#F97316"
  onComplete={(result) => { /* send to your API */ }}
  onCancel={() => {}}
  onError={(err) => console.error(err)}
/>
```

## Architecture

```
@diguiux/liveness-core (shared logic)
├── @diguiux/liveness-react-native (React Native)
├── @diguiux/liveness-web (Web Component + MediaPipe)
│   └── @diguiux/liveness-react (thin React wrapper)
```

## Development

```bash
# Install all workspace dependencies
npm install

# Build all packages
npm run build

# Build individual packages
npm run build:core
npm run build:sdk
npm run build:web

# Run web demo
cd packages/web && npm run dev
# → http://localhost:3000/demo/

# Run React demo
cd packages/react/demo && npm install && npm run dev
# → http://localhost:3001
```

## Demos

- **React Native**: [`demo/`](./demo) — Expo app with device capture
- **Web (vanilla)**: [`packages/web/demo/`](./packages/web/demo) — Plain HTML + Web Component
- **React (web)**: [`packages/react/demo/`](./packages/react/demo) — Vite + React app

## License

MIT
