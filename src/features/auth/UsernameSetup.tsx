import React, { useState } from 'react';
import { User, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const UsernameSetup: React.FC = () => {
  const { updateUsername, user } = useAuth();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }

    if (username.length < 3) {
      toast.error("Username must be at least 3 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUsername(username.trim());
      toast.success("Welcome, " + username + "!");


    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to update username");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in-95 duration-500">
        
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mb-6 relative">
            <Sparkles size={32} strokeWidth={1.5} />
            <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-1 border border-border">
                <User size={16} className="text-muted-foreground" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight">
            One last thing...
          </h1>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Choose a unique username to identify yourself on the global leaderboard.
          </p>
        </div>

        <div className="bg-card border border-border/50 p-8 rounded-xl shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground ml-1">
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-3 text-muted-foreground/50" />
                <Input
                  className="pl-9 h-11 bg-secondary/20 border-border/50 focus:bg-background transition-all"
                  placeholder="e.g. PolyglotMaster"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  disabled={isSubmitting}
                  minLength={3}
                  maxLength={20}
                />
              </div>
              <p className="text-[10px] text-muted-foreground ml-1">
                This will be visible to other users.
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11" 
              disabled={isSubmitting || !username}
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <>
                  Complete Setup <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>
        </div>

        <div className="text-center">
            <p className="text-xs text-muted-foreground">
                Logged in as <span className="font-mono text-foreground">{user?.email}</span>
            </p>
        </div>
      </div>
    </div>
  );
};
