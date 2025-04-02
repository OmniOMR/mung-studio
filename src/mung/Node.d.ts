/**
 * Represents a single MuNG Node (annotated object).
 *
 * The application assumes this object to be immutable.
 * (so do NOT mutate instances of nodes)
 */
export interface Node {
  readonly id: number;
  readonly className: string;
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly syntaxOutlinks: number[];
  readonly syntaxInlinks: number[];
  readonly precedenceOutlinks: number[];
  readonly precedenceInlinks: number[];
  // mask
  readonly polygon: number[] | null;
  readonly dataset: string;
  readonly document: string;
}
