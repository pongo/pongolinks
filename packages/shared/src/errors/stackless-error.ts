export class StacklessError implements Error {
  readonly data?: Record<string, unknown>;
  readonly message: string;
  readonly name: string;
  readonly stack?: undefined;

  constructor(message = "", data?: Record<string, unknown>) {
    this.data = data;
    this.message = message;
    this.name = this.constructor.name;
  }
}

Object.setPrototypeOf(StacklessError.prototype, Error.prototype);

Object.defineProperty(StacklessError.prototype, Symbol.toStringTag, {
  value: "Error",
  writable: false,
  configurable: false,
  enumerable: false,
});
