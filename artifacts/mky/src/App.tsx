import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";

import Dashboard from "@/pages/dashboard";
import WorkoutsList from "@/pages/workouts/list";
import WorkoutEditor from "@/pages/workouts/editor";
import WorkoutDetail from "@/pages/workouts/detail";
import Schedule from "@/pages/schedule";
import Trainer from "@/pages/trainer";
import Profile from "@/pages/profile";

const queryClient = new QueryClient();

function Router() {
  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/workouts" component={WorkoutsList} />
        <Route path="/workouts/new" component={WorkoutEditor} />
        <Route path="/workouts/:id/edit" component={WorkoutEditor} />
        <Route path="/workouts/:id" component={WorkoutDetail} />
        <Route path="/schedule" component={Schedule} />
        <Route path="/trainer" component={Trainer} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
