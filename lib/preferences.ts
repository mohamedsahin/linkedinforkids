"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Tiny localStorage-backed boolean store. Settings toggles persist per-browser
 * without a server round-trip — enough to make the switches feel real until a
 * notifications/audit-log API is needed.
 */
export function useLocalBool(key: string, defaultValue: boolean) {
  const storageKey = `plm.pref.${key}`;
  const [value, setValue] = useState(defaultValue);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === "true" || raw === "false") setValue(raw === "true");
    } catch {
      /* localStorage may be unavailable in private mode */
    }
    setReady(true);
  }, [storageKey]);

  const update = useCallback((next: boolean) => {
    setValue(next);
    try {
      window.localStorage.setItem(storageKey, String(next));
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  return [value, update, ready] as const;
}
