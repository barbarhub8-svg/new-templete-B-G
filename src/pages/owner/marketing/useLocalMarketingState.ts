import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { toast } from "../../../hooks/use-toast";

/** Local demo persistence. Storage may be unavailable or full (e.g. private browsing). */
export function useLocalMarketingState<T>(
  key: string,
  fallback: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const saved = window.localStorage.getItem(key);
      return saved === null ? fallback : (JSON.parse(saved) as T);
    } catch {
      return fallback;
    }
  });
  const warned = useRef(false);
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      warned.current = false;
    } catch {
      if (!warned.current) {
        warned.current = true;
        toast({
          title: "Could not save on this device",
          description:
            "Storage may be full or unavailable. Your changes will only last until this page closes.",
          variant: "destructive",
        });
      }
    }
  }, [key, value]);
  return [value, setValue];
}
