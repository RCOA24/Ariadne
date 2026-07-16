export type RepositorySourceType = "github" | "zip-upload" | "local-path";

export class RepositorySource {
  public readonly type: RepositorySourceType;
  public readonly location: string;

  public constructor(type: RepositorySourceType, location: string) {
    if (!location.trim())
      throw new Error("Repository source location is required.");
    if (type === "github") {
      const url = new URL(location);
      if (
        url.protocol !== "https:" ||
        url.hostname.toLowerCase() !== "github.com" ||
        url.pathname.split("/").filter(Boolean).length < 2
      )
        throw new Error(
          "Only public HTTPS GitHub repository URLs are supported.",
        );
    }
    if (type === "local-path")
      throw new Error(
        "Local-path repositories are reserved for a future desktop or CLI host.",
      );
    this.type = type;
    this.location = location.trim();
    Object.freeze(this);
  }
}
