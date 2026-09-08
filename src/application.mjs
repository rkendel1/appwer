import { defineApplication, defineCapability, implementation, s } from "@appport/sdk";

const task = s.object({
  id: s.string(),
  title: s.string(),
  description: s.string(),
  status: s.string(),
  createdAt: s.string(),
  updatedAt: s.string()
});

export const listTasks = defineCapability({
  name: "tasks.list",
  version: 1,
  input: s.object({}),
  output: s.object({ tasks: s.array(task) }),
  handler: async (_input, context) => context.services.taskStore.list()
});

export const createTask = defineCapability({
  name: "tasks.create",
  version: 1,
  input: s.object({ title: s.string(), description: s.string() }),
  output: task,
  handler: async (input, context) => context.services.taskStore.create(input)
});

export const updateTask = defineCapability({
  name: "tasks.update",
  version: 1,
  input: s.object({ id: s.string(), title: s.string(), description: s.string(), status: s.string() }),
  output: task,
  handler: async (input, context) => context.services.taskStore.update(input)
});

export const deleteTask = defineCapability({
  name: "tasks.delete",
  version: 1,
  input: s.object({ id: s.string() }),
  output: s.object({ deleted: s.boolean() }),
  handler: async (input, context) => context.services.taskStore.delete(input.id)
});

export const application = defineApplication({
  id: "com.rkendel1.taskboard",
  name: "Task Board",
  version: "1.0.0",
  provides: [listTasks, createTask, updateTask, deleteTask],
  implementations: {
    "tasks.list@1": implementation(listTasks.handler),
    "tasks.create@1": implementation(createTask.handler),
    "tasks.update@1": implementation(updateTask.handler),
    "tasks.delete@1": implementation(deleteTask.handler)
  }
});

export default application;
