/**
 * Represents one node class (identified by class name)
 * and holds the class metadata (obsoleteness, etc.).
 * This is a public-facing class for the ontology.
 */
export interface MungClass {
  /**
   * The identifier for the class (e.g. "noteheadBlack")
   */
  readonly className: string;

  /**
   * Icon for the class, encoded as a unicode string via the SMuFL characters.
   * This value is used in the UI together with the Bravura font to visualize
   * a given class.
   */
  readonly unicode: string;

  /**
   * Is this class name defined in the SMuFL standrad or not
   */
  readonly isSmufl: boolean;

  /**
   * If this isn't a SMuFL class, what SMuFL classes should be used instad
   */
  readonly smuflEquivalents?: string[];

  /**
   * Whether or not is this class used in the MUSCIMA++ 2.0 dataset
   */
  readonly isMuscimaPP20: boolean;

  /**
   * Composite node is a mung node that does not have visual appearance
   * on the page. Its primary function is to provide higher-level node in
   * the semantic notation graph. Examples: "measureSeparator", "keySignature".
   * Being a composite node is a justified reason to not be a SMuFL class.
   */
  readonly isComposite: boolean;

  /**
   * If there is some other valid reason for the class to not be SMuFL aligned,
   * this field should contain that explanation.
   */
  readonly otherSmuflDivergenceJustification?: string;

  /**
   * If this node is not smufl aligned, then is there a valid reason for it
   * or should an alternative class name be used?
   */
  readonly justifiedSmuflDivergence?: boolean;
}
