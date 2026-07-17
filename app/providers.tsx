'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface ProState {
  pro: boolean;
  setPro: (v: boolean) => void;
}

const ProContext = createContext<ProState>({ pro: false, setPro: () => {} });

/**
 * M1 simulation of the Pro entitlement.
 *
 * ⚠️ This is a CLIENT-SIDE SIMULATION only, mirroring the historical
 * `window.PRO` flag. In M4 it is replaced by the real entitlement coming from
 * the server session (Supabase profile) — the UI keeps reading `usePro()`,
 * but the value will be injected from a server component / API instead of a
 * local toggle, and every truly Pro-gated action re-checks the status
 * server-side.
 */
export function ProProvider({ children }: { children: ReactNode }) {
  const [pro, setPro] = useState(false);

  useEffect(() => {
    // Keep window.PRO in sync for backward compatibility with the legacy app.
    (window as unknown as { PRO: boolean }).PRO = pro;
  }, [pro]);

  return <ProContext.Provider value={{ pro, setPro }}>{children}</ProContext.Provider>;
}

export function usePro(): ProState {
  return useContext(ProContext);
}
