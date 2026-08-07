# @diguiux/liveness-web

Framework-agnostic liveness detection Web Component powered by MediaPipe Face Landmarker.

Works in any browser, any framework, or plain HTML.

## Installation

```bash
npm install @diguiux/liveness-web
```

## Usage

### Plain HTML

```html
<diguiux-liveness theme-primary="#F97316"></diguiux-liveness>

<script type="module">
  import '@diguiux/liveness-web';

  const el = document.querySelector('diguiux-liveness');
  el.prompts = [
    { id: 'center_face', instruction: 'Center your face in the circle' },
    { id: 'look_straight', instruction: 'Look straight at the camera' },
    { id: 'turn_left', instruction: 'Turn your head to the left' },
    { id: 'smile', instruction: 'Give us a smile' },
    { id: 'blink', instruction: 'Blink naturally' },
  ];

  el.addEventListener('complete', (e) => {
    const result = e.detail;
    console.log('Captured', result.frames.length, 'frames');
    // Send result.frames to your verification API
  });

  el.addEventListener('cancel', () => {
    console.log('User cancelled');
  });
</script>
```

### Vue

```vue
<template>
  <diguiux-liveness
    theme-primary="#F97316"
    ref="liveness"
  />
</template>

<script setup>
import '@diguiux/liveness-web';
import { ref, onMounted } from 'vue';

const liveness = ref(null);
onMounted(() => {
  liveness.value.prompts = prompts;
  liveness.value.addEventListener('complete', handleComplete);
});
</script>
```

### Angular

```html
<diguiux-liveness theme-primary="#F97316" #liveness></diguiux-liveness>
```

## Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `theme-primary` | `string` | Primary color (hex) |

## Properties (set via JS)

| Property | Type | Description |
|----------|------|-------------|
| `prompts` | `PromptConfig[]` | Array of capture prompts |
| `showInstructions` | `boolean` | Show instructions screen (default: `true`) |
| `enableLogs` | `boolean` | Enable console logging (default: `false`) |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `complete` | `CaptureResult` | All prompts captured successfully |
| `cancel` | `null` | User clicked close |
| `error` | `Error` | Camera or detection error |
| `promptstart` | `{ prompt, index }` | A prompt began |
| `promptcomplete` | `{ prompt, frame }` | A frame was captured |
| `progress` | `{ completed, total, currentPrompt }` | Progress update |

## How It Works

1. **Camera**: `getUserMedia` with front-facing camera
2. **Detection**: MediaPipe Face Landmarker (478 landmarks + blendshapes + head pose)
3. **Processing**: `requestVideoFrameCallback` loop (rAF fallback)
4. **Capture**: `<canvas> drawImage → toBlob` (no DOM screenshots)
5. **Gating**: Shared `@diguiux/liveness-core` logic (position, pose, expressions, anti-static)

## Browser Support

- Chrome 90+
- Edge 90+
- Safari 15.4+
- Firefox 100+

Requires HTTPS in production (localhost works without it).

## License

MIT
