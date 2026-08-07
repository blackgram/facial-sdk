# @diguiux/liveness-core

Platform-agnostic liveness detection core — shared logic for all platform SDKs.

## What's Inside

- **Gatekeeper** — Face position gating, pose validation, blink/nod/smile state machines
- **FaceQuality** — Face-in-oval checks, position variance computation
- **StateMachine** — Capture phase transitions (instructions → capturing → processing → complete)
- **Exposure** — Scene brightness gating
- **Plugin types** — Interface for custom frame validation plugins

## Installation

```bash
npm install @diguiux/liveness-core
```

## Usage

This package is used internally by the platform SDKs. You typically don't install it directly unless building a custom integration.

```ts
import {
  evaluateGate,
  advanceBlinkState,
  initialBlinkState,
  computePositionVariance,
  DEFAULT_GATE_HINTS,
  type PromptConfig,
  type CaptureResult,
  type DetectedFace,
} from '@diguiux/liveness-core';

const gate = evaluateGate({
  faces: detectedFaces,
  promptId: 'look_straight',
  oval: { cx: 200, cy: 300, width: 240, height: 340, edgeInsetPx: 14 },
  blinkDetected: false,
  nodDetected: false,
});

if (gate.ok) {
  // Face passes all checks for this prompt
}
```

## Exports

| Export | Description |
|--------|-------------|
| `evaluateGate` | Main gate evaluation for a prompt |
| `advanceBlinkState` / `advanceNodState` | Blink and nod state machines |
| `evaluateFaceQuality` | Face size and position checks |
| `computePositionVariance` | Anti-static motion analysis |
| `exposureWouldBlock` | Scene brightness check |
| `DEFAULT_GATE_HINTS` | User-facing hint messages per block reason |
| `LivenessError` | Typed error class |
| Types | `PromptConfig`, `CaptureResult`, `CapturedFrame`, `GateBlockReason`, `OvalGuide`, `DetectedFace`, `LivenessPlugin`, etc. |

## License

MIT
