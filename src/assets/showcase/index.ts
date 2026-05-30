export interface ShowcaseRecord {
  readonly thumbnailUrl: URL;
  readonly imageUrl: URL;
  readonly mungUrl: URL;
}

/**
 * Index of all available showcase documents
 */
export const showcaseIndex: { [documentName: string]: ShowcaseRecord } = {
  // Modern Handwritten
  "ca625f33-b4e1-49a9-bbc4-63130ba0fe70_b611e394-9858-4732-a14c-648f11497bb9": {
    thumbnailUrl: new URL(
      "./ca625f33-b4e1-49a9-bbc4-63130ba0fe70_b611e394-9858-4732-a14c-648f11497bb9/thumbnail.jpg",
      import.meta.url,
    ),
    imageUrl: new URL(
      "./ca625f33-b4e1-49a9-bbc4-63130ba0fe70_b611e394-9858-4732-a14c-648f11497bb9/image.jpg",
      import.meta.url,
    ),
    mungUrl: new URL(
      "./ca625f33-b4e1-49a9-bbc4-63130ba0fe70_b611e394-9858-4732-a14c-648f11497bb9/transcription.mung",
      import.meta.url,
    ),
  },

  // Old Typeset
  "3bb9e322-bc61-4307-856b-6f8fb1a640df_2d5f652c-1df0-474c-ae23-3fb699afe808": {
    thumbnailUrl: new URL(
      "./3bb9e322-bc61-4307-856b-6f8fb1a640df_2d5f652c-1df0-474c-ae23-3fb699afe808/thumbnail.jpg",
      import.meta.url,
    ),
    imageUrl: new URL(
      "./3bb9e322-bc61-4307-856b-6f8fb1a640df_2d5f652c-1df0-474c-ae23-3fb699afe808/image.jpg",
      import.meta.url,
    ),
    mungUrl: new URL(
      "./3bb9e322-bc61-4307-856b-6f8fb1a640df_2d5f652c-1df0-474c-ae23-3fb699afe808/transcription.mung",
      import.meta.url,
    ),
  },

  // Old Handwritten
  "7a040274-1704-4a21-b1c5-f48c821e3841_ced95a07-0587-473c-9c91-199a35555360": {
    thumbnailUrl: new URL(
      "./7a040274-1704-4a21-b1c5-f48c821e3841_ced95a07-0587-473c-9c91-199a35555360/thumbnail.jpg",
      import.meta.url,
    ),
    imageUrl: new URL(
      "./7a040274-1704-4a21-b1c5-f48c821e3841_ced95a07-0587-473c-9c91-199a35555360/image.jpg",
      import.meta.url,
    ),
    mungUrl: new URL(
      "./7a040274-1704-4a21-b1c5-f48c821e3841_ced95a07-0587-473c-9c91-199a35555360/transcription.mung",
      import.meta.url,
    ),
  },
};
