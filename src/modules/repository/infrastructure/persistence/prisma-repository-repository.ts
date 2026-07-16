import {
  PrismaClient,
  RepositorySourceType,
  RepositoryStatus,
} from "@prisma/client";
import {
  Repository,
  RepositorySource,
  type RepositoryRepository,
} from "../../domain";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

const fromRecord = (record: {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  sourceType: RepositorySourceType;
  sourceUrl: string | null;
  storagePath: string | null;
  status: RepositoryStatus;
  createdAt: Date;
  updatedAt: Date;
}) =>
  new Repository(
    record.id,
    record.ownerId,
    record.name,
    new RepositorySource(
      record.sourceType === "GITHUB"
        ? "github"
        : record.sourceType === "ZIP_UPLOAD"
          ? "zip-upload"
          : "local-path",
      record.sourceUrl ?? "unavailable",
    ),
    record.createdAt,
    record.updatedAt,
    record.description ?? undefined,
    record.status === "PENDING_IMPORT"
      ? "pending-import"
      : record.status === "IMPORTING"
        ? "importing"
        : record.status === "READY"
          ? "ready"
          : "import-failed",
    record.storagePath ?? undefined,
  );
const sourceType = (
  type: Repository["source"]["type"],
): RepositorySourceType =>
  type === "github"
    ? "GITHUB"
    : type === "zip-upload"
      ? "ZIP_UPLOAD"
      : "LOCAL_PATH";

export class PrismaRepositoryRepository implements RepositoryRepository {
  public async create(repository: Repository): Promise<Repository> {
    return fromRecord(
      await prisma.managedRepository.create({
        data: {
          id: repository.id,
          ownerId: repository.ownerId,
          name: repository.name,
          description: repository.description,
          sourceType: sourceType(repository.source.type),
          sourceUrl: repository.source.location,
          storagePath: repository.storagePath,
          status:
            repository.status === "ready" || repository.status === "pending-import"
              ? "PENDING_IMPORT"
              : repository.status === "importing"
                ? "IMPORTING"
                : "IMPORT_FAILED",
        },
      }),
    );
  }
  public async findById(
    id: string,
    ownerId: string,
  ): Promise<Repository | undefined> {
    const record = await prisma.managedRepository.findFirst({
      where: { id, ownerId },
    });
    return record ? fromRecord(record) : undefined;
  }
  public async listByOwner(
    ownerId: string,
    limit = 30,
  ): Promise<readonly Repository[]> {
    return (
      await prisma.managedRepository.findMany({
        where: { ownerId },
        orderBy: { updatedAt: "desc" },
        take: limit,
      })
    ).map(fromRecord);
  }
  public async delete(id: string, ownerId: string): Promise<boolean> {
    const result = await prisma.managedRepository.deleteMany({
      where: { id, ownerId },
    });
    return result.count === 1;
  }
}
