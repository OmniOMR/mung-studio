import { Atom, atom, WritableAtom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export interface SimpleBackendConnection {
  /**
   * Acts as ID and a password. When null, nobody is logged in.
   */
  readonly userToken: string | null;

  /**
   * Base URL to the simple backend, to which query URL part can be
   * directly appended, for example: "http://localhost:8080/"
   */
  readonly backendUrl: string;
}

/**
 * Persistent atom that stores the simple backend user token
 */
export const userTokenAtom: WritableAtom<string | null, [string | null], void> =
  atomWithStorage<string | null>(
    "mung-studio::simple-backend::user-token",
    null,
    createJSONStorage<string | null>(() => window.localStorage),
  );

/**
 * Read-only atom that exposes the whole connection object
 */
export const simpleBackendConnectionAtom: Atom<SimpleBackendConnection> = atom(
  (get) => {
    const url = process.env["SIMPLE_PHP_BACKEND_URL"];
    if (url === undefined) {
      throw new Error("Simple PHP Backend URL is not specified in env vars.");
    }
    return {
      userToken: get(userTokenAtom),
      backendUrl: url,
    };
  },
);
