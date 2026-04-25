import { Link, useLocation } from "wouter";
import { Home, Dumbbell, Calendar, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/schedule", label: "Schedule", icon: Calendar },
  { href: "/trainer", label: "Trainer", icon: MessageSquare },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background text-foreground">
      <nav className="md:w-64 md:border-r border-border bg-card p-4 hidden md:flex md:flex-col gap-2">
        <div className="text-2xl font-bold mb-8 text-primary px-2">Mky.</div>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={cn("flex items-center gap-3 p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors", location === item.href && "bg-primary text-primary-foreground hover:bg-primary/90")}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>

      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto relative">
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full">
          {children}
        </div>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card flex justify-around p-2 pb-safe z-50">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className={cn("flex flex-col items-center p-2 rounded-lg text-muted-foreground", location === item.href && "text-primary")}>
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}