import React, { useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { theme, icons } from "./theme.js";

interface SummaryProps {
  writtenFiles: string[];
  projectDir: string;
  relDir: string;
  port: number;
  buildAttempted: boolean;
  buildSucceeded: boolean;
  buildErrorMessage?: string;
  dockerWarning?: string;
  deployLabel: string;
  deploySteps: string[];
}

export function Summary({
  writtenFiles,
  relDir,
  port,
  buildAttempted,
  buildSucceeded,
  buildErrorMessage,
  dockerWarning,
  deployLabel,
  deploySteps,
}: SummaryProps): React.JSX.Element {
  const { exit } = useApp();

  useEffect(() => {
    exit();
  }, [exit]);

  return (
    <Box flexDirection="column">
      {dockerWarning ? (
        <Box marginBottom={1}>
          <Text color={theme.warning}>⚠ {dockerWarning}</Text>
        </Box>
      ) : null}

      <Text color={theme.accent} bold>
        {icons.done} Generated {writtenFiles.length} files
      </Text>
      {writtenFiles
        .slice()
        .sort()
        .map((f) => (
          <Text key={f} color={theme.muted}>
            {"  "}
            {f}
          </Text>
        ))}

      <Box marginTop={1} flexDirection="column">
        {buildAttempted && buildSucceeded ? (
          <>
            <Text color={theme.accent} bold>
              {icons.done} Containers built and started
            </Text>
            <Text>Strapi admin: http://localhost:{port}/admin</Text>
            <Text color={theme.muted}>
              Follow logs with: cd {relDir} && docker compose logs -f
            </Text>
          </>
        ) : buildAttempted && !buildSucceeded ? (
          <>
            <Text color={theme.danger} bold>
              {icons.error} docker compose up --build failed
            </Text>
            {buildErrorMessage ? <Text color={theme.danger}>{buildErrorMessage}</Text> : null}
            <Text color={theme.muted}>
              You can retry manually: cd {relDir} && docker compose up --build
            </Text>
          </>
        ) : (
          <>
            <Text bold>Next steps:</Text>
            <Text color={theme.accent}> cd {relDir}</Text>
            <Text color={theme.accent}> docker compose up --build</Text>
          </>
        )}
      </Box>

      {deploySteps.length > 0 ? (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Deploying to {deployLabel}:</Text>
          {deploySteps.map((step) => (
            <Text key={step} color={theme.accent}>
              {" "}
              {step}
            </Text>
          ))}
        </Box>
      ) : null}

      <Box marginTop={1}>
        <Text color={theme.accent} bold>
          {icons.done} Done.
        </Text>
      </Box>
    </Box>
  );
}
