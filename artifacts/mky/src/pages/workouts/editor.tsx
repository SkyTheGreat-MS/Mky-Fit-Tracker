import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { GripVertical, Plus, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import {
  useGetWorkout,
  useCreateWorkout,
  useUpdateWorkout,
  getListWorkoutsQueryKey,
  getGetWorkoutQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const exerciseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sets: z.coerce.number().min(1, "Min 1 set"),
  reps: z.coerce.number().min(1, "Min 1 rep"),
  weightKg: z.coerce.number().optional().nullable(),
  durationSeconds: z.coerce.number().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const workoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required"),
  estimatedMinutes: z.coerce.number().min(1, "Required"),
  exercises: z.array(exerciseSchema).min(1, "At least one exercise is required"),
});

type WorkoutFormValues = z.infer<typeof workoutSchema>;

export default function WorkoutEditor() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isNew = !params.id || params.id === "new";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: workout, isLoading: loadingWorkout } = useGetWorkout(params.id || "", {
    query: { enabled: !isNew }
  });

  const createWorkout = useCreateWorkout();
  const updateWorkout = useUpdateWorkout();

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "full_body",
      estimatedMinutes: 45,
      exercises: [{ name: "", sets: 3, reps: 10, weightKg: null, durationSeconds: null, notes: "" }],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  useEffect(() => {
    if (workout && !isNew) {
      form.reset({
        name: workout.name,
        description: workout.description || "",
        category: workout.category,
        estimatedMinutes: workout.estimatedMinutes,
        exercises: workout.exercises.map(e => ({
          name: e.name,
          sets: e.sets,
          reps: e.reps,
          weightKg: e.weightKg,
          durationSeconds: e.durationSeconds,
          notes: e.notes || "",
        })),
      });
    }
  }, [workout, isNew, form]);

  const onSubmit = (data: WorkoutFormValues) => {
    if (isNew) {
      createWorkout.mutate({ data }, {
        onSuccess: (newWorkout) => {
          queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
          toast({ title: "Workout created" });
          setLocation(`/workouts/${newWorkout.id}`);
        },
        onError: () => toast({ title: "Error creating workout", variant: "destructive" })
      });
    } else {
      updateWorkout.mutate({ workoutId: params.id!, data }, {
        onSuccess: (updatedWorkout) => {
          queryClient.invalidateQueries({ queryKey: getListWorkoutsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetWorkoutQueryKey(params.id!) });
          toast({ title: "Workout updated" });
          setLocation(`/workouts/${updatedWorkout.id}`);
        },
        onError: () => toast({ title: "Error updating workout", variant: "destructive" })
      });
    }
  };

  if (!isNew && loadingWorkout) return <LoadingPage />;

  const isPending = createWorkout.isPending || updateWorkout.isPending;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => window.history.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{isNew ? "New Routine" : "Edit Routine"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="bg-card">
            <CardContent className="p-6 space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Routine Name</FormLabel>
                  <FormControl><Input placeholder="e.g. Push Day, Full Body A" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="push">Push</SelectItem>
                        <SelectItem value="pull">Pull</SelectItem>
                        <SelectItem value="legs">Legs</SelectItem>
                        <SelectItem value="upper">Upper</SelectItem>
                        <SelectItem value="lower">Lower</SelectItem>
                        <SelectItem value="full_body">Full Body</SelectItem>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="core">Core</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="estimatedMinutes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Est. Mins</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl><Textarea placeholder="Notes about this routine" className="resize-none" {...field} value={field.value || ""} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Exercises</h2>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="bg-card border-border relative overflow-visible">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 p-2 cursor-grab text-muted-foreground hidden md:block">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <CardContent className="p-4 md:p-5">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-2">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-4">
                        <FormField control={form.control} name={`exercises.${index}.name`} render={({ field }) => (
                          <FormItem>
                            <FormControl><Input placeholder="Exercise name" className="font-semibold text-lg bg-transparent border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <FormField control={form.control} name={`exercises.${index}.sets`} render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Sets</FormLabel>
                              <FormControl><Input type="number" {...field} className="h-9" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`exercises.${index}.reps`} render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Reps</FormLabel>
                              <FormControl><Input type="number" {...field} className="h-9" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`exercises.${index}.weightKg`} render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Weight (kg)</FormLabel>
                              <FormControl><Input type="number" placeholder="Optional" {...field} value={field.value || ""} className="h-9" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={form.control} name={`exercises.${index}.durationSeconds`} render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs text-muted-foreground uppercase tracking-wider">Time (s)</FormLabel>
                              <FormControl><Input type="number" placeholder="Optional" {...field} value={field.value || ""} className="h-9" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" onClick={() => remove(index)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button type="button" variant="outline" className="w-full mt-4 border-dashed border-2 bg-transparent hover:bg-muted" onClick={() => append({ name: "", sets: 3, reps: 10, weightKg: null, durationSeconds: null, notes: "" })}>
              <Plus className="w-4 h-4 mr-2" /> Add Exercise
            </Button>
          </div>

          <div className="flex gap-4 pt-4 sticky bottom-20 md:static bg-background/80 backdrop-blur-sm p-4 md:p-0 md:bg-transparent z-40 border-t md:border-0 -mx-4 md:mx-0 px-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => window.history.back()} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isPending}>
              {isPending ? "Saving..." : "Save Routine"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}