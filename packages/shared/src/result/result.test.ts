import { describe, expect, it } from "vitest";
import { StacklessError } from "../errors/stackless-error.ts";
import { combine, Err, isErr, isOk, isResult, Ok, type Result } from "./result.ts";

describe("Result", () => {
  it("creates Ok results with values", () => {
    const result = Ok({ id: "user-id" });

    expect(result.isOk).toBe(true);
    expect(result.isErr).toBe(false);
    expect(result.value).toEqual({ id: "user-id" });
    expect(isOk(result)).toBe(true);
    expect(isErr(result)).toBe(false);
  });

  it("creates Ok results without values", () => {
    const result: Result = Ok();

    expect(result.isOk).toBe(true);
    expect(result.value).toBeUndefined();
  });

  it("creates Err results from messages and data", () => {
    const result = Err("user not found", { id: "missing-id" });

    expect(result.isOk).toBe(false);
    expect(result.isErr).toBe(true);
    expect(result.error).toBeInstanceOf(StacklessError);
    expect(result.error.message).toBe("user not found");
    expect(result.error.data).toEqual({ id: "missing-id" });
    expect(isErr(result)).toBe(true);
    expect(isOk(result)).toBe(false);
  });

  it("preserves existing errors", () => {
    const error = new TypeError("bad value");
    const result = Err(error);

    expect(result.error).toBe(error);
  });

  it("identifies result-shaped values", () => {
    expect(isResult(Ok("value"))).toBe(true);
    expect(isResult(Err("failed"))).toBe(true);
    expect(isResult(null)).toBe(false);
    expect(isResult({ isOk: true })).toBe(false);
    expect(isResult({ isOk: true, isErr: true, value: "value" })).toBe(false);
  });

  it("combines Ok results into ordered values", () => {
    const result = combine([Ok("user-id"), Ok(42), Ok({ active: true })]);

    expect(result.isOk).toBe(true);
    if (result.isOk) {
      expect(result.value).toEqual(["user-id", 42, { active: true }]);
    }
  });

  it("returns the first Err when combining results", () => {
    const firstError = new Error("first");
    const secondError = new Error("second");
    const result = combine([Ok("ready"), Err(firstError), Err(secondError)]);

    expect(result.isErr).toBe(true);
    if (result.isErr) {
      expect(result.error).toBe(firstError);
    }
  });
});
