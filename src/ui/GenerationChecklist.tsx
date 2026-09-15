import React, { useEffect, useState } from "react";
import { Box, Text, useApp } from "ink";
import { Spinner } from "@inkjs/ui";
import { theme, icons } from "./theme.js";
import { useCancelOnCtrlC } from "./useCancel.js";
import { friendlyErrorMessage } from "../utils/error-message.js";

export interface ChecklistTask {
  id: string;
  label: string;
  run: () => Promise<void>;
}

type TaskStatus = "pending" | "active" | "done" | "error";

interface GenerationChecklistProps {
  tasks: ChecklistTask[];
}

export function GenerationChecklist({ tasks }: GenerationChecklistProps): React.JSX.Element {
  const { exit } = useApp();
  useCancelOnCtrlC();

  const [statuses, setStatuses] = useState<Record<string, TaskStatus>>(() =>
    Object.fromEntries(tasks.map((t) => [t.id, "pending" as TaskStatus]))
  );
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const task of tasks) {
        if (cancelled) return;
        setStatuses((s) => ({ ...s, [task.id]: "active" }));
        try {
          await task.run();
          if (cancelled) return;
          setStatuses((s) => ({ ...s, [task.id]: "done" }));
        } catch (err) {
          if (cancelled) return;
          setStatuses((s) => ({ ...s, [task.id]: "error" }));
          setErrorMessage(friendlyErrorMessage(err));
          await new Promise((r) => setTimeout(r, 400));
          exit(err instanceof Error ? err : new Error(String(err)));
          return;
        }
      }
      if (!cancelled) exit();
    })();
    return () => {
      cancelled = true;
    };
    // Tasks are only ever provided once per mount — this effect is meant to run exactly once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box flexDirection="column">
      {tasks.map((task) => {
        const status = statuses[task.id];
        if (status === "active") {
          return <Spinner key={task.id} label={task.label} />;
        }
        const icon = status === "done" ? icons.done : status === "error" ? icons.error : icons.pending;
        const color = status === "done" ? theme.accent : status === "error" ? theme.danger : theme.muted;
        return (
          <Box key={task.id}>
            <Text color={color}>{icon} </Text>
            <Text color={status === "pending" ? theme.muted : undefined} dimColor={status === "pending"}>
              {task.label}
            </Text>
          </Box>
        );
      })}
      {errorMessage ? (
        <Box marginTop={1}>
          <Text color={theme.danger}>{errorMessage}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
