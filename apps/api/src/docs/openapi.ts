import { z } from "zod";
import {
  createTaskSchema,
  problemSchema,
  taskSchema,
  updateTaskStatusSchema,
} from "../tasks/tasks.contract.ts";

const taskIdParameter = {
  name: "id",
  in: "path",
  required: true,
  description: "The task ID",
  schema: { type: "string", format: "uuid" },
};

export function createOpenApiDocument() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Tasks API",
      version: "1.0.0",
      description: "Create, view, update and delete caseworker tasks.",
    },
    servers: [{ url: "/api" }],
    paths: {
      "/tasks": {
        get: {
          summary: "List all tasks, soonest due first",
          responses: {
            200: jsonResponse("All tasks", { type: "array", items: schemaReference("Task") }),
          },
        },
        post: {
          summary: "Create a task",
          requestBody: jsonRequestBody("CreateTask"),
          responses: {
            201: jsonResponse("The created task", schemaReference("Task")),
            400: problemResponse("The body is not valid JSON"),
            422: problemResponse("The task is not valid, for example the due date is in the past"),
          },
        },
      },
      "/tasks/{id}": {
        parameters: [taskIdParameter],
        get: {
          summary: "Get a task",
          responses: {
            200: jsonResponse("The task", schemaReference("Task")),
            404: problemResponse("There is no task with this ID"),
          },
        },
        delete: {
          summary: "Delete a task",
          responses: {
            204: { description: "The task was deleted" },
            404: problemResponse("There is no task with this ID"),
          },
        },
      },
      "/tasks/{id}/status": {
        parameters: [taskIdParameter],
        patch: {
          summary: "Update the status of a task",
          requestBody: jsonRequestBody("UpdateTaskStatus"),
          responses: {
            200: jsonResponse("The updated task", schemaReference("Task")),
            404: problemResponse("There is no task with this ID"),
            422: problemResponse("The status is not valid"),
          },
        },
      },
      "/health": {
        get: {
          summary: "Check the API is running",
          responses: {
            200: jsonResponse("The API is running", {
              type: "object",
              properties: { status: { type: "string", const: "ok" } },
            }),
          },
        },
      },
    },
    components: {
      schemas: {
        Task: z.toJSONSchema(taskSchema),
        CreateTask: z.toJSONSchema(createTaskSchema, { io: "input" }),
        UpdateTaskStatus: z.toJSONSchema(updateTaskStatusSchema),
        Problem: z.toJSONSchema(problemSchema),
      },
    },
  };
}

function schemaReference(name: string) {
  return { $ref: `#/components/schemas/${name}` };
}

function jsonRequestBody(schemaName: string) {
  return {
    required: true,
    content: { "application/json": { schema: schemaReference(schemaName) } },
  };
}

function jsonResponse(description: string, schema: object) {
  return {
    description,
    content: { "application/json": { schema } },
  };
}

function problemResponse(description: string) {
  return {
    description,
    content: { "application/problem+json": { schema: schemaReference("Problem") } },
  };
}
