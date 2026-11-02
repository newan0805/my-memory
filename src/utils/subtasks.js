// Subtasks live in localStorage under "subtasks" as a flat list linked by scheduleId.

let lastId = 0;
// Date.now() alone collides when several subtasks are created in the same millisecond.
export const newId = () => {
  lastId = Math.max(Date.now(), lastId + 1);
  return lastId;
};

export const loadSubtasks = () => {
  try {
    return JSON.parse(localStorage.getItem('subtasks') || '[]');
  } catch {
    return [];
  }
};

export const saveSubtasks = (subtasks) => {
  localStorage.setItem('subtasks', JSON.stringify(subtasks));
  return subtasks;
};

export const makeSubtask = (scheduleId, title, description = '') => ({
  id: newId(),
  scheduleId,
  title: title.trim(),
  description,
  completed: false,
  createdAt: new Date().toISOString(),
});

// Appends draft subtasks (from the "Add schedule" form) to a newly created schedule.
export const addDraftSubtasks = (subtasks, scheduleId, drafts) => saveSubtasks([
  ...subtasks,
  ...drafts.filter((d) => d.title.trim()).map((d) => makeSubtask(scheduleId, d.title, d.description)),
]);

export const removeSubtasksForSchedule = (subtasks, scheduleId) => saveSubtasks(subtasks.filter((st) => st.scheduleId !== scheduleId));

// Ready-made handlers for <SubtaskChecklist> bound to one schedule; `setAll` receives the full updated list.
export const subtaskHandlers = (subtasks, scheduleId, setAll) => ({
  onAdd: (title) => setAll(saveSubtasks([...subtasks, makeSubtask(scheduleId, title)])),
  onToggle: (id) => setAll(saveSubtasks(subtasks.map((st) => (st.id === id ? { ...st, completed: !st.completed } : st)))),
  onRemove: (id) => setAll(saveSubtasks(subtasks.filter((st) => st.id !== id))),
  onRename: (id, title) => setAll(saveSubtasks(subtasks.map((st) => (st.id === id ? { ...st, title } : st)))),
});

// Same handlers for a local draft list (before the schedule exists).
export const draftHandlers = (drafts, setDrafts) => ({
  onAdd: (title) => setDrafts([...drafts, { id: newId(), title, completed: false }]),
  onToggle: (id) => setDrafts(drafts.map((d) => (d.id === id ? { ...d, completed: !d.completed } : d))),
  onRemove: (id) => setDrafts(drafts.filter((d) => d.id !== id)),
  onRename: (id, title) => setDrafts(drafts.map((d) => (d.id === id ? { ...d, title } : d))),
});
