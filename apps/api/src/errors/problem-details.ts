/*
 * problem-details.ts
 * Role: Shared contract
 *
 * Defines the error response the API sends, based on RFC 9457 problem details.
 */

import { z } from "zod";

// Field errors, such as { title: "Enter a title" }
export const fieldErrorsSchema = z.record(z.string(), z.string());

export type FieldErrors = z.infer<typeof fieldErrorsSchema>;

export const problemSchema = z.object({
  title: z.string(),
  status: z.number().int(),
  detail: z.string().optional(),
  errors: fieldErrorsSchema.optional(),
});

export type Problem = z.infer<typeof problemSchema>;
