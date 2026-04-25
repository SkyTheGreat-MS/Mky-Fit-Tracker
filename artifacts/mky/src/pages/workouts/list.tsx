import { useLocation, Link } from "wouter";
import { format } from "date-fns";
import { Plus, Dumbbell, Clock, MoreVertical, Trash2, Edit2, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingPage } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useListWorkouts,
  useDeleteWorkout,
  getListWorkoutsQueryKey,
  getGetScheduleQueryKey,
  getGetDashboardQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export default function WorkoutsList() {
  const [, setLocation] = useLocation();
  const { data: workouts, isLoading } = useListWorkouts();
  const deleteWorkout = useDeleteWorkout();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm("Are you sure you want to delete this workout?")) {
      deleteWorkout.mutate({ workoutId: id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetScheduleQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          toast({ title: "Workout deleted" });
        },
        onError: () => {
          toast({ title: "Error", description: "Could not delete workout", variant: "destructive" });
        }
      });
    }
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Routines</h1>
          <p className="text-sm text-muted-foreground mt-1">Your saved workout plans</p>
        </div>
        <Link href="/workouts/new">
          <Button className="rounded-full w-10 h-10 p-0 md:w-auto md:px-4 md:py-2">
            <Plus className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">New Routine</span>
          </Button>
        </Link>
      </header>

      {workouts && workouts.length > 0 ? (
        <div className="grid gap-4">
          {workouts.map((workout) => (
            <Link key={workout.id} href={`/workouts/${workout.id}`}>
              <Card className="bg-card hover:border-primary/50 transition-colors cursor-pointer group relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20 group-hover:bg-primary transition-colors" />
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold">{workout.name}</h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-medium tracking-wide uppercase">
                        <span className="text-primary/80">{workout.category}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {workout.estimatedMinutes}m
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary hover:text-primary-foreground z-10" onClick={(e) => { e.preventDefault(); setLocation(`/workouts/${workout.id}`); }}>
                        <Play className="w-4 h-4 ml-0.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground z-10" onClick={(e) => e.preventDefault()}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.preventDefault(); setLocation(`/workouts/${workout.id}/edit`); }}>
                            <Edit2 className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive" onClick={(e) => handleDelete(workout.id, e)}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {workout.description && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-3">{workout.description}</p>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    {workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState 
          icon={<Dumbbell className="w-6 h-6" />}
          title="No routines yet"
          description="Create your first workout routine to start training."
          action={
            <Link href="/workouts/new">
              <Button>Create Routine</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}