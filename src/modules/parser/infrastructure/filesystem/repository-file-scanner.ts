import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import { SourceFile } from "../../domain/entities/source-file";
import { Language } from "../../domain/value-objects/language";

const ignoredDirectoryNames = new Set([
  "node_modules",
  "dist",
  "build",
  "coverage",
  ".next",
  ".git",
  ".cache",
  "bin",
  "obj",
  "out",
  "vendor",
  "target"
]);

export class RepositoryFileScanner {
  public async scan(repositoryRoot: string): Promise<readonly SourceFile[]> {
    const root = path.resolve(repositoryRoot);
    const files: SourceFile[] = [];
    const pendingDirectories = [root];

    while (pendingDirectories.length > 0) {
      const currentDirectory = pendingDirectories.pop();
      if (currentDirectory === undefined) continue;

      const entries = await readdir(currentDirectory, { withFileTypes: true });
      for (const entry of entries) {
        const absolutePath = path.join(currentDirectory, entry.name);
        if (entry.isDirectory()) {
          if (!ignoredDirectoryNames.has(entry.name)) pendingDirectories.push(absolutePath);
          continue;
        }

        if (!entry.isFile() || entry.name.endsWith(".min.js") || entry.name.endsWith(".map")) continue;
        const language = Language.fromExtension(path.extname(entry.name));
        if (language === undefined) continue;

        const statistics = await stat(absolutePath);
        files.push(
          new SourceFile({
            absolutePath,
            repositoryRelativePath: path.relative(root, absolutePath),
            language,
            sizeBytes: statistics.size
          })
        );
      }
    }

    return Object.freeze(files.sort((left, right) => left.repositoryRelativePath.localeCompare(right.repositoryRelativePath)));
  }
}
