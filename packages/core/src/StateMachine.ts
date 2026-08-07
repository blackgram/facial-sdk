import type { CapturePhase } from './types';

export type StateMachineEvent =
  | { type: 'START_CAPTURE' }
  | { type: 'PROMPT_COMPLETE' }
  | { type: 'ALL_PROMPTS_DONE' }
  | { type: 'PROCESSING_DONE' }
  | { type: 'ERROR'; message: string }
  | { type: 'RESET' };

export interface StateMachineState {
  phase: CapturePhase;
  promptIndex: number;
  errorMessage: string | null;
}

export function initialState(showInstructions: boolean): StateMachineState {
  return {
    phase: showInstructions ? 'instructions' : 'capturing',
    promptIndex: 0,
    errorMessage: null,
  };
}

export function transition(
  state: StateMachineState,
  event: StateMachineEvent,
  totalPrompts: number,
): StateMachineState {
  switch (event.type) {
    case 'START_CAPTURE':
      return { ...state, phase: 'capturing' };

    case 'PROMPT_COMPLETE': {
      const nextIndex = state.promptIndex + 1;
      if (nextIndex >= totalPrompts) {
        return { ...state, phase: 'processing', promptIndex: nextIndex };
      }
      return { ...state, promptIndex: nextIndex };
    }

    case 'ALL_PROMPTS_DONE':
      return { ...state, phase: 'processing' };

    case 'PROCESSING_DONE':
      return { ...state, phase: 'complete' };

    case 'ERROR':
      return { ...state, phase: 'error', errorMessage: event.message };

    case 'RESET':
      return { phase: 'capturing', promptIndex: 0, errorMessage: null };

    default:
      return state;
  }
}
