"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, ApiError } from "./api";

export interface Me {
  user: { id: string; email: string; name: string | null; image: string | null };
  credits: number;
  hasEntitlement: boolean;
  hasKey: boolean;
}

interface MeState {
  me: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const MeContext = createContext<MeState>({
  me: null,
  loading: true,
  refresh: async () => {},
});

export function MeProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setMe(await api<Me>("/api/me"));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <MeContext.Provider value={{ me, loading, refresh }}>
      {children}
    </MeContext.Provider>
  );
}

export const useMe = () => useContext(MeContext);
