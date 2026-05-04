/**
 * Configurable fetch implementation.
 *
 * Default: globalThis.fetch (works in Node 18+, browsers, CF Workers).
 * Override: call setFetchImpl() before using girk if your environment
 * needs a custom fetch (e.g. node-fetch in Node < 18).
 *
 * Usage in Node < 18:
 *   import nodeFetch from "node-fetch";
 *   import { setFetchImpl } from "girk-sdk";
 *   setFetchImpl(nodeFetch as unknown as FetchFn);
 */

export type FetchFn = typeof globalThis.fetch;

let impl: FetchFn = globalThis.fetch;

/**
 * Override the fetch implementation used by girk-sdk.
 * Pass your own fetch-compatible function (e.g. node-fetch).
 */
export const setFetchImpl = (fn: FetchFn): void => {
  impl = fn;
};

/**
 * Get the current fetch implementation.
 * Falls back to globalThis.fetch if no override has been set.
 */
export const getFetch = (): FetchFn => impl;
