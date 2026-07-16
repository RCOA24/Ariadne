import { z } from "zod";
import { RepositoryManagementService } from "../application";
import { LocalGitHubAcquirer, LocalZipAcquirer, PrismaRepositoryRepository } from "../infrastructure";

export const ownerIdFrom = (request: Request) => request.headers.get("x-ariadne-owner-id")?.trim() || "local-development";
export const managementService = () => new RepositoryManagementService(new PrismaRepositoryRepository(), new LocalGitHubAcquirer(), new LocalZipAcquirer());
export const githubInput = z.object({ githubUrl: z.string().url(), name: z.string().trim().min(1).max(120).optional(), description: z.string().trim().max(500).optional() });
