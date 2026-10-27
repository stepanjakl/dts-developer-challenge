import {
  isOverdue,
  type Task,
  type TaskStatus,
  taskStatuses,
  taskStatusLabels,
} from "@tasks/contract";
import { formatDateTime } from "../dates.ts";

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

export type RadioItem = {
  value: string;
  text: string;
  checked: boolean;
};

const statusTagClasses: Record<TaskStatus, string> = {
  todo: "govuk-tag--grey",
  in_progress: "",
  done: "govuk-tag--green",
};

const successMessages = new Map([
  ["created", "Task created"],
  ["status-updated", "Status updated"],
  ["deleted", "Task deleted"],
]);

export function toTaskView(task: Task, now: Date): TaskView {
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

export function statusRadioItems(selectedStatus: string): RadioItem[] {
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

export function successMessageFor(key: unknown): string | undefined {
  if (typeof key !== "string") {
    return undefined;
  }
  return successMessages.get(key);
}
