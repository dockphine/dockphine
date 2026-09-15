import React from "react";
import { Box, Text, useApp } from "ink";
import { ConfirmInput } from "@inkjs/ui";
import { theme } from "./theme.js";
import { useCancelOnCtrlC } from "./useCancel.js";

interface OverwriteConfirmProps {
  files: string[];
}

export function OverwriteConfirm({ files }: OverwriteConfirmProps): React.JSX.Element {
  const { exit } = useApp();
  useCancelOnCtrlC();

  return (
    <Box flexDirection="column">
      <Text color={theme.warning} bold>
        These files already exist and will be overwritten:
      </Text>
      {files.map((f) => (
        <Text key={f} color={theme.warning}>
          {"  "}
          {f}
        </Text>
      ))}
      <Box marginTop={1}>
        <Text bold>{"Continue? "}</Text>
        <ConfirmInput
          defaultChoice="cancel"
          onConfirm={() => exit(true)}
          onCancel={() => exit(false)}
        />
      </Box>
    </Box>
  );
}
