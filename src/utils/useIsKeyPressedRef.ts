import { useCallback, useEffect, useRef } from "react";

/**
 * Returns a ref value that holds true when the requested key is pressed
 */
export function useIsKeyPressedRef(
  key: string,
  caseSensitive: boolean = false,
) {
  const isPressedRef = useRef<boolean>(false);

  const eventHandler = useCallback((e: KeyboardEvent) => {
    if (caseSensitive) {
      if (e.key !== key) return;
    } else {
      if (e.key.toLowerCase() !== key.toLowerCase()) return;
    }

    if (e.type === "keydown") isPressedRef.current = true;
    if (e.type === "keyup") isPressedRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", eventHandler);
    window.addEventListener("keyup", eventHandler);
    return () => {
      window.removeEventListener("keydown", eventHandler);
      window.removeEventListener("keyup", eventHandler);
    };
  }, []);

  return isPressedRef;
}
