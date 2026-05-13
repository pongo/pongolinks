export type BookmarkDTO = {
  id: number;
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EditableBookmarkRequest = {
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
};
