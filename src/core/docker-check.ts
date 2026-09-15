import { execa } from "execa";

export type DockerStatus =
  | { available: true }
  | { available: false; reason: "not-installed" | "not-running"; message: string };

const NOT_INSTALLED_MESSAGE =
  "Docker isn't installed (or isn't on your PATH). Install Docker Desktop for macOS/Windows " +
  "(https://www.docker.com/products/docker-desktop/) or Docker Engine for Linux " +
  "(https://docs.docker.com/engine/install/), then try again.";

const NOT_RUNNING_MESSAGE =
  "Docker is installed but doesn't seem to be running. On macOS or Windows, open Docker " +
  "Desktop and wait for it to finish starting. On Linux, start the docker service " +
  "(e.g. `sudo systemctl start docker`), then try again.";

export async function checkDocker(): Promise<DockerStatus> {
  try {
    await execa("docker", ["info"]);
    return { available: true };
  } catch (err) {
    const code = (err as { code?: string } | undefined)?.code;
    if (code === "ENOENT") {
      return { available: false, reason: "not-installed", message: NOT_INSTALLED_MESSAGE };
    }
    return { available: false, reason: "not-running", message: NOT_RUNNING_MESSAGE };
  }
}
