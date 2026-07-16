import type { Language } from "../value-objects/language";

export interface SourceFileProperties {
  readonly absolutePath: string;
  readonly repositoryRelativePath: string;
  readonly language: Language;
  readonly sizeBytes: number;
}

export class SourceFile {
  public readonly absolutePath: string;
  public readonly repositoryRelativePath: string;
  public readonly language: Language;
  public readonly sizeBytes: number;

  public constructor(properties: SourceFileProperties) {
    if (!properties.repositoryRelativePath || properties.repositoryRelativePath.startsWith("..")) {
      throw new Error("Source file paths must be non-empty and repository-relative.");
    }

    if (properties.sizeBytes < 0) {
      throw new Error("Source file size cannot be negative.");
    }

    this.absolutePath = properties.absolutePath;
    this.repositoryRelativePath = properties.repositoryRelativePath.replaceAll("\\", "/");
    this.language = properties.language;
    this.sizeBytes = properties.sizeBytes;
    Object.freeze(this);
  }
}
