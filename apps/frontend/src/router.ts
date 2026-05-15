import { createRouter, createWebHistory } from "vue-router";

import BookmarkListView from "#/features/bookmarks/views/BookmarkListView/BookmarkListView.vue";
import CreateBookmarkView from "#/features/bookmarks/views/CreateBookmarkView.vue";
import EditBookmarkView from "#/features/bookmarks/views/EditBookmarkView.vue";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: BookmarkListView,
    },
    {
      path: "/bookmarks/new",
      name: "bookmark-create",
      component: CreateBookmarkView,
    },
    {
      path: "/bookmarks/:id/edit",
      name: "bookmark-edit",
      component: EditBookmarkView,
    },
  ],
});
