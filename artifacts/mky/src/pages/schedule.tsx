import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingPage } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import {
  useGetSchedule,
  useListWorkouts,
  useUpsertSchedule,
  getGetScheduleQueryKey,
  getGetDashboardQueryKey,
  getListWorkoutsQueryKey
} from "@workspace/api-client-react";
import { Weekday } from "@workspace/api-zod";
import { useQueryClient } from "@tanstack/react-query";

const WEEKDAYS = [
  { id: Weekday.mon, label: "Monday" },
  { id: Weekday.tue, label: "Tuesday" },
  { id: Weekday.wed, label: "Wednesday" },
  { id: Weekday.thu, label: "Thursday" },
  { id: Weekday.fri, label: "Friday" },
  { id: Weekday.sat, label: "Saturday" },
  { id: Weekday.sun, label: "Sunday" },
];

export default function Schedule() {
  const { data: schedule, isLoading: loadingSchedule } = useGetSchedule();
  const { data: workouts, isLoading: loadingWorkouts } = useListWorkouts();
  const upsertSchedule = useUpsertSchedule();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [edits, setEdits] = useState<Record<string, { workoutId: string; timeOfDay: string } | null>>({});

  if (loadingSchedule || loadingWorkouts) return <LoadingPage />;

  const getEntryForDay = (day: Weekday) => {
    if (edits[day] !== undefined) return edits[day];
    const existing = schedule?.find(e => e.weekday === day);
    if (existing) return { workoutId: existing.workoutId, timeOfDay: existing.timeOfDay };
    return null;
  };

  const handleUpdateDay = (day: Weekday, field: 'workoutId' | 'timeOfDay', value: string) => {
    setEdits(prev => {
      const current = getEntryForDay(day) || { workoutId: "", timeOfDay: "08:00" };
      
      // If setting workout to none
      if (field === 'workoutId' && value === 'none') {
        return { ...prev, [day]: null };
      }
      
      return { ...prev, [day]: { ...current, [field]: value } };
    });
  };

  const handleSave = () => {
    // Merge existing schedule with edits
    const finalEntries = [...WEEKDAYS].map(day => {
      const entry = getEntryForDay(day.id);
      if (entry && entry.workoutId) {
        return { weekday: day.id, workoutId: entry.workoutId, timeOfDay: entry.timeOfDay };
      }
      return null;
    }).filter(Boolean) as any;

    upsertSchedule.mutate({ data: { entries: finalEntries } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetScheduleQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setEdits({});
        toast({ title: "Schedule saved" });
      },
      onError: () => toast({ title: "Error saving schedule", variant: "destructive" })
    });
  };

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground mt-1">Plan your weekly training</p>
        </div>
        {hasEdits && (
          <Button onClick={handleSave} disabled={upsertSchedule.isPending}>
            {upsertSchedule.isPending ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </header>

      <div className="space-y-3">
        {WEEKDAYS.map((day) => {
          const entry = getEntryForDay(day.id);
          const isRestDay = !entry;
          
          return (
            <Card key={day.id} className={`overflow-hidden transition-colors ${!isRestDay ? 'border-primary/20 bg-card shadow-sm' : 'bg-muted/30 border-dashed'}`}>
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row md:items-center">
                  <div className={`p-4 md:w-32 shrink-0 ${!isRestDay ? 'bg-primary/5' : ''}`}>
                    <h3 className="font-bold text-lg">{day.label}</h3>
                  </div>
                  
                  <div className="flex-1 p-4 pt-0 md:pt-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                    <Select 
                      value={entry ? entry.workoutId : "none"} 
                      onValueChange={(val) => handleUpdateDay(day.id, 'workoutId', val)}
                    >
                      <SelectTrigger className={`md:flex-1 ${isRestDay ? 'text-muted-foreground bg-transparent' : 'font-medium'}`}>
                        <SelectValue placeholder="Select routine" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Rest Day</SelectItem>
                        {workouts?.map(w => (
                          <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {!isRestDay && (
                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <input 
                          type="time" 
                          value={entry.timeOfDay}
                          onChange={(e) => handleUpdateDay(day.id, 'timeOfDay', e.target.value)}
                          className="flex h-9 w-full md:w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}