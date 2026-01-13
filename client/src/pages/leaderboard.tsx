import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp, Calendar, Users } from 'lucide-react';
import { queryKeys } from '@/lib/queryClient';
import { useAuth } from '@/lib/auth-provider';
import type { LeaderboardEntry } from '@shared/schema';

const ENTRIES_PER_PAGE = 50;

/**
 * Medal component for top 3 positions
 */
function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) {
    return <Trophy className="w-6 h-6 text-yellow-500" />;
  }
  if (rank === 2) {
    return <Medal className="w-6 h-6 text-gray-400" />;
  }
  if (rank === 3) {
    return <Medal className="w-6 h-6 text-orange-600" />;
  }
  return (
    <span className="w-6 h-6 flex items-center justify-center text-sm font-semibold text-muted-foreground">
      {rank}
    </span>
  );
}

/**
 * Leaderboard entry row component
 */
function LeaderboardRow({
  entry,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
        isCurrentUser ? 'bg-primary/10 border-2 border-primary' : 'hover:bg-muted/50'
      }`}
    >
      {/* Rank */}
      <div className="flex-shrink-0 w-12 flex items-center justify-center">
        <RankMedal rank={entry.rank} />
      </div>

      {/* User Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="h-10 w-10">
          <AvatarImage src={entry.userAvatar} alt={entry.userName} />
          <AvatarFallback>
            {entry.userName
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate flex items-center gap-2">
            {entry.userName}
            {isCurrentUser && (
              <Badge variant="secondary" className="text-xs">
                You
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            Level {entry.level} · {entry.currentStreak} day streak
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden md:flex items-center gap-6 text-sm">
        <div className="text-center">
          <div className="font-semibold">{entry.quizzesCompleted}</div>
          <div className="text-xs text-muted-foreground">Quizzes</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">{entry.perfectScores}</div>
          <div className="text-xs text-muted-foreground">Perfect</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">{entry.averageScore}%</div>
          <div className="text-xs text-muted-foreground">Avg Score</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">{entry.totalBadges}</div>
          <div className="text-xs text-muted-foreground">Badges</div>
        </div>
      </div>

      {/* Score */}
      <div className="flex-shrink-0 text-right">
        <div className="text-xl font-bold text-primary">{entry.score.toLocaleString()}</div>
        <div className="text-xs text-muted-foreground">points</div>
      </div>
    </div>
  );
}

/**
 * Leaderboard display component
 */
function LeaderboardDisplay({
  entries,
  isLoading,
  error,
  currentUserId,
}: {
  entries?: LeaderboardEntry[];
  isLoading: boolean;
  error: Error | null;
  currentUserId?: string;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-20 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>Unable to load leaderboard</p>
            <p className="text-sm mt-1">Please try again later</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-20" />
            <p>No leaderboard entries yet</p>
            <p className="text-sm mt-1">Be the first to complete a quiz!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <LeaderboardRow
          key={entry.userId}
          entry={entry}
          isCurrentUser={entry.userId === currentUserId}
        />
      ))}
    </div>
  );
}

/**
 * Main Leaderboard Page Component
 */
export default function LeaderboardPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'global' | 'weekly' | 'monthly'>('global');

  // Fetch leaderboards
  const {
    data: globalLeaderboard,
    isLoading: loadingGlobal,
    error: errorGlobal,
  } = useQuery<LeaderboardEntry[]>({
    queryKey: queryKeys.leaderboard.global(ENTRIES_PER_PAGE),
    enabled: activeTab === 'global',
    staleTime: 30000, // Refresh every 30 seconds
  });

  const {
    data: weeklyLeaderboard,
    isLoading: loadingWeekly,
    error: errorWeekly,
  } = useQuery<LeaderboardEntry[]>({
    queryKey: queryKeys.leaderboard.weekly(ENTRIES_PER_PAGE),
    enabled: activeTab === 'weekly',
    staleTime: 30000,
  });

  const {
    data: monthlyLeaderboard,
    isLoading: loadingMonthly,
    error: errorMonthly,
  } = useQuery<LeaderboardEntry[]>({
    queryKey: queryKeys.leaderboard.monthly(ENTRIES_PER_PAGE),
    enabled: activeTab === 'monthly',
    staleTime: 30000,
  });

  // Get user's rank in global leaderboard
  const { data: userRank } = useQuery<number>({
    queryKey: queryKeys.leaderboard.userRank(currentUser?.id),
    enabled: !!currentUser?.id,
    staleTime: 30000,
  });

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Compete with other learners and climb the ranks!
          </p>
        </div>

        {/* User Rank Card */}
        {currentUser && userRank && userRank > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={currentUser.profileImageUrl || undefined}
                      alt={currentUser.firstName || 'User'}
                    />
                    <AvatarFallback>
                      {currentUser.firstName?.[0] || 'U'}
                      {currentUser.lastName?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">Your Global Rank</div>
                    <div className="text-sm text-muted-foreground">
                      Keep learning to improve your position!
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">#{userRank}</div>
                  <div className="text-sm text-muted-foreground">of all users</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Rankings
            </CardTitle>
            <CardDescription>Top performers based on total points earned</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="grid w-full max-w-md grid-cols-3 mb-6">
                <TabsTrigger value="global" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  All Time
                </TabsTrigger>
                <TabsTrigger value="weekly" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  This Week
                </TabsTrigger>
                <TabsTrigger value="monthly" className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  This Month
                </TabsTrigger>
              </TabsList>

              <TabsContent value="global" className="mt-0">
                <LeaderboardDisplay
                  entries={globalLeaderboard}
                  isLoading={loadingGlobal}
                  error={errorGlobal}
                  currentUserId={currentUser?.id}
                />
              </TabsContent>

              <TabsContent value="weekly" className="mt-0">
                <LeaderboardDisplay
                  entries={weeklyLeaderboard}
                  isLoading={loadingWeekly}
                  error={errorWeekly}
                  currentUserId={currentUser?.id}
                />
              </TabsContent>

              <TabsContent value="monthly" className="mt-0">
                <LeaderboardDisplay
                  entries={monthlyLeaderboard}
                  isLoading={loadingMonthly}
                  error={errorMonthly}
                  currentUserId={currentUser?.id}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">How Rankings Work</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Points are earned by:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Completing quizzes (+10 points base)</li>
              <li>Answering questions correctly (+5 points each)</li>
              <li>Passing quizzes with 85%+ (+25 bonus points)</li>
              <li>Achieving perfect scores (+50 bonus points)</li>
              <li>Earning badges (varies by badge rarity)</li>
            </ul>
            <p className="mt-4">
              Rankings are updated in real-time as you complete quizzes and earn achievements.
              Weekly and monthly leaderboards reset at the start of each period.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
