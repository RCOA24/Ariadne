import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import yauzl from "yauzl";
import type { RepositoryWorkspaceAcquirer } from "../../application/services/repository-import-service";

function openZip(path: string): Promise<yauzl.ZipFile> {
  return new Promise((resolveZip, rejectZip) =>
    yauzl.open(
      path,
      { lazyEntries: true, validateEntrySizes: true },
      (error, zip) =>
        error || !zip
          ? rejectZip(error ?? new Error("Unable to read ZIP archive."))
          : resolveZip(zip),
    ),
  );
}
function streamEntry(
  zip: yauzl.ZipFile,
  entry: yauzl.Entry,
): Promise<NodeJS.ReadableStream> {
  return new Promise((resolveStream, rejectStream) =>
    zip.openReadStream(entry, (error, stream) =>
      error || !stream
        ? rejectStream(error ?? new Error("Unable to read ZIP entry."))
        : resolveStream(stream),
    ),
  );
}
export class ImportedRepositoryWorkspaceAcquirer implements RepositoryWorkspaceAcquirer {
  public async acquire(repository: {
    readonly sourceType: string;
    readonly storagePath?: string;
  }): Promise<string> {
    if (!repository.storagePath)
      throw new Error("Repository source workspace is unavailable.");
    if (repository.sourceType === "github") return repository.storagePath;
    if (repository.sourceType !== "zip-upload")
      throw new Error(
        "This source type cannot be imported in the web application.",
      );
    const root = resolve(dirname(repository.storagePath), "workspace");
    await mkdir(root, { recursive: true });
    const zip = await openZip(repository.storagePath);
    await new Promise<void>((resolveExtraction, rejectExtraction) => {
      zip.readEntry();
      zip.on("entry", async (entry: yauzl.Entry) => {
        try {
          const destination = resolve(root, entry.fileName);
          if (
            !destination.startsWith(`${root}\\`) &&
            !destination.startsWith(`${root}/`)
          )
            throw new Error("ZIP archive contains an unsafe path.");
          if (/\/$/.test(entry.fileName)) {
            await mkdir(destination, { recursive: true });
            zip.readEntry();
            return;
          }
          await mkdir(dirname(destination), { recursive: true });
          await pipeline(
            await streamEntry(zip, entry),
            createWriteStream(destination, { flags: "w" }),
          );
          zip.readEntry();
        } catch (error) {
          zip.close();
          rejectExtraction(error);
        }
      });
      zip.once("end", resolveExtraction);
      zip.once("error", rejectExtraction);
    });
    return root;
  }
}
