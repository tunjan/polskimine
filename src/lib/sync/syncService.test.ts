import { describe, it, expect, beforeEach, vi } from "vitest";
import { exportSyncData, importSyncData, SyncData } from "./syncService";
import { Card, LanguageId, UserSettings } from "@/types";
import { State as FSRSState } from "ts-fsrs";


vi.mock("@/db/dexie", () => ({
  db: {
    revlog: {
      toArray: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue(undefined),
      bulkPut: vi.fn().mockResolvedValue(undefined),
    },
    aggregated_stats: {
      toArray: vi.fn().mockResolvedValue([]),
      clear: vi.fn().mockResolvedValue(undefined),
      bulkPut: vi.fn().mockResolvedValue(undefined),
    },
    profile: {
      get: vi.fn().mockResolvedValue(null),
      toArray: vi.fn().mockResolvedValue([]),
      put: vi.fn().mockResolvedValue(undefined),
    },
  },
}));


vi.mock("@/db/repositories/historyRepository", () => ({
  getHistory: vi.fn().mockResolvedValue({}),
  saveFullHistory: vi.fn().mockResolvedValue(undefined),
  clearHistory: vi.fn().mockResolvedValue(undefined),
}));


vi.mock("@/db/repositories/settingsRepository", () => ({
  getFullSettings: vi.fn().mockResolvedValue(null),
  getSystemSetting: vi.fn().mockResolvedValue("test-device-id"),
  setSystemSetting: vi.fn().mockResolvedValue(undefined),
}));


const mockCards: Card[] = [];
vi.mock("@/db/repositories/cardRepository", () => ({
  getCards: vi.fn(() => Promise.resolve([...mockCards])),
  saveAllCards: vi.fn((cards: Card[]) => {
    mockCards.push(...cards);
    return Promise.resolve();
  }),
  clearAllCards: vi.fn(() => {
    mockCards.length = 0;
    return Promise.resolve();
  }),
  getCurrentUserId: vi.fn(() => "test-user"),
}));

/**
 * Create a test card
 */
const createTestCard = (overrides: Partial<Card> = {}): Card => ({
  id: Date.now().toString(),
  targetSentence: "Test sentence",
  targetWord: "test",
  targetWordTranslation: "prueba",
  nativeTranslation: "Testing translation",
  notes: "Test notes",
  language: LanguageId.Polish,
  type: 0,
  queue: 0,
  due: 0,
  last_modified: Math.floor(Date.now() / 1000),
  left: 0,
  interval: 0,
  easeFactor: 2500,
  state: FSRSState.New,
  reps: 0,
  lapses: 0,
  ...overrides,
});

/**
 * Create test settings
 */
const createTestSettings = (): Partial<UserSettings> => ({
  language: LanguageId.Polish,
  autoPlayAudio: true,
  geminiApiKey: "secret-api-key",
  tts: {
    provider: "browser",
    voiceURI: null,
    volume: 1,
    rate: 1,
    pitch: 1,
    googleApiKey: "google-secret",
    azureApiKey: "azure-secret",
  },
  fsrs: {
    request_retention: 0.9,
    maximum_interval: 365,
  },
});

describe("syncService Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCards.length = 0;
  });

  describe("exportSyncData", () => {
    it("should export with version 3 and device ID", async () => {
      const settings = createTestSettings();

      const exportedData = await exportSyncData(settings);

      expect(exportedData).toBeDefined();
      expect(exportedData.version).toBe(3);
      expect(exportedData.deviceId).toBe("test-device-id");
      expect(exportedData.lastSynced).toBeDefined();
    });

    it("should export cards from the database", async () => {
      
      mockCards.push(
        createTestCard({
          targetSentence: "Cześć, jak się masz?",
          targetWord: "Cześć",
          nativeTranslation: "Hello, how are you?",
        }),
        createTestCard({
          id: (Date.now() + 1).toString(),
          targetSentence: "Dziękuję",
          targetWord: "Dziękuję",
        })
      );

      const settings = createTestSettings();

      const exportedData = await exportSyncData(settings);

      expect(exportedData.cards).toHaveLength(2);
      expect(exportedData.cards.some((c) => c.targetSentence === "Cześć, jak się masz?")).toBe(true);
      expect(exportedData.cards.some((c) => c.targetSentence === "Dziękuję")).toBe(true);
    });

    it("should strip API keys when includeApiKeys is false", async () => {
      const settings = createTestSettings();

      const exportedData = await exportSyncData(settings, { includeApiKeys: false });

      expect(exportedData.settings.geminiApiKey).toBe("");
      expect(exportedData.settings.tts?.googleApiKey).toBe("");
      expect(exportedData.settings.tts?.azureApiKey).toBe("");
    });

    it("should include API keys when includeApiKeys is true", async () => {
      const settings = createTestSettings();

      const exportedData = await exportSyncData(settings, { includeApiKeys: true });

      expect(exportedData.settings.geminiApiKey).toBe("secret-api-key");
      expect(exportedData.settings.tts?.googleApiKey).toBe("google-secret");
      expect(exportedData.settings.tts?.azureApiKey).toBe("azure-secret");
    });

    it("should export FSRS scheduling data", async () => {
      mockCards.push(
        createTestCard({
          targetSentence: "Reviewed card",
          type: 2,
          queue: 2,
          state: FSRSState.Review,
          stability: 10.5,
          difficulty: 5.2,
          interval: 7,
          reps: 5,
          lapses: 1,
        })
      );

      const settings = createTestSettings();

      const exportedData = await exportSyncData(settings);

      const exportedCard = exportedData.cards[0];
      expect(exportedCard.stability).toBe(10.5);
      expect(exportedCard.difficulty).toBe(5.2);
      expect(exportedCard.interval).toBe(7);
      expect(exportedCard.reps).toBe(5);
      expect(exportedCard.lapses).toBe(1);
    });

    it("should preserve card language", async () => {
      mockCards.push(
        createTestCard({ targetSentence: "Polish", language: LanguageId.Polish }),
        createTestCard({
          id: (Date.now() + 1).toString(),
          targetSentence: "Japanese",
          language: LanguageId.Japanese,
        })
      );

      const settings = createTestSettings();

      const exportedData = await exportSyncData(settings);

      expect(exportedData.cards.find((c) => c.targetSentence === "Polish")?.language).toBe(LanguageId.Polish);
      expect(exportedData.cards.find((c) => c.targetSentence === "Japanese")?.language).toBe(LanguageId.Japanese);
    });

    it("should preserve bookmark and leech flags", async () => {
      mockCards.push(
        createTestCard({ targetSentence: "Bookmarked", isBookmarked: true }),
        createTestCard({
          id: (Date.now() + 1).toString(),
          targetSentence: "Leech",
          isLeech: true,
        })
      );

      const settings = createTestSettings();

      const exportedData = await exportSyncData(settings);

      expect(exportedData.cards.find((c) => c.targetSentence === "Bookmarked")?.isBookmarked).toBe(true);
      expect(exportedData.cards.find((c) => c.targetSentence === "Leech")?.isLeech).toBe(true);
    });

    it("should strip user_id from exported cards", async () => {
      mockCards.push(
        createTestCard({
          targetSentence: "Card with user",
          user_id: "some-user-id",
        })
      );

      const settings = createTestSettings();

      const exportedData = await exportSyncData(settings);

      expect(exportedData.cards[0].user_id).toBeUndefined();
    });
  });

  describe("importSyncData", () => {
    it("should import cards successfully", async () => {
      const syncData: SyncData = {
        version: 3,
        lastSynced: new Date().toISOString(),
        deviceId: "other-device",
        cards: [
          createTestCard({
            id: "import-1",
            targetSentence: "Imported sentence",
            targetWord: "Imported",
          }),
        ],
        history: {},
        revlog: [],
        settings: {},
        profile: null,
        aggregatedStats: [],
      };

      const updateSettingsMock = vi.fn();

      const result = await importSyncData(syncData, updateSettingsMock);

      expect(result.success).toBe(true);
    });

    it("should reject invalid sync data without cards", async () => {
      const invalidData = {
        version: 3,
        lastSynced: new Date().toISOString(),
        deviceId: "test",
        
      } as SyncData;

      const updateSettingsMock = vi.fn();

      const result = await importSyncData(invalidData, updateSettingsMock);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid sync data");
    });

    it("should import settings and call updateSettings", async () => {
      const syncData: SyncData = {
        version: 3,
        lastSynced: new Date().toISOString(),
        deviceId: "other-device",
        cards: [],
        history: {},
        revlog: [],
        settings: {
          language: LanguageId.Japanese,
          autoPlayAudio: false,
          blindMode: true,
        },
        profile: null,
        aggregatedStats: [],
      };

      const updateSettingsMock = vi.fn();

      await importSyncData(syncData, updateSettingsMock);

      expect(updateSettingsMock).toHaveBeenCalled();
      const calledSettings = updateSettingsMock.mock.calls[0][0];
      expect(calledSettings.language).toBe(LanguageId.Japanese);
      expect(calledSettings.autoPlayAudio).toBe(false);
      expect(calledSettings.blindMode).toBe(true);
    });

    it("should preserve API keys from existing settings when not importing", async () => {
      const syncData: SyncData = {
        version: 3,
        lastSynced: new Date().toISOString(),
        deviceId: "other-device",
        cards: [],
        history: {},
        revlog: [],
        settings: {
          language: LanguageId.Polish,
          geminiApiKey: "", 
        },
        profile: null,
        aggregatedStats: [],
      };

      const updateSettingsMock = vi.fn();

      await importSyncData(syncData, updateSettingsMock, { importApiKeys: false });

      expect(updateSettingsMock).toHaveBeenCalled();
      
      expect(updateSettingsMock.mock.calls[0][0].geminiApiKey).toBe("");
    });
  });

  describe("Round Trip Export/Import", () => {
    it("should preserve all card data through export and import", async () => {
      
      const originalCard = createTestCard({
        targetSentence: "Round trip test",
        targetWord: "trip",
        nativeTranslation: "Round trip translation",
        notes: "Round trip notes",
        stability: 5.5,
        difficulty: 4.2,
        reps: 3,
        language: LanguageId.Polish,
      });
      mockCards.push(originalCard);

      const settings = createTestSettings();

      
      const exportedData = await exportSyncData(settings, { includeApiKeys: true });

      
      expect(exportedData.cards).toHaveLength(1);
      expect(exportedData.cards[0].targetSentence).toBe("Round trip test");
      expect(exportedData.cards[0].targetWord).toBe("trip");
      expect(exportedData.cards[0].stability).toBe(5.5);
      expect(exportedData.cards[0].difficulty).toBe(4.2);
      expect(exportedData.cards[0].reps).toBe(3);
    });
  });
});
