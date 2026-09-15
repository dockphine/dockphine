import React, { useState } from "react";
import { Box, Text } from "ink";
import { TextInput } from "@inkjs/ui";
import { theme } from "../theme.js";

interface TextQuestionProps {
  message: string;
  defaultValue?: string;
  placeholder?: string;
  validate?: (value: string) => string | undefined;
  onSubmit: (value: string) => void;
}

export function TextQuestion({
  message,
  defaultValue,
  placeholder,
  validate,
  onSubmit,
}: TextQuestionProps): React.JSX.Element {
  const [error, setError] = useState<string | undefined>();

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={theme.accent} bold>
          {"? "}
        </Text>
        <Text bold>{message}</Text>
      </Box>
      <Box borderStyle="round" borderColor={theme.muted} paddingX={1}>
        <Text color={theme.accent}>{"→ "}</Text>
        <TextInput
          defaultValue={defaultValue}
          placeholder={placeholder}
          onSubmit={(value) => {
            const finalValue = value.trim() || defaultValue || "";
            const err = validate?.(finalValue);
            if (err) {
              setError(err);
              return;
            }
            setError(undefined);
            onSubmit(finalValue);
          }}
        />
      </Box>
      {error ? <Text color={theme.danger}>{error}</Text> : null}
    </Box>
  );
}
