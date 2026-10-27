import type { FieldError } from "@tasks/contract";
import type { z } from "zod";
import { ValidationError } from "../errors.ts";

export function validate<Schema extends z.ZodType>(
  schema: Schema,
  data: unknown,
): z.output<Schema> {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }

  const fieldErrors: FieldError[] = [];
  for (const issue of result.error.issues) {
    const field = issue.path.length > 0 ? issue.path.join(".") : "body";
    fieldErrors.push({ field, message: issue.message });
  }
  throw new ValidationError(fieldErrors);
}
