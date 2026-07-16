import type { SourceFile } from "../entities/source-file";

export class SupportedSourceFileSpecification {
  public isSatisfiedBy(file: SourceFile): boolean {
    return file.sizeBytes > 0;
  }
}
