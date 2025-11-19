import { atom } from "jotai";
import { JotaiStore } from "./JotaiStore";
import { NotationGraphStore } from "./notation-graph-store/NotationGraphStore";
import { computeIssueId, ValidationIssue } from "./ValidationIssue";

/**
 * Contains state related to mung validation rules and found issues
 */
export class ValidationStore {
  private readonly jotaiStore: JotaiStore;

  private readonly notationGraphStore: NotationGraphStore;

  constructor(jotaiStore: JotaiStore, notationGraphStore: NotationGraphStore) {
    this.notationGraphStore = notationGraphStore;
    this.jotaiStore = jotaiStore;

    // register to changes in the notation graph
    // TODO: when a node changes/is deleted, remove/pend its issues
  }

  /**
   * Stores the list of known validation issues with the document
   */
  public readonly issuesAtom = atom<ValidationIssue[]>([]);

  /**
   * Stores the error message if the validation crashes for some reason
   */
  public readonly errorMessageAtom = atom<string | null>(null);

  /**
   * Called by the validation controller when newer issues are available
   * and should be displayed by the app
   */
  public acceptNewerIssues(newIssues: ValidationIssue[]): void {
    this.jotaiStore.set(this.issuesAtom, newIssues);
    this.jotaiStore.set(this.errorMessageAtom, null);
  }

  /**
   * Called by the validation controller when an error occurs during validation
   * and it should be displayed by the app
   */
  public acceptErrorMessage(message: string): void {
    this.jotaiStore.set(this.issuesAtom, []);
    this.jotaiStore.set(this.errorMessageAtom, message);
  }

  /**
   * Removes an issue from the issue list
   */
  public forgetIssue(issue: ValidationIssue): void {
    const issues = this.jotaiStore.get(this.issuesAtom);
    const givenIssueId = computeIssueId(issue);
    const newIssues = issues.filter((i) => computeIssueId(i) !== givenIssueId);
    this.jotaiStore.set(this.issuesAtom, newIssues);
  }
}
