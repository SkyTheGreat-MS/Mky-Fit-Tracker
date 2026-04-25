import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Flame, CheckCircle2, Play, ChevronRight, AlertCircle, Dumbbell, Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { LoadingPage } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import {
  useGetDashboard,
  useGetReminders,
  useCompleteSession,
  getGetDashboardQueryKey,
  getGetStreakQueryKey,
  getListSessionsQueryKey,
  getGetRemindersQueryKey,
} from "@workspace/api-client-react";
import { ReminderKind } from "@workspace/api-zod";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const { data: dashboard, isLoading: loadingDashboard } = useGetDashboard();
  const { data: reminders = [] } = useGetReminders();
  const completeSession = useCompleteSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [completing, setCompleting] = useState(false);

  const handleCompleteToday = () => {
    if (!dashboard?.todaysWorkout) return;
    setCompleting(true);
    
    // Defaulting to 60 mins if unknown, would ideally be estimatedMinutes
    completeSession.mutate(
      {
        data: {
          workoutId: dashboard.todaysWorkout.workoutId,
          durationMinutes: 60,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
          
          toast({
            title: "Workout complete",
            description: "Great job! Your streak has been updated.",
          });
          setCompleting(false);
        },
        onError: () => {
          toast({
            title: "Error",
            description: "Failed to complete workout. Try again.",
            variant: "destructive",
          });
          setCompleting(false);
        },
      }
    );
  };

  if (loadingDashboard) return <LoadingPage />;
  if (!dashboard) return <EmptyState icon={<Dumbbell />} title="No data" description="Could not load dashboard." />;

  const activeReminders = reminders.filter(r => r.kind === ReminderKind.missed);
  const upcomingReminders = reminders.filter(r => r.kind === ReminderKind.upcoming);

  const progressValue = dashboard.weeklyStats.goalSessions > 0
    ? Math.min(100, (dashboard.weeklyStats.sessionsThisWeek / dashboard.weeklyStats.goalSessions) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-end">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date(dashboard.todayDate).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{dashboard.greeting}</h1>
        </div>
        <Link href="/trainer">
          <Button variant="outline" size="sm" className="rounded-full bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            Nutrition Target
          </Button>
        </Link>
      </header>

      {/* Active Reminders Banner */}
      <AnimatePresence>
        {activeReminders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-destructive/10 border border-destructive/20 text-destructive-foreground rounded-xl p-4 flex gap-3 items-start"
          >
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-destructive">Missed Session</h4>
              <p className="text-sm text-destructive/90">{activeReminders[0].message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Today's Workout Card */}
        <Card className="border-primary/20 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              TODAY'S PLAN
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.todaysWorkout ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{dashboard.todaysWorkout.workoutName}</h3>
                    <p className="text-sm text-muted-foreground">{dashboard.todaysWorkout.timeOfDay}</p>
                  </div>
                  {dashboard.todayCompleted ? (
                    <div className="flex items-center gap-1.5 text-primary bg-primary/10 px-3 py-1 rounded-full text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Done
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-muted-foreground bg-muted px-3 py-1 rounded-full text-sm font-medium">
                      Scheduled
                    </div>
                  )}
                </div>
                
                {!dashboard.todayCompleted && (
                  <div className="flex gap-2 pt-2">
                    <Link href={`/workouts/${dashboard.todaysWorkout.workoutId}`} className="flex-1">
                      <Button className="w-full" variant="default">
                        <Play className="w-4 h-4 mr-2" /> Start
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleCompleteToday}
                      disabled={completing}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Quick Log
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-4">Rest day. No workout scheduled.</p>
                <Link href="/schedule">
                  <Button variant="outline" size="sm">Edit Schedule</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="bg-card shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Current Streak</p>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary">{dashboard.streak.currentDays}</span>
                <span className="text-muted-foreground font-medium mb-1">days</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Best: {dashboard.streak.bestDays} days</p>
            </div>
            
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted opacity-20" />
                <circle 
                  cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
                  className="text-primary"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * Math.min(dashboard.streak.currentDays, 30) / 30)}
                  strokeLinecap="round"
                />
              </svg>
              <Flame className={`absolute w-8 h-8 ${dashboard.streak.currentDays > 0 ? "text-primary" : "text-muted-foreground/30"}`} />
            </div>
          </CardContent>
          <div className="px-6 pb-6 pt-0 flex justify-between">
            {dashboard.streak.weekHistory.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${day.completed ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {format(new Date(day.date), "E").charAt(0)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card className="bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex justify-between">
            <span>Weekly Progress</span>
            <span>{dashboard.weeklyStats.sessionsThisWeek} / {dashboard.weeklyStats.goalSessions} sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={progressValue} className="h-3 bg-muted" />
          <div className="flex justify-between mt-4 text-sm text-muted-foreground">
            <div><span className="font-bold text-foreground">{dashboard.weeklyStats.minutesThisWeek}</span> mins</div>
            <div><span className="font-bold text-foreground">{dashboard.weeklyStats.caloriesThisWeek}</span> kcal</div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sessions */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold">Recent Activity</h2>
        </div>
        
        {dashboard.recentSessions.length > 0 ? (
          <div className="space-y-3">
            {dashboard.recentSessions.slice(0, 3).map((session) => (
              <Card key={session.id} className="bg-card border-border hover:bg-accent/50 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{session.workoutName}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(session.completedAt), "MMM d, yyyy")} • {session.durationMinutes} min {session.caloriesBurned ? `• ${session.caloriesBurned} kcal` : ''}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-primary opacity-50" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState 
            icon={<Dumbbell />} 
            title="No activity yet" 
            description="Complete your first workout to see it here." 
            className="py-6"
          />
        )}
      </div>
      
      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div>
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-muted-foreground" /> 
            Upcoming
          </h2>
          <div className="space-y-2">
            {upcomingReminders.map(r => (
              <div key={r.id} className="text-sm px-4 py-3 bg-muted/50 rounded-lg flex justify-between items-center border border-border/50">
                <span className="text-muted-foreground">{r.message}</span>
                <span className="font-medium">{format(new Date(r.scheduledFor), "h:mm a")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}