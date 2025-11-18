import { atom, WritableAtom } from "jotai";
import { ISimpleEvent, SimpleEventDispatcher } from "strongly-typed-events";

/**
 * Atom with a change event that fires when the atom value is set
 */
export class AtomWithEvent<T> {
  private baseAtom: WritableAtom<T, [T], void>;

  /**
   * Constructs an atom with event by wrapping a base atom and intercepting
   * writes
   */
  constructor(baseAtom: WritableAtom<T, [T], void>) {
    this.baseAtom = baseAtom;
  }

  /**
   * Constructs a primitive atom with event
   */
  public static primitiveAtom<T>(initialValue: T): AtomWithEvent<T> {
    return new AtomWithEvent<T>(atom(initialValue));
  }

  /**
   * Atom that is exposed that, when set will emit the event
   */
  public atom: WritableAtom<T, [T], void> = atom(
    (get) => get(this.baseAtom),
    (get, set, newValue) => {
      set(this.baseAtom, newValue);
      this.eventDispatcher.dispatch(newValue);
    },
  );

  private eventDispatcher = new SimpleEventDispatcher<T>();

  /**
   * This event is triggered after the atom is set a new value,
   * the new value is given as the argument to the event handler
   */
  public get event(): ISimpleEvent<T> {
    return this.eventDispatcher.asEvent();
  }
}
