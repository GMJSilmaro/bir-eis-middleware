"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface AppSearchContextValue {
  query: string;
  setQuery: (value: string) => void;
}

const AppSearchContext = createContext<AppSearchContextValue | null>(null);

export function AppSearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  const value = useMemo(() => ({ query, setQuery }), [query]);

  return (
    <AppSearchContext.Provider value={value}>
      {children}
    </AppSearchContext.Provider>
  );
}

export function useAppSearch(): AppSearchContextValue {
  const context = useContext(AppSearchContext);
  if (!context) {
    throw new Error("useAppSearch must be used within AppSearchProvider.");
  }
  return context;
}
