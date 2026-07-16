export class GraphVersion {
  public constructor(
    public readonly schemaVersion: string,
    public readonly constructionVersion: string,
    public readonly parserVersion: string
  ) {
    if (!schemaVersion || !constructionVersion || !parserVersion) throw new Error("Graph version fields are required.");
    Object.freeze(this);
  }
}
