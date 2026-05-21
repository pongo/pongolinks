import type { ApiErrorCode } from "@pongolinks/shared/api-errors";
import { StacklessError } from "@pongolinks/shared/errors";

export type { ApiErrorCode };

export type FormErrors = {
  url?: string;
  title?: string;
  form?: string;
};

export class ApiError extends StacklessError {
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    data?: Record<string, unknown>,
    readonly formErrors: FormErrors = { form: message },
  ) {
    super(message, data);
  }
}
