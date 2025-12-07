import React, { useMemo } from 'react';
import {
  Activity,
  Zap,
  BookOpen,
  Sparkles,
  Target,
  Circle,
  Clock,
  CheckCircle2,
  Flame,
  History,
  BarChart3,
  CalendarDays
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { subDays, startOfDay, format } from 'date-fns';

import { DeckStats, ReviewHistory, Card as CardType } from '@/types';

import { useSettingsStore } from '@/stores/useSettingsStore';
import { useProfile } from '@/features/profile/hooks/useProfile';
import { getRevlogStats } from '@/services/db/repositories/statsRepository';
import { getLevelProgress } from '@/lib/utils';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { getRankForLevel } from '@/components/ui/level-badge';
import { Heatmap } from './Heatmap';
import { RetentionStats } from './RetentionStats';
import { ReviewVolumeChart } from './ReviewVolumeChart';
import { TrueRetentionChart } from './TrueRetentionChart';

interface DashboardProps {
  metrics: {
    total: number;
    new: number;
    learning: number;
    reviewing: number;
    known: number;
  };
  languageXp: { xp: number; level: number };
  stats: DeckStats;
  history: ReviewHistory;
  onStartSession: () => void;
  cards: CardType[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  metrics,
  stats,
  history,
  onStartSession,
  cards,
  languageXp
}) => {
  const settings = useSettingsStore(s => s.settings);
  const { profile } = useProfile();

  const levelData = getLevelProgress(languageXp.xp);
  const rank = getRankForLevel(levelData.level);

  const { data: revlogStats, isLoading: isRevlogLoading } = useQuery({
    queryKey: ['revlogStats', settings.language],
    queryFn: () => getRevlogStats(settings.language),
  });

  const hasNoCards = metrics.total === 0;
  const hasNoActivity = stats.totalReviews === 0;

  const lastSevenDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(today, 6 - i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const count = history[dateKey] || 0;
      return { date, active: count > 0, count };
    });
  }, [history]);

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const isStreakAtRisk = stats.streak > 0 && !history[todayKey];

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">

      {/* Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>{profile?.username || 'User'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg">
                {levelData.level}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{rank.title}</p>
                <Progress value={levelData.progressPercent} className="h-2 mt-1" />
                <p className="text-xs text-muted-foreground mt-1">
                  {languageXp.xp.toLocaleString()} XP · {levelData.xpToNextLevel.toLocaleString()} to next
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-sm">
              <div className="p-2 rounded-md bg-muted">
                <p className="text-xs text-muted-foreground">Total XP</p>
                <p className="font-medium">{languageXp.xp.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-md bg-muted">
                <p className="text-xs text-muted-foreground">Points</p>
                <p className="font-medium">{profile?.points?.toLocaleString() ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stats.streak > 0 ? 'bg-primary/10' : 'bg-muted'}`}>
                <Flame className={`h-6 w-6 ${stats.streak > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold">{stats.streak}</span>
                  <span className="text-sm text-muted-foreground">day{stats.streak === 1 ? '' : 's'}</span>
                  {isStreakAtRisk && stats.streak > 0 && (
                    <span className="text-xs text-destructive font-medium">At Risk</span>
                  )}
                </div>
                <div className="flex gap-1">
                  {lastSevenDays.map((day, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">
                        {day.date.toLocaleDateString('en', { weekday: 'narrow' })}
                      </span>
                      <div className={`w-6 h-6 rounded-sm flex items-center justify-center ${day.active ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        {day.active && <span className="text-xs">✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study Session Card */}
        <Card>
          <CardContent className="flex flex-col">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Due for Review</p>
            <p className="text-5xl font-bold text-primary mb-2">{stats.due}</p>
            <div className="flex items-center gap-3 text-xs  text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Circle size={8} className="fill-blue-500 text-blue-500" /> {stats.newDue} New
              </span>
              <span className="flex items-center gap-1">
                <Circle size={8} className="fill-green-500 text-green-500" /> {stats.reviewDue} Reviews
              </span>
            </div>
            <Button size="lg" onClick={onStartSession} disabled={stats.due === 0} className="w-full max-w-xs md:mt-auto">
              {stats.due > 0 ? "Start Session" : "All Caught Up"}
            </Button>
            {stats.due === 0 && (
              <p className="mt-4 text-sm text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={14} /> You're all done for now!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Collection Stats */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Collection Stats</h2>
        {hasNoCards ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 rounded-full bg-muted p-3">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">Empty Inventory</p>
              <p className="text-xs text-muted-foreground">Add cards to start building your vocabulary.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">New</span>
                  <Circle size={14} className="text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{metrics.new.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Learning</span>
                  <Clock size={14} className="text-orange-500" />
                </div>
                <p className="text-2xl font-bold">{metrics.learning.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Reviewing</span>
                  <Activity size={14} className="text-purple-500" />
                </div>
                <p className="text-2xl font-bold">{metrics.reviewing.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Mastered</span>
                  <CheckCircle2 size={14} className="text-emerald-500" />
                </div>
                <p className="text-2xl font-bold">{metrics.known.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        )}
      </section>

      {/* Tabs for Detailed Stats */}
      <section>
        <Tabs defaultValue="activity" className="w-full">
          <TabsList className="mb-3">
            <TabsTrigger value="activity"><CalendarDays size={14} className="mr-1.5" /> Activity</TabsTrigger>
            <TabsTrigger value="analytics"><BarChart3 size={14} className="mr-1.5" /> Analytics</TabsTrigger>
            <TabsTrigger value="health"><Sparkles size={14} className="mr-1.5" /> Deck Health</TabsTrigger>
          </TabsList>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" />
                  Review Heatmap
                </CardTitle>
                <CardDescription>Visual history of your study habits</CardDescription>
              </CardHeader>
              <CardContent>
                {hasNoActivity ? (
                  <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <Activity size={32} className="opacity-20" />
                    <p className="text-sm">Start reviewing to generate activity data</p>
                  </div>
                ) : (
                  <Heatmap history={history} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            {hasNoActivity ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  Complete reviews to unlock analytics.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Review Volume</CardTitle>
                    <CardDescription>Daily card reviews over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      {isRevlogLoading ? (
                        <div className="animate-pulse bg-muted h-full w-full rounded-lg" />
                      ) : (
                        revlogStats && <ReviewVolumeChart data={revlogStats.activity} />
                      )}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Retention Rate</CardTitle>
                    <CardDescription>Pass rate vs interval</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      {isRevlogLoading ? (
                        <div className="animate-pulse bg-muted h-full w-full rounded-lg" />
                      ) : (
                        revlogStats && <TrueRetentionChart data={revlogStats.retention} targetRetention={settings.fsrs.request_retention} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  Retention Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RetentionStats cards={cards} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
};
