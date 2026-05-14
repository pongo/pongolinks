import { StacklessError } from "../errors/stackless-error.ts";

export type Ok<T> = {
  readonly isOk: true;
  readonly isErr: false;
  readonly value: T;
};

export type Err<E extends Error = Error> = {
  readonly isOk: false;
  readonly isErr: true;
  readonly error: E;
};

export type Result<T = undefined, E extends Error = Error> = Ok<T> | Err<E>;

export function Ok<T = undefined>(value?: T): Ok<T> {
  return {
    isOk: true,
    isErr: false,
    value: value as T,
  } as const;
}

export function Err<E extends Error = Error>(error: E): Err<E>;
export function Err(error: string, data?: Record<string, unknown>): Err<StacklessError>;
export function Err<E extends Error = Error>(
  error: E | string,
  data?: Record<string, unknown>,
): Err<E | StacklessError> {
  return {
    isOk: false,
    isErr: true,
    error: typeof error === "string" ? new StacklessError(error, data) : error,
  } as const;
}

export function isErr<T, E extends Error>(result: Result<T, E>): result is Err<E> {
  return result.isErr;
}

export function isOk<T, E extends Error>(result: Result<T, E>): result is Ok<T> {
  return result.isOk;
}

export function isResult<T, E extends Error>(value: unknown): value is Result<T, E> {
  if (typeof value !== "object" || value === null) return false;

  const maybeResult = value as Partial<Result<T, E>>;
  return (
    (maybeResult.isOk === true && maybeResult.isErr === false && "value" in maybeResult) ||
    (maybeResult.isOk === false && maybeResult.isErr === true && "error" in maybeResult)
  );
}

type ResultValue<R> = R extends Ok<infer T> ? T : never;
type ResultError<R> = R extends Err<infer E> ? E : never;

type CombinedValues<R extends readonly Result<unknown>[]> = {
  -readonly [K in keyof R]: ResultValue<R[K]>;
};

type CombinedError<R extends readonly Result<unknown>[]> = ResultError<R[number]>;

/**
 * @example
 * declare function a(): Result<string>;
 * declare function b(): Result<number>;
 * const result = combine([a(), b()]);
 * if (result.isOk) {
 *   const [valueA, valueB] = result.value;
 *   // valueA: string
 *   // valueB: number
 * }
 */
export function combine<const R extends readonly Result<unknown>[]>(
  results: R,
): Result<CombinedValues<R>, CombinedError<R>> {
  const values: unknown[] = [];

  for (const result of results) {
    if (result.isErr) {
      return result as Err<CombinedError<R>>;
    }

    values.push(result.value);
  }

  return Ok(values as CombinedValues<R>);
}
