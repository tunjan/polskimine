import { BookOpen, GraduationCap, RefreshCw, Star, Play } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LevelBadge, getRankForLevel } from "@/components/ui/level-badge";
import { StreakDisplay } from "@/components/ui/streak-display";
import { ActivityHeatmap } from "@/components/ui/activity-heatmap";

export interface DashboardMetrics {
  total: number;
  new: number;
  learning: number;
  relearning: number;
  reviewing: number;
  known: number;
}

export interface LanguageXp {
  xp: number;
  level: number;
}

export interface DashboardStats {
  currentStreak: number;
  longestStreak: number;
  todayCards: number;
  todayTime: number;
}

export interface StudyCard {
  id: string;
  front: string;
  back: string;
}

export interface DashboardProps {
  metrics: DashboardMetrics;
  languageXp: LanguageXp;
  stats: DashboardStats;
  history: Record<string, number>;
  cards: StudyCard[];
  onStartSession: () => void;
}

export function Dashboard({
  metrics,
  languageXp,
  stats,
  history,
  onStartSession,
}: DashboardProps) {
  const currentLevelXp = (languageXp.level - 1) ** 2 * 100;
  const nextLevelXp = languageXp.level ** 2 * 100;
  const xpInCurrentLevel = languageXp.xp - currentLevelXp;
  const xpRequired = nextLevelXp - currentLevelXp;
  const progressPercent = Math.min((xpInCurrentLevel / xpRequired) * 100, 100);

  const lastSevenDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateKey = date.toISOString().split("T")[0];
    const count = history[dateKey] ?? 0;
    return {
      date,
      active: count > 0,
      count,
    };
  });

  const statCards = [
    {
      label: "New",
      value: metrics.new,
      icon: Star,
      description: "Ready to learn",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      label: "Learning",
      value: metrics.learning + metrics.relearning,
      icon: BookOpen,
      description: "In progress",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: "Reviewing",
      value: metrics.reviewing,
      icon: RefreshCw,
      description: "Due for review",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      label: "Known",
      value: metrics.known,
      icon: GraduationCap,
      description: "Mastered",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ];

  const dueCards = metrics.learning + metrics.relearning + metrics.reviewing;
  const rank = getRankForLevel(languageXp.level);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
              <div className="space-y-1 text-center md:text-left">
                <CardTitle className="text-2xl">
                  {dueCards > 0 || metrics.new > 0
                    ? "Ready to study?"
                    : "You're all caught up!"}
                </CardTitle>
                <CardDescription className="text-base">
                  {dueCards > 0 || metrics.new > 0 ? (
                    <>
                      You have{" "}
                      <span className="font-medium text-foreground">
                        {dueCards + metrics.new} cards
                      </span>{" "}
                      waiting for review
                    </>
                  ) : (
                    "Great job! You've completed all your reviews for now."
                  )}
                </CardDescription>
              </div>
              <Button
                size="lg"
                onClick={onStartSession}
                className="w-full md:w-auto px-8"
                disabled={dueCards === 0 && metrics.new === 0}
              >
                <Play className="mr-2 h-4 w-4" />
                <span>Start Session</span>
              </Button>
            </div>
          </CardHeader>
          {(dueCards > 0 || metrics.new > 0) && (
            <CardContent>
              <div
                className="flex flex-wrap justify-center md:justify-start gap-2"
                data-testid="dashboard-hero-breakdown"
              >
                {metrics.new > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-amber-100 text-amber-800 hover:bg-amber-100/80"
                  >
                    {metrics.new} new
                  </Badge>
                )}
                {metrics.learning + metrics.relearning > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 hover:bg-blue-100/80"
                  >
                    {metrics.learning + metrics.relearning} learning
                  </Badge>
                )}
                {metrics.reviewing > 0 && (
                  <Badge
                    variant="secondary"
                    className="bg-purple-100 text-purple-800 hover:bg-purple-100/80"
                  >
                    {metrics.reviewing} review
                  </Badge>
                )}
              </div>
            </CardContent>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Progress</CardTitle>
              <CardDescription>
                Keep learning to level up and unlock new ranks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <LevelBadge
                level={languageXp.level}
                xp={languageXp.xp}
                progressPercent={progressPercent}
                xpToNextLevel={xpRequired - xpInCurrentLevel}
                showDetails
              />
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current Rank</span>
                <span className="font-semibold text-primary">{rank.title}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Study Streak</CardTitle>
              <CardDescription>
                {stats.currentStreak > 0
                  ? `You're on a ${stats.currentStreak} day streak!`
                  : "Start studying to build your streak"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <StreakDisplay
                currentStreak={stats.currentStreak}
                lastSevenDays={lastSevenDays}
                isAtRisk={stats.currentStreak > 0 && !lastSevenDays[6]?.active}
              />
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Longest Streak</span>
                <span className="font-semibold">
                  {stats.longestStreak} days
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => (
            <Card
              key={stat.label}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-sm font-medium">
                    {stat.label}
                  </CardDescription>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tabular-nums">
                  {stat.value.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-0 sm:p-6 overflow-hidden">
            <ActivityHeatmap
              data={Object.entries(history).map(([date, count]) => ({
                date,
                count,
              }))}
              year={new Date().getFullYear()}
              className="pt-6 sm:pt-0"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
