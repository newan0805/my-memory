import React, { useState } from 'react';
import { Stack, Group, Text, TextInput, Checkbox, ActionIcon, Progress, Tooltip } from '@mantine/core';
import { IconPlus, IconTrash, IconPencil, IconCheck, IconX, IconSubtask } from '@tabler/icons-react';

function SubtaskRow({ item, draft, onToggle, onRemove, onRename }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);

  const save = () => {
    if (title.trim()) onRename(item.id, title.trim());
    else setTitle(item.title);
    setEditing(false);
  };

  return (
    <Group gap="xs" wrap="nowrap" align="center" style={{ minHeight: 34 }}>
      {!draft && (
        <Checkbox checked={!!item.completed} onChange={() => onToggle(item.id)} aria-label={`Mark "${item.title}" ${item.completed ? 'not done' : 'done'}`} />
      )}
      {draft && <IconSubtask size={16} color="var(--mantine-color-dimmed)" />}

      {editing ? (
        <>
          <TextInput
            size="xs"
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); save(); }
              if (e.key === 'Escape') { setTitle(item.title); setEditing(false); }
            }}
            style={{ flex: 1 }}
          />
          <ActionIcon size="sm" variant="subtle" color="green" onClick={save} aria-label="Save"><IconCheck size={14} /></ActionIcon>
          <ActionIcon size="sm" variant="subtle" onClick={() => { setTitle(item.title); setEditing(false); }} aria-label="Cancel"><IconX size={14} /></ActionIcon>
        </>
      ) : (
        <>
          <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
            <Text
              size="sm"
              td={item.completed ? 'line-through' : undefined}
              c={item.completed ? 'dimmed' : undefined}
              onDoubleClick={() => setEditing(true)}
            >
              {item.title}
            </Text>
            {item.description && <Text size="xs" c="dimmed">{item.description}</Text>}
          </Stack>
          <Tooltip label="Rename"><ActionIcon size="sm" variant="subtle" onClick={() => setEditing(true)} aria-label="Rename subtask"><IconPencil size={14} /></ActionIcon></Tooltip>
          <Tooltip label="Delete"><ActionIcon size="sm" variant="subtle" color="red" onClick={() => onRemove(item.id)} aria-label="Delete subtask"><IconTrash size={14} /></ActionIcon></Tooltip>
        </>
      )}
    </Group>
  );
}

// A checklist of subtasks with a quick-add field (type + Enter).
// draft: used in "Add schedule" forms — no checkboxes or progress, just the list being built.
function SubtaskChecklist({ items, onAdd, onToggle, onRemove, onRename, draft = false, label = 'Subtasks' }) {
  const [title, setTitle] = useState('');
  const done = items.filter((st) => st.completed).length;
  const progress = items.length ? Math.round((done / items.length) * 100) : 0;

  const add = () => {
    if (!title.trim()) return;
    onAdd(title.trim());
    setTitle('');
  };

  return (
    // Clicks inside shouldn't trigger the parent card's onClick (e.g. opening a detail view).
    <Stack gap="xs" onClick={(e) => e.stopPropagation()}>
      <Group justify="space-between" gap="xs">
        <Text size="sm" fw={600}>{label}{items.length > 0 && !draft ? ` (${done}/${items.length})` : draft && items.length ? ` (${items.length})` : ''}</Text>
        {!draft && items.length > 0 && <Text size="xs" c={progress === 100 ? 'green' : 'dimmed'}>{progress}%</Text>}
      </Group>
      {!draft && items.length > 0 && <Progress value={progress} size="xs" color={progress === 100 ? 'green' : 'blue'} />}

      {items.length > 0 && (
        <Stack gap={2}>
          {items.map((item) => (
            <SubtaskRow key={item.id} item={item} draft={draft} onToggle={onToggle} onRemove={onRemove} onRename={onRename} />
          ))}
        </Stack>
      )}

      <Group gap="xs" wrap="nowrap">
        <TextInput
          size="sm"
          placeholder={items.length ? 'Add another subtask…' : 'Add a subtask and press Enter'}
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          onKeyDown={(e) => {
            // Enter adds the subtask instead of submitting the surrounding form.
            if (e.key === 'Enter') { e.preventDefault(); add(); }
          }}
          style={{ flex: 1 }}
          aria-label="New subtask"
        />
        <ActionIcon size="lg" variant="light" onClick={add} disabled={!title.trim()} aria-label="Add subtask">
          <IconPlus size={18} />
        </ActionIcon>
      </Group>
    </Stack>
  );
}

export default SubtaskChecklist;
