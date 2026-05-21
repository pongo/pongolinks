import { createRouter, createWebHistory } from "vue-router";

import BookmarkListView from "#/features/bookmarks/views/BookmarkListView/BookmarkListView.vue";
import TagShortcutRouteView from "#/features/bookmarks/views/TagShortcutRouteView.vue";
import CreateBookmarkView from "#/features/bookmark-editor/views/CreateBookmarkView/CreateBookmarkView.vue";
import TagsView from "#/features/tags/views/TagsView.vue";
import ToolsView from "#/features/tools/views/ToolsView.vue";
import EditBookmarkView from "#/features/bookmark-editor/views/EditBookmarkView.vue";

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
      path: "/tags",
      name: "tags",
      component: TagsView,
    },
    {
      path: "/tools",
      name: "tools",
      component: ToolsView,
    },
  ],
});
