import React from "react";
import { Box, Text } from "ink";
import cfonts from "cfonts";
import { theme } from "./theme.js";

// Computed once at module load — this is genuinely large block-letter ASCII art, the terminal
// equivalent of a big "text-4xl" title (terminals can't scale font-size, only draw bigger glyphs).
const rendered = cfonts.render("DOCKPHINE", {
  font: "block",
  gradient: [theme.accentDim, theme.accent],
  independentGradient: false,
  transitionGradient: true,
});

const bannerLines: string[] =
  rendered && "array" in rendered
    ? rendered.array.filter((line: string) => line.replace(/\x1b\[[0-9;]*m/g, "").trim().length > 0)
    : ["DOCKPHINE"];

export function WelcomeBanner(): React.JSX.Element {
  return (
    <Box flexDirection="column" alignItems="center" marginBottom={1} width="100%">
      <Box flexDirection="column">
        {bannerLines.map((line, i) => (
          <Text key={i}>{line}</Text>
        ))}
      </Box>
      <Text color={theme.muted}>Dockerize Strapi in under 2 minutes.</Text>
    </Box>
  );
}
