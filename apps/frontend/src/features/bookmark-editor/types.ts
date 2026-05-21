export type EditableBookmarkPayload = {
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
  tagsText: string;
};

export type DeletedBookmarkResponse = {
  deletedBookmarkId: number;
};
