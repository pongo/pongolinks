import { describe, expect, it } from "vitest";
import { StacklessError } from "./stackless-error.ts";

class ValidationError extends StacklessError {}

describe("StacklessError", () => {
  it("preserves message, name, and data", () => {
    const error = new StacklessError("msg", { answer: 42 });

    expect(error.message).toBe("msg");
    expect(error.name).toBe("StacklessError");
    expect(error.data).toEqual({ answer: 42 });
  });

  it("behaves like an Error without creating a stack", () => {
    const error = new StacklessError("msg");

    expect(error).toBeInstanceOf(StacklessError);
    expect(error).toBeInstanceOf(Error);
    expect(error.stack).toBeUndefined();
    expect(error.toString()).toBe("StacklessError: msg");
    expect(Object.prototype.toString.call(error)).toBe("[object Error]");
  });

  it("uses subclass names", () => {
    expect(new ValidationError().name).toBe("ValidationError");
  });
});
