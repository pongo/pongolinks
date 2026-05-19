import { Elysia, type MaybePromise } from "elysia";
import { createHash, type BinaryLike } from "node:crypto";

import type { StringOrBuffer, SupportedCryptoAlgorithms } from "bun";

type ETagHashAlgorithm = "wyhash" | SupportedCryptoAlgorithms;
type ETagHashData = StringOrBuffer;
type ETagHashFunction = (response: ETagHashData) => string;

type ETagOptions = {
  algorithm?: ETagHashAlgorithm;
  weak?: boolean;
  hash?: ETagHashFunction;
  serialize?: (response: unknown) => MaybePromise<ETagHashData | undefined>;
};

type ETagContextApi = {
  setETag(etag: string): void;
  buildETagFor(response: ETagHashData): string;
  isMatch(etag: string): boolean;
  isNoneMatch(etag: string): boolean;
  setVary(headers: "*" | string | string[]): void;
};

function parseMatchHeader(header?: string) {
  return header?.split(", ") ?? [];
}

function canBeHashed(response: unknown): response is ETagHashData {
  return (
    typeof response === "string" ||
    response instanceof ArrayBuffer ||
    response instanceof SharedArrayBuffer ||
    ArrayBuffer.isView(response)
  );
}

function getBun() {
  return typeof Bun === "undefined" ? undefined : Bun;
}

function buildNodeHash(algorithm: ETagHashAlgorithm, response: ETagHashData) {
  if (algorithm === "wyhash") {
    throw new TypeError("Algorithm wyhash is only supported in Bun.");
  }

  const binaryLike: BinaryLike =
    response instanceof ArrayBuffer || response instanceof SharedArrayBuffer
      ? new Uint8Array(response)
      : response;

  return createHash(algorithm).update(binaryLike).digest("base64");
}

function buildHashFn({
  algorithm,
  weak,
  hash,
}: Required<Pick<ETagOptions, "algorithm" | "weak">> & Pick<ETagOptions, "hash">) {
  const prefix = weak ? 'W/"' : '"';

  if (hash) {
    return (response: ETagHashData) => prefix + hash(response) + '"';
  }

  const bun = getBun();
  if (!bun) {
    return (response: ETagHashData) => prefix + buildNodeHash(algorithm, response) + '"';
  }

  if (algorithm === "wyhash") {
    return (response: ETagHashData) => prefix + bun.hash.wyhash(response) + '"';
  }

  if (!bun.CryptoHasher.algorithms.includes(algorithm)) {
    throw new TypeError(`Algorithm ${algorithm} not supported.`);
  }

  return (response: ETagHashData) =>
    prefix + bun.CryptoHasher.hash(algorithm, response, "base64") + '"';
}

export function etag(options: ETagOptions = {}) {
  if (typeof options.algorithm !== "string") {
    options.algorithm = "sha1";
  }

  const { serialize } = options;
  const hash = buildHashFn({
    algorithm: options.algorithm,
    weak: options.weak ?? false,
    hash: options.hash,
  });

  return new Elysia({ name: "pongolinks-etag", seed: options })
    .derive((ctx) => {
      let matchEtagValues: string[] | undefined;
      let noneMatchEtagValues: string[] | undefined;

      return {
        setETag(etag) {
          ctx.set.headers.etag = etag;
        },
        buildETagFor(response) {
          return hash(response);
        },
        isMatch(etag) {
          if (!matchEtagValues) {
            matchEtagValues = parseMatchHeader(ctx.headers["if-match"]);
          }

          return matchEtagValues.includes(etag) || matchEtagValues.includes("*");
        },
        isNoneMatch(etag) {
          if (!noneMatchEtagValues) {
            noneMatchEtagValues = parseMatchHeader(ctx.headers["if-none-match"]);
          }

          return noneMatchEtagValues.includes(etag) || noneMatchEtagValues.includes("*");
        },
        setVary(headers) {
          ctx.set.headers.vary = typeof headers === "string" ? headers : headers.join(", ");
        },
      } satisfies ETagContextApi;
    })
    .onAfterHandle(async (ctx) => {
      const { request, set, response } = ctx;
      let etag = set.headers.etag;

      if (!etag) {
        let toHash: ETagHashData | undefined;

        if (canBeHashed(response)) {
          toHash = response;
        } else if (typeof serialize === "function") {
          toHash = await serialize(response);
        }

        if (typeof toHash === "undefined") {
          return;
        }

        etag = ctx.buildETagFor(toHash);
        ctx.setETag(etag);
      }

      if (ctx.isNoneMatch(etag)) {
        switch (request.method) {
          case "GET":
          case "HEAD":
            set.status = 304;
            break;
          default:
            set.status = 412;
            break;
        }

        ctx.response = null;
      }
    })
    .as("global");
}

export type { ETagHashFunction };
