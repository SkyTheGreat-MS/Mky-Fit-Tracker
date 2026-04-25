import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Clock, Play, CheckCircle2, MoreVertical, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useGetWorkout,
  useCompleteSession,
  getGetWorkoutQueryKey,
  getListSessionsQueryKey,
  getGetDashboardQueryKey,
  getGetStreakQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function WorkoutDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const { data: workout, isLoading } = useGetWorkout(params.id || "", {
    query: { enabled: !!params.id }
  });
  
  const completeSession = useCompleteSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [activeExerciseIndex, setActiveExerciseIndex] = useState(-1);
  const [completedSets, setCompletedSets] = useState<Record<string, number[]>>({});

  if (isLoading || !workout) return <LoadingPage />;

  const toggleSet = (exerciseId: string, setIndex: number) => {
    setCompletedSets(prev => {
      const exSets = prev[exerciseId] || [];
      if (exSets.includes(setIndex)) {
        return { ...prev, [exerciseId]: exSets.filter(s => s !== setIndex) };
      } else {
        return { ...prev, [exerciseId]: [...exSets, setIndex] };
      }
    });
  };

  const handleComplete = () => {
    completeSession.mutate({
      data: {
        workoutId: workout.id,
        durationMinutes: workout.estimatedMinutes, // Simple approximation
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStreakQueryKey() });
        toast({ title: "Workout Complete!", description: "Great job today." });
        setLocation("/");
      },
      onError: () => toast({ title: "Error completing workout", variant: "destructive" })
    });
  };

  const isStarted = activeExerciseIndex >= 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <header className="flex justify-between items-start gap-4">
        <div className="flex gap-3 items-start">
          <Button variant="ghost" size="icon" className="rounded-full shrink-0 -ml-2" onClick={() => window.history.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                {workout.category}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {workout.estimatedMinutes}m
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight">{workout.name}</h1>
            {workout.description && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{workout.description}</p>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLocation(`/workouts/${workout.id}/edit`)}>
              <Edit2 className="w-4 h-4 mr-2" /> Edit Routine
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="space-y-4 relative">
        {isStarted && <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border -z-10" />}
        
        {workout.exercises.map((exercise, index) => {
          const isActive = activeExerciseIndex === index;
          const isPast = activeExerciseIndex > index;
          const isPending = activeExerciseIndex < index;
          
          return (
            <Card 
              key={exercise.id} 
              className={`transition-all duration-300 ${
                isActive ? 'border-primary ring-1 ring-primary/20 bg-card shadow-md scale-[1.01]' : 
                isPast ? 'bg-card/50 opacity-70' : 'bg-card opacity-90'
              }`}
              onClick={() => !isStarted && setActiveExerciseIndex(index)}
            >
              <CardContent className="p-4 md:p-5 flex gap-4">
                {isStarted && (
                  <div className="shrink-0 mt-1 z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveExerciseIndex(index); }}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                        isActive ? 'border-primary bg-primary text-primary-foreground' : 
                        isPast ? 'border-primary/50 bg-primary/20 text-primary' : 'border-border bg-background text-muted-foreground'
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                    </button>
                  </div>
                )}
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`font-bold ${isActive ? 'text-lg text-foreground' : 'text-foreground'}`}>
                      {exercise.name}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground font-medium flex gap-3">
                    <span>{exercise.sets} sets</span>
                    <span>×</span>
                    <span>{exercise.reps} reps</span>
                    {exercise.weightKg && (
                      <><span>•</span><span className="text-foreground">{exercise.weightKg} kg</span></>
                    )}
                  </p>
                  
                  {isActive && (
                    <div className="mt-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
                      {Array.from({ length: exercise.sets }).map((_, setIdx) => {
                        const isSetCompleted = completedSets[exercise.id]?.includes(setIdx);
                        return (
                          <div 
                            key={setIdx} 
                            onClick={() => toggleSet(exercise.id, setIdx)}
                            className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                              isSetCompleted ? 'bg-primary/5 border-primary/30' : 'bg-background hover:bg-muted border-border'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSetCompleted ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                                {isSetCompleted && <CheckCircle2 className="w-3 h-3" />}
                              </div>
                              <span className="text-sm font-medium">Set {setIdx + 1}</span>
                            </div>
                            <div className="text-sm text-muted-foreground font-mono">
                              {exercise.weightKg ? `${exercise.weightKg}kg × ${exercise.reps}` : `${exercise.reps} reps`}
                            </div>
                          </div>
                        );
                      })}
                      
                      <div className="pt-2">
                        <Button 
                          className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80" 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (index < workout.exercises.length - 1) {
                              setActiveExerciseIndex(index + 1);
                              window.scrollTo({ top: e.currentTarget.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
                            } else {
                              handleComplete();
                            }
                          }}
                        >
                          {index < workout.exercises.length - 1 ? "Next Exercise" : "Finish Workout"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isStarted && (
        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 p-4 md:p-0 md:max-w-md mx-auto z-50 animate-in slide-in-from-bottom-10">
          <Button 
            size="lg" 
            className="w-full rounded-full h-14 text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            onClick={() => setActiveExerciseIndex(0)}
          >
            <Play className="w-5 h-5 mr-2 fill-current" /> Start Workout
          </Button>
        </div>
      )}
    </div>
  );
}