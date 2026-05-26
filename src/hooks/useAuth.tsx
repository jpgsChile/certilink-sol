import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authService, readPersistedOtec, writeOtecSession } from "@/lib/services/auth.service";
import type { CertilinkAuthUser, Otec } from "@/lib/database.types";

function userFromOtec(o: Otec | null): CertilinkAuthUser | null {
  if (!o) return null;
  return { id: o.id, email: o.email };
}

interface AuthContextType {
  user: CertilinkAuthUser | null;
  session: null;
  otec: Otec | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, institucion: string, rutInstitucional?: string | null) => Promise<void>;
  signOut: () => Promise<void>;
  refreshOtec: () => Promise<void>;
  /** Actualiza estado y sessionStorage sin re-fetch (útil si RLS bloquea SELECT). */
  patchOtec: (partial: Partial<Otec>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [otec, setOtec] = useState<Otec | null>(() => readPersistedOtec());
  const [user, setUser] = useState<CertilinkAuthUser | null>(() => userFromOtec(readPersistedOtec()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const refreshOtec = useCallback(async () => {
    const stored = readPersistedOtec();
    if (!stored?.id) {
      setOtec(null);
      setUser(null);
      return;
    }
    try {
      const fresh = await authService.fetchOtecById(stored.id);
      if (fresh) {
        setOtec(fresh);
        setUser(userFromOtec(fresh));
      } else {
        setOtec(stored);
        setUser(userFromOtec(stored));
      }
    } catch {
      setOtec(stored);
      setUser(userFromOtec(stored));
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const { user: u, otec: o } = await authService.signIn({ email, password });
    setUser(u);
    setOtec(o);
  };

  const signUp = async (
    email: string,
    password: string,
    institucion: string,
    rutInstitucional?: string | null
  ) => {
    const { user: u, otec: o } = await authService.signUp({
      email,
      password,
      institucion,
      rut: rutInstitucional?.trim() || null,
    });
    setUser(u);
    setOtec(o);
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
    setOtec(null);
  };

  const patchOtec = useCallback((partial: Partial<Otec>) => {
    setOtec((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial } as Otec;
      writeOtecSession(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session: null,
        otec,
        loading,
        signIn,
        signUp,
        signOut,
        refreshOtec,
        patchOtec,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
