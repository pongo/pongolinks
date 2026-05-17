import { createRouter, createWebHistory } from "vue-router";

import BookmarkListView from "#/features/bookmarks/views/BookmarkListView/BookmarkListView.vue";
import TagShortcutRouteView from "#/features/bookmarks/views/BookmarkListView/TagShortcutRouteView.vue";
import CreateBookmarkView from "#/features/bookmarks/views/CreateBookmarkView/CreateBookmarkView.vue";
import EditBookmarkView from "#/features/bookmarks/views/EditBookmarkView.vue";
import ToolsView from "#/features/tools/views/ToolsView.vue";

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: "/",
      name: "home",
      component: BookmarkListView,
    },
    {
      path: "/t",
      name: "bookmark-tag-shortcut-empty",
      component: TagShortcutRouteView,
    },
    {
      path: "/t/:tags(.*)",
      name: "bookmark-tag-shortcut",
      component: TagShortcutRouteView,
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
    {
      path: "/tools",
      name: "tools",
      component: ToolsView,
    },
  ],
});
