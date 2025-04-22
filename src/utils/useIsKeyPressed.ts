import { useCallback, useEffect, useState } from "react";

/**
 * Returns a ref value that holds true when the requested key is pressed
 */
export function useIsKeyPressed(key: string, caseSensitive: boolean = false) {
  const [isPressed, setIsPressed] = useState<boolean>(false);

  const eventHandler = useCallback(
    (e: KeyboardEvent) => {
      if (caseSensitive) {
        if (e.key !== key) return;
      } else {
        if (e.key.toLowerCase() !== key.toLowerCase()) return;
      }

      if (e.type === "keydown") setIsPressed(true);
      if (e.type === "keyup") setIsPressed(false);
    },
    [setIsPressed],
  );

  useEffect(() => {
    window.addEventListener("keydown", eventHandler);
    window.addEventListener("keyup", eventHandler);
    return () => {
      window.removeEventListener("keydown", eventHandler);
      window.removeEventListener("keyup", eventHandler);
    };
  }, [eventHandler]);

  return isPressed;
}
