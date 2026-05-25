import React, { createContext, useContext, ReactNode } from 'react';

interface Colors {
  bg: string;
  surface: string;
  border: string;
  accent: string;
  textMuted: string;
  green: string;
}

interface AppContextType {
  colors: Colors;
  loaded: boolean;
  signedOutToast: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const colors: Colors = {
    bg: '#ffffff',
    surface: '#f5f5f5',
    border: '#e0e0e0',
    accent: '#007AFF',
    textMuted: '#666666',
    green: '#34C759',
  };

  const value: AppContextType = {
    colors,
    loaded: true,
    signedOutToast: false,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
