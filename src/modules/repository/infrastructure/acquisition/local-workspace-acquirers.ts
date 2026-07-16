import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { GitHubAcquirer, ZipAcquirer } from "../../application";

const workspaceRoot = resolve(
  process.env.REPOSITORY_WORKSPACE_ROOT ??
    join(process.cwd(), ".data", "repositories"),
);
const locationFor = (repositoryId: string) => {
  const location = resolve(workspaceRoot, repositoryId);
  if (!location.startsWith(`${workspaceRoot}\\`) && location !== workspaceRoot)
    throw new Error("Invalid repository workspace path.");
  return location;
};

export class LocalZipAcquirer implements ZipAcquirer {
  public async store(input: {
    readonly repositoryId: string;
    readonly fileName: string;
    readonly contents: Uint8Array;
  }): Promise<string> {
    const directory = locationFor(input.repositoryId);
    await mkdir(directory, { recursive: true });
    const archive = join(directory, "source.zip");
    await writeFile(archive, input.contents);
    return archive;
  }
  public async remove(storagePath: string): Promise<void> {
    await rm(resolve(storagePath, ".."), { recursive: true, force: true });
  }
}
export class LocalGitHubAcquirer implements GitHubAcquirer {
  public async clone(input: {
    readonly repositoryId: string;
    readonly githubUrl: string;
  }): Promise<string> {
    const directory = locationFor(input.repositoryId);
    await mkdir(workspaceRoot, { recursive: true });
    await new Promise<void>((resolveClone, rejectClone) => {
      const child = spawn(
        "git",
        ["clone", "--depth", "1", "--", input.githubUrl, directory],
        { stdio: "ignore" },
      );
      child.once("error", rejectClone);
      child.once("exit", (code) =>
        code === 0
          ? resolveClone()
          : rejectClone(new Error("GitHub repository clone failed.")),
      );
    });
    return directory;
  }
  public async remove(storagePath: string): Promise<void> {
    await rm(storagePath, { recursive: true, force: true });
  }
}
