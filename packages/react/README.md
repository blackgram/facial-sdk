# @diguiux/liveness-react

React wrapper for `@diguiux/liveness-web` — use the liveness Web Component in React apps.

## Installation

```bash
npm install @diguiux/liveness-react
```

## Usage

```tsx
import { Liveness } from '@diguiux/liveness-react';
import type { CaptureResult, PromptConfig } from '@diguiux/liveness-core';

const prompts: PromptConfig[] = [
  { id: 'center_face', instruction: 'Center your face in the circle' },
  { id: 'look_straight', instruction: 'Look straight at the camera' },
  { id: 'turn_left', instruction: 'Turn your head to the left' },
  { id: 'smile', instruction: 'Give us a smile' },
  { id: 'blink', instruction: 'Blink naturally' },
];

function App() {
  return (
    <Liveness
      prompts={prompts}
      themePrimary="#F97316"
      onComplete={(result) => {
        console.log('Captured', result.frames.length, 'frames');
      }}
      onCancel={() => console.log('Cancelled')}
      onError={(err) => console.error(err)}
      style={{ width: '100%', height: '100vh' }}
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `prompts` | `PromptConfig[]` | required | Array of capture prompts |
| `themePrimary` | `string` | `'#F97316'` | Primary theme color |
| `onComplete` | `(result: CaptureResult) => void` | required | Called with captured frames |
| `onCancel` | `() => void` | — | Called when user closes |
| `onError` | `(error: Error) => void` | — | Called on errors |
| `className` | `string` | — | CSS class for the element |
| `style` | `CSSProperties` | — | Inline styles |

## How It Works

This package is a thin React wrapper (~50 lines) that:
1. Renders the `<diguiux-liveness>` custom element
2. Bridges React props to element properties
3. Bridges DOM CustomEvents to React callbacks via `useEffect`

All the heavy lifting (camera, MediaPipe, capture, UI) lives in `@diguiux/liveness-web`.

## License

MIT
