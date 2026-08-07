import React, { useEffect, useRef, useCallback } from 'react';
import type { PromptConfig, CaptureResult } from '@diguiux/liveness-core';
import '@diguiux/liveness-web';
import type { DiguiuxLiveness } from '@diguiux/liveness-web';

export interface LivenessProps {
  prompts: PromptConfig[];
  themePrimary?: string;
  onComplete: (result: CaptureResult) => void;
  onCancel?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function Liveness({
  prompts,
  themePrimary,
  onComplete,
  onCancel,
  onError,
  className,
  style,
}: LivenessProps) {
  const ref = useRef<DiguiuxLiveness>(null);

  const handleComplete = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent<CaptureResult>).detail;
      onComplete(detail);
    },
    [onComplete],
  );

  const handleCancel = useCallback(() => {
    onCancel?.();
  }, [onCancel]);

  const handleError = useCallback(
    (e: Event) => {
      const detail = (e as CustomEvent<Error>).detail;
      onError?.(detail);
    },
    [onError],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.prompts = prompts;

    el.addEventListener('complete', handleComplete);
    el.addEventListener('cancel', handleCancel);
    el.addEventListener('error', handleError);

    return () => {
      el.removeEventListener('complete', handleComplete);
      el.removeEventListener('cancel', handleCancel);
      el.removeEventListener('error', handleError);
    };
  }, [prompts, handleComplete, handleCancel, handleError]);

  return React.createElement('diguiux-liveness', {
    ref,
    'theme-primary': themePrimary,
    class: className,
    style,
  });
}
