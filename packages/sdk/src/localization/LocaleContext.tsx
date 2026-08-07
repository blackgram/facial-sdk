import React, { createContext, useContext } from 'react';
import type { LivenessMessages } from './types';
import { en } from './en';

const LocaleContext = createContext<LivenessMessages>(en);

export function LocaleProvider({
  messages,
  children,
}: {
  messages: LivenessMessages;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={messages}>{children}</LocaleContext.Provider>;
}

export function useMessages(): LivenessMessages {
  return useContext(LocaleContext);
}
