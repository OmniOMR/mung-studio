import { useCallback, useEffect, useRef } from "react";
import { isMacish } from "./isMacish";

const MOD_KEY_NAME = "MS::CtrlOrCmd";
const MOD_KEY_REPLACEMENT = isMacish() ? "Meta" : "Control";

/**
 * Returns a ref value that holds true when the requested key is pressed
 */
export function useIsKeyPressedRef(
  givenKey: string,
  caseSensitive: boolean = false,
) {
  const testedKey = givenKey === MOD_KEY_NAME ? MOD_KEY_REPLACEMENT : givenKey;

  const isPressedRef = useRef<boolean>(false);

  const eventHandler = useCallback((e: KeyboardEvent) => {
    if (caseSensitive) {
      if (e.key !== testedKey) return;
    } else {
      if (e.key.toLowerCase() !== testedKey.toLowerCase()) return;
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
