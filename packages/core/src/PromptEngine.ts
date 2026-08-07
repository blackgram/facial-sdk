import type { PromptConfig } from './types';

export interface PromptEngineState {
  currentIndex: number;
  completed: number[];
  startedAt: number | null;
  promptStartedAt: number | null;
}

export function createPromptEngine(prompts: PromptConfig[]) {
  let state: PromptEngineState = {
    currentIndex: 0,
    completed: [],
    startedAt: null,
    promptStartedAt: null,
  };

  return {
    get current(): PromptConfig | undefined {
      return prompts[state.currentIndex];
    },

    get index(): number {
      return state.currentIndex;
    },

    get total(): number {
      return prompts.length;
    },

    get isComplete(): boolean {
      return state.currentIndex >= prompts.length;
    },

    get durationMs(): number {
      if (!state.startedAt) return 0;
      return Date.now() - state.startedAt;
    },

    get promptElapsedMs(): number {
      if (!state.promptStartedAt) return 0;
      return Date.now() - state.promptStartedAt;
    },

    get isTimedOut(): boolean {
      const current = prompts[state.currentIndex];
      if (!current?.timeout || !state.promptStartedAt) return false;
      return Date.now() - state.promptStartedAt > current.timeout;
    },

    start(): void {
      state = {
        ...state,
        startedAt: Date.now(),
        promptStartedAt: Date.now(),
      };
    },

    advance(): PromptConfig | undefined {
      state = {
        ...state,
        completed: [...state.completed, state.currentIndex],
        currentIndex: state.currentIndex + 1,
        promptStartedAt: Date.now(),
      };
      return prompts[state.currentIndex];
    },

    reset(): void {
      state = {
        currentIndex: 0,
        completed: [],
        startedAt: null,
        promptStartedAt: null,
      };
    },

    getState(): Readonly<PromptEngineState> {
      return state;
    },
  };
}

export type PromptEngine = ReturnType<typeof createPromptEngine>;
