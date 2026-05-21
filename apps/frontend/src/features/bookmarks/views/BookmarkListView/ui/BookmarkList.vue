<script setup lang="ts">
import { LockIcon } from "@lucide/vue";
import { APP_BASE_PATH } from "@pongolinks/shared/app-config";
import { renderBookmarkDescriptionHtml } from "@pongolinks/shared/bookmark-description";
import { RouterLink } from "vue-router";

import type { BookmarkDTO } from "../../../types.ts";
import type { BookmarkListRouteState } from "../../../utils/bookmark-list-query-state.ts";

import { useAppVariants } from "#/variants.ts";
import { YYYYMMDD } from "#/shared/utils/YYYYMMDD.ts";

const props = defineProps<{
  bookmarks: BookmarkDTO[];
  queryState: BookmarkListRouteState;
}>();
const emit = defineEmits<{
  tagClick: [tagName: string];
  domainClick: [domain: string];
}>();

const { variants } = useAppVariants();
const bookmarkDescriptionHtmlOptions = {
  linkClassName: "bookmark-description-link",
  quoteClassName: "bookmark-description-quote",
};

function formatUpdatedAt(updatedAt: string) {
  const parsed = new Date(updatedAt);

  if (Number.isNaN(parsed.getTime())) {
    return updatedAt;
  }

  return YYYYMMDD(parsed);
}

function formatBookmarkDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function isIncludedTagActive(tagName: string) {
  const lower = tagName.toLocaleLowerCase("und");
  return props.queryState.tags.some(
    (tag) => !tag.startsWith("-") && tag.toLocaleLowerCase("und") === lower,
  );
}

function isDomainActive(domain: string) {
  return (
    props.queryState.domain !== null &&
    props.queryState.domain.toLocaleLowerCase("und") === domain.toLocaleLowerCase("und")
  );
}
</script>

<template>
  <ul
    class="ui-border-subtle ui-divide-subtle ui-surface divide-y"
    :class="[variants.bgBlue ? 'border-y' : 'border-0']"
  >
    <li v-for="bookmark in bookmarks" :key="bookmark.id" class="py-4">
      <div class="flex items-start justify-between gap-4" :class="{ 'px-4': variants.bgBlue }">
        <div class="min-w-0">
          <div>
            <span
              v-if="bookmark.isPrivate"
              aria-label="Private bookmark"
              title="Private bookmark"
              class="ui-text-soft relative top-px mr-[0.3em] inline-block"
            >
              <LockIcon class="size-3.5" aria-hidden="true" />
            </span>
            <a
              class="ui-title-link text-base font-semibold wrap-break-word"
              :href="bookmark.url"
              rel="noreferrer"
              target="_blank"
            >
              {{ bookmark.title }}
            </a>
          </div>
          <div class="ui-text-muted mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <a
              class="cursor-pointer break-all hover:underline"
              :class="{
                'ui-tag ui-tag-active border px-1.5 py-0.5 hover:no-underline!': isDomainActive(
                  formatBookmarkDomain(bookmark.url),
                ),
              }"
              :href="`${APP_BASE_PATH}/?domain=${encodeURIComponent(formatBookmarkDomain(bookmark.url))}`"
              @click.left.exact.prevent="emit('domainClick', formatBookmarkDomain(bookmark.url))"
            >
              {{ formatBookmarkDomain(bookmark.url) }}
            </a>
            <a
              v-for="tag in bookmark.tags"
              :key="tag.id"
              class="ui-tag inline-flex max-w-full items-center border px-1.5 py-0.5 text-xs"
              :class="{ 'ui-tag-active': isIncludedTagActive(tag.name) }"
              :href="`${APP_BASE_PATH}/t/${encodeURIComponent(tag.nameLower)}`"
              @click.left.exact.prevent="emit('tagClick', tag.name)"
            >
              {{ tag.name }}
            </a>
          </div>
          <div
            v-if="bookmark.description"
            class="ui-text-readable mt-2 text-sm leading-6 whitespace-pre-wrap"
            v-html="
              renderBookmarkDescriptionHtml(bookmark.description, bookmarkDescriptionHtmlOptions)
            "
          ></div>
        </div>
        <div class="shrink-0 text-right">
          <RouterLink
            class="ui-muted-link text-sm font-semibold select-none"
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

.bookmark-description-quote {
  margin: 0;
  border-left: 3px solid var(--ui-border);
  padding-left: 0.75rem;
  color: var(--ui-text-muted);
}
</style>
