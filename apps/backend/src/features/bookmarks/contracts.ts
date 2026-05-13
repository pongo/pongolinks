export type TagDTO = {
  id: number;
  name: string;
  nameLower: string;
};

export type RelatedLinkDTO = {
  id: number;
  url: string;
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
  relatedLinks: RelatedLinkDTO[];
};

export type EditableBookmarkRequest = {
  url: string;
  title: string;
  description: string;
  isPrivate: boolean;
  tagsText: string;
};
