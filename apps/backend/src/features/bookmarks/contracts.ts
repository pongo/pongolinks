export type TagDTO = {
  id: number;
  name: string;
  nameLower: string;
};

export type BookmarkDTO = {
  id: number;
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  tags: TagDTO[];
};

export type EditableBookmarkRequest = {
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
  tagsText: string;
};
