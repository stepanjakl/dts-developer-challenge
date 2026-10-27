import type { FieldError } from "@tasks/contract";

export class NotFoundError extends Error {}

export class ValidationError extends Error {
  fieldErrors: FieldError[];

  constructor(fieldErrors: FieldError[]) {
    super("Validation failed");
    this.fieldErrors = fieldErrors;
  }
}
