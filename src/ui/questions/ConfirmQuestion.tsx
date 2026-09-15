import React from "react";
import { Box, Text } from "ink";
import { ConfirmInput } from "@inkjs/ui";
import { theme } from "../theme.js";

interface ConfirmQuestionProps {
  message: string;
  defaultValue?: boolean;
  onSubmit: (value: boolean) => void;
}

export function ConfirmQuestion({
  message,
  defaultValue = true,
  onSubmit,
}: ConfirmQuestionProps): React.JSX.Element {
  return (
    <Box>
      <Text color={theme.accent} bold>
        {"? "}
      </Text>
      <Text bold>{message}</Text>
      <Text> </Text>
      <ConfirmInput
        defaultChoice={defaultValue ? "confirm" : "cancel"}
        onConfirm={() => onSubmit(true)}
        onCancel={() => onSubmit(false)}
      />
    </Box>
  );
}
