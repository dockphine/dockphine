import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";

interface MultiSelectOption<T extends string> {
  label: string;
  value: T;
}

interface MultiSelectQuestionProps<T extends string> {
  message: string;
  options: MultiSelectOption<T>[];
  onSubmit: (values: T[]) => void;
}

export function MultiSelectQuestion<T extends string>({
  message,
  options,
  onSubmit,
}: MultiSelectQuestionProps<T>): React.JSX.Element {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [selected, setSelected] = useState<Set<T>>(new Set());
  const [error, setError] = useState<string | undefined>();

  useInput((input, key) => {
    if (key.downArrow) {
      setFocusedIndex((i) => (i + 1) % options.length);
    } else if (key.upArrow) {
      setFocusedIndex((i) => (i - 1 + options.length) % options.length);
    } else if (input === " ") {
      const value = options[focusedIndex]!.value;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(value)) {
          next.delete(value);
        } else {
          next.add(value);
        }
        return next;
      });
    } else if (key.return) {
      if (selected.size === 0) {
        setError("Select at least one, or go back and choose No.");
        return;
      }
      setError(undefined);
      onSubmit(options.filter((o) => selected.has(o.value)).map((o) => o.value));
    }
  });

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={theme.accent} bold>
          {"? "}
        </Text>
        <Text bold>{message}</Text>
        <Text color={theme.text}> (space to select, enter to confirm)</Text>
      </Box>
      {options.map((option, i) => {
        const isFocused = i === focusedIndex;
        const isSelected = selected.has(option.value);
        const iconColor = isSelected ? theme.success : isFocused ? theme.accent : theme.text;
        return (
          <Box key={option.value}>
            <Text color={iconColor}>{isSelected ? "☑" : "☐"}</Text>
            <Text> </Text>
            <Text bold={isFocused} color={isSelected ? theme.success : theme.text}>
              {option.label}
            </Text>
          </Box>
        );
      })}
      {error ? <Text color={theme.danger}>{error}</Text> : null}
    </Box>
  );
}
