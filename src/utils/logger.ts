import chalk from "chalk";

export const logger = {
  title: (msg: string) => console.log(chalk.bold.cyanBright(`\n${msg}`)),
  info: (msg: string) => console.log(chalk.gray(msg)),
  success: (msg: string) => console.log(chalk.greenBright(`✔ ${msg}`)),
  warn: (msg: string) => console.log(chalk.yellowBright(`⚠ ${msg}`)),
  error: (msg: string) => console.error(chalk.redBright(`✖ ${msg}`)),
  step: (msg: string) => console.log(chalk.magentaBright(`→ ${msg}`)),
  command: (msg: string) => console.log(chalk.bgBlack.whiteBright(` ${msg} `)),
  divider: () => console.log(chalk.dim("─".repeat(48))),
};
