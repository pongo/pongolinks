import { createRouter, createWebHistory } from "vue-router";

import BookmarkListView from "#/features/bookmarks/BookmarkListView.vue";
import CreateBookmarkView from "#/features/bookmarks/CreateBookmarkView.vue";
import EditBookmarkView from "#/features/bookmarks/EditBookmarkView.vue";

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
