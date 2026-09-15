import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { theme } from "../theme.js";

interface SelectOption<T extends string> {
  label: string;
  value: T;
}

interface SelectQuestionProps<T extends string> {
  message: string;
  options: SelectOption<T>[];
  onSubmit: (value: T) => void;
}

export function SelectQuestion<T extends string>({
  message,
  options,
  onSubmit,
}: SelectQuestionProps<T>): React.JSX.Element {
  const [focusedIndex, setFocusedIndex] = useState(0);

  useInput((_input, key) => {
    if (key.downArrow) {
      setFocusedIndex((i) => (i + 1) % options.length);
    } else if (key.upArrow) {
      setFocusedIndex((i) => (i - 1 + options.length) % options.length);
    } else if (key.return) {
      onSubmit(options[focusedIndex]!.value);
    }
  });

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={theme.accent} bold>
          {"? "}
        </Text>
        <Text bold>{message}</Text>
      </Box>
      {options.map((option, i) => {
        const isFocused = i === focusedIndex;
        return (
          <Box key={option.value}>
            <Text color={isFocused ? theme.success : theme.text}>{isFocused ? "▣" : "☐"}</Text>
            <Text> </Text>
            <Text bold={isFocused} color={isFocused ? theme.success : theme.text}>
              {option.label}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
