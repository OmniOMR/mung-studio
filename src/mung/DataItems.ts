/**
 * MuNG node has the <Data> element which can contain a number of
 * <DataItem> elements with various format extensions. This interface
 * represents this collection of data items.
 */
export interface DataItems {
  [key: string]: {
    type: string;
    value: string;
  };
}
