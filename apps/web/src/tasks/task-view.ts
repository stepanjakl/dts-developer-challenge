import { isOverdue, type Task, type TaskStatus, taskStatusLabels } from "@tasks/contract";
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

const statusTagClasses: Record<TaskStatus, string> = {
  todo: "govuk-tag--grey",
  in_progress: "",
  done: "govuk-tag--green",
};

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
