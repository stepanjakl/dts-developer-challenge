/*
 * tasks.view.ts
 * Role: Presentation
 *
 * Converts application data into values ready
 * for page templates and UI components.
 */

import type { FieldErrors } from "@tasks/api/problem-details";
import {
  isOverdue,
  type Task,
  type TaskStatus,
  taskStatuses,
  taskStatusLabels,
} from "@tasks/api/tasks-contract";
import { formatDateTime } from "../../utils/uk-date-time.ts";

// --- Task display ---
// Formats API task data for the list and detail pages.

export type TaskView = {
  id: string;
  title: string;
  description: string | null;
  statusLabel: string;
  statusTagClass: string;
  dueText: string;
  createdText: string;
  isOverdue: boolean;
};

export function prepareTaskForDisplay(task: Task, now: Date): TaskView {
  const statusTagClasses: Record<TaskStatus, string> = {
    todo: "govuk-tag--grey",
    in_progress: "",
    done: "govuk-tag--green",
  };

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    statusLabel: taskStatusLabels[task.status],
    statusTagClass: statusTagClasses[task.status],
    dueText: formatDateTime(task.dueAt),
    createdText: formatDateTime(task.createdAt),
    isOverdue: isOverdue(task, now),
  };
}

// --- Status selection ---
// Builds radio options and marks the current status.

export type RadioItem = {
  value: string;
  text: string;
  checked: boolean;
};

export function buildStatusRadioItems(selectedStatus: string): RadioItem[] {
  const items: RadioItem[] = [];
  for (const status of taskStatuses) {
    items.push({
      value: status,
      text: taskStatusLabels[status],
      checked: status === selectedStatus,
    });
  }
  return items;
}

// --- Error summary ---
// Links validation messages to fields in form order.

export type ErrorSummaryItem = {
  text: string;
  href: string;
};

export function buildErrorSummary(errors: FieldErrors, dueAtField = "day"): ErrorSummaryItem[] {
  const errorSummaryLinks = [
    { field: "title", href: "#title" },
    { field: "description", href: "#description" },
    { field: "status", href: "#status" },
    { field: "dueAt", href: `#dueAt-${dueAtField}` },
  ];

  const items: ErrorSummaryItem[] = [];
  for (const link of errorSummaryLinks) {
    const message = errors[link.field];
    if (message) {
      items.push({ text: message, href: link.href });
    }
  }
  return items;
}

// --- Success messages ---
// Maps recognised URL values to confirmation messages.

export function getSuccessMessage(value: unknown): string | undefined {
  if (value === "created") {
    return "Task created";
  }
  if (value === "status-updated") {
    return "Status updated";
  }
  if (value === "deleted") {
    return "Task deleted";
  }
  return undefined;
}
