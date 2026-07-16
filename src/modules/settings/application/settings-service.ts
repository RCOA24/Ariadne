import { Prisma, PrismaClient } from "@prisma/client";
import {
  decryptSecret,
  encryptSecret,
} from "../../shared/security/secret-encryption";
export interface Settings {
  readonly ownerId: string;
  readonly preferences: {
    readonly theme: "dark" | "system";
    readonly locale: string;
  };
  readonly ai: {
    readonly provider?: "openai" | "anthropic" | "gemini" | "ollama";
    readonly model?: string;
    readonly temperature: number;
    readonly maxTokens: number;
    readonly configured: boolean;
  };
  readonly repositoryDefaults: { readonly defaultBranch?: string };
  readonly analysisConfiguration: {
    readonly ignoredFolders: readonly string[];
    readonly supportedLanguages: readonly string[];
  };
  readonly storageConfiguration: { readonly workspaceRetentionDays: number };
}
export interface SettingsUpdate extends Omit<Settings, "ownerId" | "ai"> {
  readonly ai: Omit<Settings["ai"], "configured"> & {
    readonly apiKey?: string;
  };
}
const globalForPrisma = globalThis as unknown as {
  settingsPrisma?: PrismaClient;
};
const prisma = globalForPrisma.settingsPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production")
  globalForPrisma.settingsPrisma = prisma;
const defaults = (ownerId: string): Settings => ({
  ownerId,
  preferences: { theme: "dark", locale: "en" },
  ai: { temperature: 0.2, maxTokens: 1500, configured: false },
  repositoryDefaults: {},
  analysisConfiguration: {
    ignoredFolders: ["node_modules", "bin", "obj", ".git", "dist", "build"],
    supportedLanguages: [
      "TypeScript",
      "JavaScript",
      "C#",
      "Java",
      "Python",
      "SQL",
    ],
  },
  storageConfiguration: { workspaceRetentionDays: 30 },
});
export class SettingsService {
  public async get(ownerId: string): Promise<Settings> {
    const record = await prisma.settingsRecord.findUnique({
      where: { ownerId },
    });
    if (!record) return defaults(ownerId);
    const ai = record.encryptedAiConfig
      ? (JSON.parse(decryptSecret(record.encryptedAiConfig)) as Omit<
          Settings["ai"],
          "configured"
        >)
      : { temperature: 0.2, maxTokens: 1500 };
    return {
      ownerId,
      preferences: record.preferences as Settings["preferences"],
      ai: { ...ai, configured: Boolean(record.encryptedAiConfig) },
      repositoryDefaults:
        record.repositoryDefaults as Settings["repositoryDefaults"],
      analysisConfiguration:
        record.analysisConfiguration as unknown as Settings["analysisConfiguration"],
      storageConfiguration:
        record.storageConfiguration as Settings["storageConfiguration"],
    };
  }
  public async save(
    ownerId: string,
    update: SettingsUpdate,
  ): Promise<Settings> {
    if (
      update.ai.temperature < 0 ||
      update.ai.temperature > 2 ||
      update.ai.maxTokens < 1 ||
      update.ai.maxTokens > 100000
    )
      throw new Error("AI temperature or token limit is invalid.");
    const prior = await prisma.settingsRecord.findUnique({
      where: { ownerId },
    });
    const secret = update.ai.apiKey
      ? encryptSecret(
          JSON.stringify({
            provider: update.ai.provider,
            model: update.ai.model,
            temperature: update.ai.temperature,
            maxTokens: update.ai.maxTokens,
            apiKey: update.ai.apiKey,
          }),
        )
      : prior?.encryptedAiConfig;
    const publicAi = {
      provider: update.ai.provider,
      model: update.ai.model,
      temperature: update.ai.temperature,
      maxTokens: update.ai.maxTokens,
    };
    await prisma.settingsRecord.upsert({
      where: { ownerId },
      create: {
        ownerId,
        preferences: update.preferences as Prisma.InputJsonValue,
        repositoryDefaults: update.repositoryDefaults as Prisma.InputJsonValue,
        analysisConfiguration:
          update.analysisConfiguration as Prisma.InputJsonValue,
        storageConfiguration:
          update.storageConfiguration as Prisma.InputJsonValue,
        encryptedAiConfig: secret,
      },
      update: {
        preferences: update.preferences as Prisma.InputJsonValue,
        repositoryDefaults: update.repositoryDefaults as Prisma.InputJsonValue,
        analysisConfiguration:
          update.analysisConfiguration as Prisma.InputJsonValue,
        storageConfiguration:
          update.storageConfiguration as Prisma.InputJsonValue,
        encryptedAiConfig: secret,
      },
    });
    return {
      ownerId,
      preferences: update.preferences,
      ai: { ...publicAi, configured: Boolean(secret) },
      repositoryDefaults: update.repositoryDefaults,
      analysisConfiguration: update.analysisConfiguration,
      storageConfiguration: update.storageConfiguration,
    };
  }
}
