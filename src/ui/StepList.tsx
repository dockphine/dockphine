import React from "react";
import { Box, Text } from "ink";
import { theme, icons } from "./theme.js";

export interface Step {
  id: string;
  label: string;
  /** The answer given, shown as an indented chip once the step is done. */
  detail?: string;
}

interface StepListProps {
  steps: Step[];
  currentIndex: number;
}

export function StepList({ steps, currentIndex }: StepListProps): React.JSX.Element {
  return (
    <Box flexDirection="column" marginBottom={1}>
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const icon = isDone ? icons.done : isCurrent ? icons.current : icons.pending;
        const iconColor = isDone ? theme.success : isCurrent ? theme.accent : theme.muted;

        return (
          <Box key={step.id} flexDirection="column">
            <Box>
              <Text color={iconColor} bold={isDone || isCurrent}>
                {icon}{" "}
              </Text>
              <Text
                color={isDone || isCurrent ? theme.text : theme.muted}
                bold={isCurrent}
                dimColor={!isDone && !isCurrent}
              >
                {step.label}
              </Text>
            </Box>
            {isDone && step.detail ? (
              <Box marginLeft={2}>
                <Text color={theme.muted}>{"— "}</Text>
                <Text backgroundColor={theme.chipBg} color={theme.text}>
                  {" "}
                  {step.detail}{" "}
                </Text>
              </Box>
            ) : null}
          </Box>
        );
      })}
    </Box>
  );
}
