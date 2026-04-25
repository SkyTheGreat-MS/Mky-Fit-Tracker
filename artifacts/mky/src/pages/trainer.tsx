import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingPage } from "@/components/ui/loading";
import {
  useGetCalorieRecommendation,
  useTrainerChat,
} from "@workspace/api-client-react";
import { TrainerChatMessage, TrainerChatMessageRole } from "@workspace/api-zod";

export default function Trainer() {
  const { data: calories, isLoading: loadingCalories } = useGetCalorieRecommendation();
  const trainerChat = useTrainerChat();
  
  const [messages, setMessages] = useState<TrainerChatMessage[]>([
    { role: TrainerChatMessageRole.assistant, content: "Hey. I'm Mky. How's training going? Need help adjusting your routine or checking form?" }
  ]);
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, trainerChat.isPending]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || trainerChat.isPending) return;

    const userMsg = input.trim();
    setInput("");
    
    const newMessages = [...messages, { role: TrainerChatMessageRole.user, content: userMsg }];
    setMessages(newMessages);

    trainerChat.mutate({
      data: { message: userMsg, history: messages }
    }, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: TrainerChatMessageRole.assistant, content: data.reply }]);
      }
    });
  };

  if (loadingCalories) return <LoadingPage />;

  return (
    <div className="h-[calc(100vh-5rem)] md:h-[calc(100vh-4rem)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-4 shrink-0">
        <h1 className="text-3xl font-bold tracking-tight">Trainer</h1>
      </header>

      {calories && (
        <Card className="bg-primary/5 border-primary/20 shrink-0 mb-4">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-1">Daily Target</p>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">{calories.targetCalories}</span>
                <span className="text-sm font-medium text-muted-foreground">kcal</span>
              </div>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex flex-col items-center">
                <span className="font-bold text-foreground">{calories.proteinGrams}g</span>
                <span className="text-xs text-muted-foreground">Protein</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-foreground">{calories.carbGrams}g</span>
                <span className="text-xs text-muted-foreground">Carbs</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-foreground">{calories.fatGrams}g</span>
                <span className="text-xs text-muted-foreground">Fat</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="flex-1 overflow-hidden flex flex-col bg-card border-border shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`px-4 py-2.5 rounded-2xl max-w-[80%] text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {trainerChat.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground shrink-0 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-muted text-foreground rounded-tl-sm flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-150" />
                <div className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-300" />
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        <div className="p-3 bg-background border-t border-border shrink-0">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input 
              placeholder="Ask about form, routines, nutrition..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-full bg-muted/50 border-transparent focus-visible:ring-primary focus-visible:bg-background"
              disabled={trainerChat.isPending}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="rounded-full shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!input.trim() || trainerChat.isPending}
            >
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}