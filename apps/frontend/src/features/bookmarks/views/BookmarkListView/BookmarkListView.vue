<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, LockIcon } from "@lucide/vue";
import { renderBookmarkDescriptionHtml } from "@pongolinks/shared/bookmark-description";
import { computed, ref, watch } from "vue";
import { RouterLink, useRoute, type RouteLocationRaw } from "vue-router";
import { listBookmarks } from "../../api/api";
import type { BookmarkDTO, BookmarkListPagination } from "../../types";
import {
  createPaginationWindow,
  normalizeBookmarkListPageQuery,
  type PaginationWindowItem,
} from "./pagination-window";

import { useAppVariants } from "#/variants.ts";
const { variants } = useAppVariants();
const bookmarkDescriptionHtmlOptions = {
  linkClassName: "bookmark-description-link",
};

const route = useRoute();
const bookmarks = ref<BookmarkDTO[]>([]);
const pagination = ref<BookmarkListPagination>({
  page: 1,
  pageSize: 3,
  totalCount: 0,
  totalPages: 0,
  hasPreviousPage: false,
  hasNextPage: false,
});
const isLoading = ref(true);
const error = ref("");
const currentPage = computed(() => normalizeBookmarkListPageQuery(route.query.page));
const paginationItems = computed(() =>
  createPaginationWindow({
    page: pagination.value.page,
    totalPages: pagination.value.totalPages,
  }),
);

function bookmarkListRoute(page: number): RouteLocationRaw {
  return page <= 1 ? "/" : { path: "/", query: { page: String(page) } };
}

function previousPageRoute(): RouteLocationRaw {
  return bookmarkListRoute(Math.max(1, pagination.value.page - 1));
}

function nextPageRoute(): RouteLocationRaw {
  return bookmarkListRoute(pagination.value.page + 1);
}

function paginationItemKey(item: PaginationWindowItem) {
  return item.type === "page" ? `page-${item.page}` : `ellipsis-${item.key}`;
}

function formatUpdatedAt(updatedAt: string) {
  const parsed = new Date(updatedAt);

  if (Number.isNaN(parsed.getTime())) {
    return updatedAt;
  }

  return YYYYMMDD(parsed);
}

/**
 * Converts a Date object to a string in the format YYYY-MM-DD.
 *
 * @param {Date} date - The date to be converted.
 * @returns {string} The formatted date string.
 */
function YYYYMMDD(date: Readonly<Date>): string {
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, "0");
  const dd = date.getDate().toString().padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatBookmarkDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

watch(
  currentPage,
  async (page) => {
    isLoading.value = true;
    error.value = "";

    const result = await listBookmarks(page);

    if (result.isOk) {
      bookmarks.value = result.value.bookmarks;
      pagination.value = result.value.pagination;
    } else {
      error.value = result.error.formErrors.form ?? result.error.message;
    }

    isLoading.value = false;
  },
  { immediate: true },
);
</script>

<template>
  <main class="ui-page-text min-h-screen px-4 py-8 sm:px-6">
    <section class="mx-auto max-w-3xl">
      <header class="mb-7 flex items-center justify-between gap-4">
        <div>
          <p class="ui-link text-xs font-bold tracking-normal uppercase">pongolinks</p>
          <h1 class="ui-text-strong mt-1 text-2xl font-bold">Bookmarks</h1>
        </div>
        <RouterLink
          class="ui-action inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition"
          to="/bookmarks/new"
        >
          New bookmark
        </RouterLink>
      </header>

      <p v-if="isLoading" class="ui-text-muted text-sm">Loading bookmarks...</p>
      <p v-else-if="error" class="ui-danger-banner border-l-4 px-4 py-3 text-sm font-medium">
        {{ error }}
      </p>

      <template v-else>
        <div
          v-if="bookmarks.length === 0"
          class="ui-border ui-surface border border-dashed px-5 py-8"
        >
          <h2 class="ui-text-strong text-lg font-semibold">
            {{ pagination.totalCount === 0 ? "No bookmarks yet" : "No bookmarks on this page" }}
          </h2>
          <p class="ui-text-muted mt-2 text-sm">
            {{
              pagination.totalCount === 0
                ? "Save the first link you want to keep close."
                : "Choose another page to continue browsing saved links."
            }}
          </p>
          <RouterLink
            v-if="pagination.totalCount === 0"
            class="ui-action mt-5 inline-flex min-h-10 items-center justify-center px-4 text-sm font-semibold transition"
            to="/bookmarks/new"
          >
            Create bookmark
          </RouterLink>
        </div>

        <ul
          v-else
          class="ui-border-subtle ui-divide-subtle ui-surface divide-y"
          :class="[variants.bgBlue ? 'border-y' : 'border-0']"
        >
          <li v-for="bookmark in bookmarks" :key="bookmark.id" class="py-4">
            <div
              class="flex items-start justify-between gap-4"
              :class="{ 'px-4': variants.bgBlue }"
            >
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <a
                    class="ui-title-link text-base font-semibold wrap-break-word"
                    :href="bookmark.url"
                    rel="noreferrer"
                    target="_blank"
                  >
                    {{ bookmark.title }}
                  </a>
                  <span
                    v-if="bookmark.isPrivate"
                    aria-label="Private bookmark"
                    title="Private bookmark"
                    class="ui-text-soft inline-flex items-center justify-center pt-px"
                  >
                    <LockIcon class="size-3.5" aria-hidden="true" />
                  </span>
                </div>
                <div class="ui-text-muted mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <span class="break-all">{{ formatBookmarkDomain(bookmark.url) }}</span>
                  <span
                    v-for="tag in bookmark.tags"
                    :key="tag.id"
                    class="ui-tag inline-flex max-w-full items-center border px-1.5 py-0.5 text-xs"
                  >
                    {{ tag.name }}
                  </span>
                </div>
                <p
                  v-if="bookmark.description"
                  class="ui-text-readable mt-2 text-sm leading-6 whitespace-pre-wrap"
                  v-html="
                    renderBookmarkDescriptionHtml(
                      bookmark.description,
                      bookmarkDescriptionHtmlOptions,
                    )
                  "
                ></p>
              </div>
              <div class="shrink-0 text-right">
                <RouterLink
                  class="ui-muted-link text-sm font-semibold"
                  :to="`/bookmarks/${bookmark.id}/edit`"
                >
                  Edit
                </RouterLink>
                <p class="ui-text-soft mt-2 text-xs font-medium">
                  {{ formatUpdatedAt(bookmark.updatedAt) }}
                </p>
              </div>
            </div>
          </li>
        </ul>

        <div class="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p class="ui-text-muted text-sm">
            {{ pagination.totalCount }}
            {{ pagination.totalCount === 1 ? "bookmark" : "bookmarks" }}
          </p>

          <nav
            v-if="pagination.totalPages > 1"
            class="flex items-center gap-1"
            aria-label="Bookmark pages"
          >
            <RouterLink
              v-if="pagination.hasPreviousPage"
              class="ui-muted-link inline-flex size-9 items-center justify-center border text-sm font-semibold"
              :to="previousPageRoute()"
              aria-label="Previous page"
            >
              <ChevronLeftIcon class="size-4" aria-hidden="true" />
            </RouterLink>

            <template v-for="item in paginationItems" :key="paginationItemKey(item)">
              <RouterLink
                v-if="item.type === 'page'"
                class="inline-flex size-9 items-center justify-center border text-sm font-semibold transition"
                :class="
                  item.page === pagination.page ? 'ui-action' : 'ui-muted-link ui-border-subtle'
                "
                :to="bookmarkListRoute(item.page)"
                :aria-current="item.page === pagination.page ? 'page' : undefined"
              >
                {{ item.page }}
              </RouterLink>
              <span v-else class="ui-text-muted inline-flex size-9 items-center justify-center">
                ...
              </span>
            </template>

            <RouterLink
              v-if="pagination.hasNextPage"
              class="ui-muted-link inline-flex size-9 items-center justify-center border text-sm font-semibold"
              :to="nextPageRoute()"
              aria-label="Next page"
            >
              <ChevronRightIcon class="size-4" aria-hidden="true" />
            </RouterLink>
          </nav>
        </div>
      </template>
    </section>
  </main>
</template>

<style>
.bookmark-description-link {
  color: var(--ui-link-readable);
  text-decoration-line: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}

.bookmark-description-link:hover {
  color: var(--ui-link);
}
</style>
