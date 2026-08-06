# Liveness SDK Demo

A demo app showcasing `@diguiux/liveness-sdk` integration.

## Setup

```bash
npm install
npx pod-install
```

## Run

```bash
npx expo run:ios --device
```

## Prompts Configured

| Prompt | Action |
|--------|--------|
| `center_face` | Readiness check — no capture |
| `look_straight` | Captures a straight-facing frame |
| `turn_left` | Captures a left-turn frame |
| `smile` | Captures a smile frame |
| `blink` | Captures after detecting a blink |
