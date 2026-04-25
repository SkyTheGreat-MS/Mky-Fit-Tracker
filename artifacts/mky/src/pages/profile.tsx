import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { LoadingPage } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import {
  useGetProfile,
  useUpdateProfile,
  getGetProfileQueryKey,
  getGetCalorieRecommendationQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Sex, FitnessGoal, ActivityLevel } from "@workspace/api-client-react";

const profileSchema = z.object({
  displayName: z.string().min(1, "Name is required"),
  sex: z.nativeEnum(Sex),
  age: z.coerce.number().min(10).max(120),
  heightCm: z.coerce.number().min(100).max(300),
  weightKg: z.coerce.number().min(30).max(300),
  targetWeightKg: z.coerce.number().min(30).max(300).optional().nullable(),
  goal: z.nativeEnum(FitnessGoal),
  activityLevel: z.nativeEnum(ActivityLevel),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { data: profile, isLoading } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      sex: Sex.male,
      age: 30,
      heightCm: 175,
      weightKg: 75,
      targetWeightKg: null,
      goal: FitnessGoal.maintain,
      activityLevel: ActivityLevel.moderate,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName,
        sex: profile.sex,
        age: profile.age,
        heightCm: profile.heightCm,
        weightKg: profile.weightKg,
        targetWeightKg: profile.targetWeightKg,
        goal: profile.goal,
        activityLevel: profile.activityLevel,
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCalorieRecommendationQueryKey() });
        toast({ title: "Profile updated", description: "Your daily targets have been recalculated." });
      },
      onError: () => toast({ title: "Error updating profile", variant: "destructive" })
    });
  };

  if (isLoading) return <LoadingPage />;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your stats and goals</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="bg-card">
            <CardContent className="p-6 space-y-6">
              
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Basic Info</h3>
                <FormField control={form.control} name="displayName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="sex" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sex</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value={Sex.male}>Male</SelectItem>
                          <SelectItem value={Sex.female}>Female</SelectItem>
                          <SelectItem value={Sex.other}>Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="heightCm" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="weightKg" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="font-semibold text-lg">Goals & Activity</h3>
                <FormField control={form.control} name="goal" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Goal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={FitnessGoal.lose_weight}>Lose Weight</SelectItem>
                        <SelectItem value={FitnessGoal.maintain}>Maintain</SelectItem>
                        <SelectItem value={FitnessGoal.build_muscle}>Build Muscle</SelectItem>
                        <SelectItem value={FitnessGoal.improve_endurance}>Improve Endurance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="targetWeightKg" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Weight (kg) - Optional</FormLabel>
                    <FormControl><Input type="number" placeholder="Leave empty if not applicable" {...field} value={field.value || ""} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="activityLevel" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Activity Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value={ActivityLevel.sedentary}>Sedentary (Office job)</SelectItem>
                        <SelectItem value={ActivityLevel.light}>Light (1-2 days/week)</SelectItem>
                        <SelectItem value={ActivityLevel.moderate}>Moderate (3-5 days/week)</SelectItem>
                        <SelectItem value={ActivityLevel.active}>Active (6-7 days/week)</SelectItem>
                        <SelectItem value={ActivityLevel.very_active}>Very Active (Athlete)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
            {updateProfile.isPending ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
}