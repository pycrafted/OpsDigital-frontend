import { useCallback, useEffect, useState } from 'react';

type SetValue<T> = T | ((val: T) => T);

const SYNC_EVENT = 'use-local-storage-sync';

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Setter : écrit dans localStorage ET notifie toutes les instances du même key
  const setValue = useCallback(
    (value: SetValue<T>) => {
      const next =
        typeof value === 'function'
          ? (value as (val: T) => T)(storedValue)
          : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        // ignore
      }
      setStoredValue(next);
      // Notifie les autres composants qui utilisent le même key
      window.dispatchEvent(
        new CustomEvent(SYNC_EVENT, { detail: { key, value: next } })
      );
    },
    [key, storedValue]
  );

  // Écoute les changements émis par d'autres instances
  useEffect(() => {
    const handle = (e: Event) => {
      const { key: k, value } = (e as CustomEvent<{ key: string; value: T }>).detail;
      if (k === key) setStoredValue(value);
    };
    window.addEventListener(SYNC_EVENT, handle);
    return () => window.removeEventListener(SYNC_EVENT, handle);
  }, [key]);

  return [storedValue, setValue];
}

export default useLocalStorage;
