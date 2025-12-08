import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ArrowLeft,
  User as UserIcon,
  Lock,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useSettingsStore } from "@/stores/useSettingsStore";
import {
  LanguageLevelSelector,
  DeckGenerationStep,
  AuthLayout,
} from "./components";
import { LanguageSelector } from "./components/LanguageSelector";
import { generateInitialDeck } from "@/features/generator/services/deckGeneration";
import { saveAllCards } from "@/db/repositories/cardRepository";
import { updateUserSettings } from "@/db/repositories/settingsRepository";
import { Difficulty, Card as CardType, Language, LanguageId } from "@/types";
import { Loader } from "@/components/ui/loading";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POLISH_BEGINNER_DECK } from "@/assets/starter-decks/polish";
import { NORWEGIAN_BEGINNER_DECK } from "@/assets/starter-decks/norwegian";
import { JAPANESE_BEGINNER_DECK } from "@/assets/starter-decks/japanese";
import { SPANISH_BEGINNER_DECK } from "@/assets/starter-decks/spanish";
import { GERMAN_BEGINNER_DECK } from "@/assets/starter-decks/german";
import { v4 as uuidv4 } from "uuid";
import { LocalUser } from "@/db/dexie";

type AuthMode = "login" | "register";
type SetupStep = "auth" | "language" | "level" | "deck";

const BEGINNER_DECKS: Record<Language, CardType[]> = {
  [LanguageId.Polish]: POLISH_BEGINNER_DECK,
  [LanguageId.Norwegian]: NORWEGIAN_BEGINNER_DECK,
  [LanguageId.Japanese]: JAPANESE_BEGINNER_DECK,
  [LanguageId.Spanish]: SPANISH_BEGINNER_DECK,
  [LanguageId.German]: GERMAN_BEGINNER_DECK,
};

export const AuthPage: React.FC = () => {
  const { markInitialDeckGenerated } = useProfile();
  const { register, login, getRegisteredUsers } = useAuth();

  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const [loading, setLoading] = useState(false);

  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [existingUsers, setExistingUsers] = useState<LocalUser[]>([]);
  const [setupStep, setSetupStep] = useState<SetupStep>("auth");
  const [selectedLevel, setSelectedLevel] = useState<Difficulty | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const users = await getRegisteredUsers();
      setExistingUsers(users);
      if (users.length > 0) {
        setAuthMode("login");
      }
    };
    loadUsers();
  }, [getRegisteredUsers]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authMode === "register") {
      if (!username.trim() || username.length < 3) {
        toast.error("Username must be at least 3 characters");
        return;
      }
      if (!password || password.length < 4) {
        toast.error("Password must be at least 4 characters");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      setLoading(true);
      try {
        const result = await register(username.trim(), password);
        setCurrentUserId(result.user.id);
        toast.success("Account created!");
        setSetupStep("language");
      } catch (error: any) {
        toast.error(error.message || "Registration failed");
      } finally {
        setLoading(false);
      }
    } else {
      if (!username.trim()) {
        toast.error("Please enter your username");
        return;
      }
      if (!password) {
        toast.error("Please enter your password");
        return;
      }

      setLoading(true);
      try {
        await login(username.trim(), password);
      } catch (error: any) {
        toast.error(error.message || "Login failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleLanguageToggle = (language: Language) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language],
    );
  };

  const handleLanguageContinue = () => {
    if (selectedLanguages.length > 0) {
      updateSettings({ language: selectedLanguages[0] });
      setSetupStep("level");
    }
  };

  const handleLevelSelected = (level: Difficulty) => {
    setSelectedLevel(level);
    setSetupStep("deck");
  };

  const handleDeckSetup = async (
    languages: Language[],
    useAI: boolean,
    apiKey?: string,
  ) => {
    if (!selectedLevel || !currentUserId) return;
    setLoading(true);

    try {
      if (useAI && apiKey) {
        await updateUserSettings(currentUserId, { geminiApiKey: apiKey });
      }

      let allCards: CardType[] = [];

      if (useAI && apiKey) {
        for (const language of languages) {
          const languageCards = await generateInitialDeck({
            language,
            proficiencyLevel: selectedLevel,
            apiKey,
          });
          allCards = [...allCards, ...languageCards];
        }
        toast.success(
          `Generated ${allCards.length} personalized cards for ${languages.length} language${languages.length > 1 ? "s" : ""}!`,
        );
      } else {
        for (const language of languages) {
          const rawDeck = BEGINNER_DECKS[language] || [];
          const languageCards = rawDeck.map((c) => ({
            ...c,
            id: uuidv4(),
            dueDate: new Date().toISOString(),
            tags: [...(c.tags || []), selectedLevel],
            user_id: currentUserId,
          }));
          allCards = [...allCards, ...languageCards];
        }
        toast.success(
          `Loaded ${allCards.length} starter cards for ${languages.length} language${languages.length > 1 ? "s" : ""}!`,
        );
      }

      allCards = allCards.map((c) => ({ ...c, user_id: currentUserId }));

      if (allCards.length > 0) {
        await saveAllCards(allCards);
      }

      await markInitialDeckGenerated(currentUserId);

      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="text-center my-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        LinguaFlow
      </h1>
      <p className="text-sm text-muted-foreground mt-2 font-medium">
        {authMode === "login" ? "Welcome back" : "Begin your journey"}
      </p>
    </div>
  );

  const renderAuthStep = () => (
    <form onSubmit={handleAuthSubmit} className="space-y-4">
      <Tabs
        value={authMode}
        onValueChange={(val) => setAuthMode(val as AuthMode)}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign In</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
      </Tabs>

      {authMode === "login" && existingUsers.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 mb-4">
          <Users size={14} />
          <span>
            {existingUsers.length} user{existingUsers.length > 1 ? "s" : ""}{" "}
            registered: {existingUsers.map((u) => u.username).join(", ")}
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label
          htmlFor="username"
          className="text-xs font-medium text-muted-foreground ml-1"
        >
          Username
        </Label>
        <div className="relative group/input">
          <Input
            id="username"
            type="text"
            placeholder={
              authMode === "login" ? "Enter your username" : "Choose a username"
            }
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="pl-11"
            required
            minLength={3}
            maxLength={20}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
            <UserIcon size={16} />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="password"
          className="text-xs font-medium text-muted-foreground ml-1"
        >
          Password
        </Label>
        <div className="relative group/input">
          <Input
            id="password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-11"
            required
            minLength={4}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
            <Lock size={16} />
          </div>
        </div>
      </div>

      {authMode === "register" && (
        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-xs font-medium text-muted-foreground ml-1"
          >
            Confirm Password
          </Label>
          <div className="relative group/input">
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-11"
              required
              minLength={4}
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within/input:text-primary transition-colors">
              <Lock size={16} />
            </div>
          </div>
        </div>
      )}

      <Button type="submit" className="w-full mt-2" disabled={loading}>
        {loading ? (
          <Loader size="sm" />
        ) : (
          <>
            {authMode === "login" ? "Sign In" : "Create Account"}{" "}
            <ArrowRight size={16} />
          </>
        )}
      </Button>
    </form>
  );

  if (loading && setupStep === "deck") {
    return (
      <AuthLayout>
        <Card className="text-center py-12 p-6">
          <Loader size="lg" />
          <h3 className="mt-4 text-lg font-medium tracking-wide ">
            Forging your deck...
          </h3>
          <p className="mt-2 text-muted-foreground text-sm max-w-xs mx-auto">
            Preparing your personalized learning path.
          </p>
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === "language") {
    return (
      <AuthLayout className="max-w-2xl">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSetupStep("auth")}
            >
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold">Select Languages</h2>
          </div>
          <LanguageSelector
            selectedLanguages={selectedLanguages}
            onToggle={handleLanguageToggle}
            onContinue={handleLanguageContinue}
          />
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === "level") {
    return (
      <AuthLayout className="max-w-2xl">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSetupStep("language")}
            >
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold">Select Proficiency</h2>
          </div>
          <LanguageLevelSelector
            selectedLevel={selectedLevel}
            onSelectLevel={handleLevelSelected}
          />
        </Card>
      </AuthLayout>
    );
  }

  if (setupStep === "deck") {
    return (
      <AuthLayout className="max-w-2xl">
        <Card className="p-6">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSetupStep("level")}
            >
              <ArrowLeft size={16} /> Back
            </Button>
            <h2 className="text-xl font-bold">Deck Configuration</h2>
          </div>
          <DeckGenerationStep
            languages={selectedLanguages}
            proficiencyLevel={selectedLevel!}
            onComplete={handleDeckSetup}
          />
        </Card>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Card className="py-8 px-6 md:px-8">
        {renderHeader()}
        {renderAuthStep()}

        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Your data is stored locally on this device
          </p>
        </div>
      </Card>
    </AuthLayout>
  );
};
