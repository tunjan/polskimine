import React, { useState } from 'react';
import { ArrowRight, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const UsernameSetup: React.FC = () => {
  const { updateUsername, user } = useAuth();
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    if (username.length < 3) {
      toast.error("Minimum 3 characters required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUsername(username.trim());
      toast.success("Identity established.");
    } catch (error: any) {
      toast.error(error.message || "Update failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-6 selection:bg-foreground selection:text-background">
      
      <div className="w-full max-w-[400px] animate-in fade-in zoom-in-95 duration-700 space-y-12">
        
        <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block mb-4">
                Step 02 / Identity
            </span>
            <h1 className="text-3xl md:text-4xl font-light tracking-tight text-foreground leading-tight">
                How should we <br/> call you?
            </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="relative group">
            <input
              className="w-full bg-transparent border-b border-border py-4 text-2xl md:text-3xl font-light outline-none transition-all focus:border-foreground placeholder:text-muted-foreground/20 rounded-none text-foreground"
              placeholder="Type name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              disabled={isSubmitting}
              minLength={3}
              maxLength={20}
            />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500">
                <span className="text-[9px] font-mono uppercase text-muted-foreground tracking-widest">
                    {username.length} / 20
                </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                ID: {user?.email}
            </div>

            <button 
              type="submit" 
              className="group flex items-center gap-3 text-sm font-medium hover:text-foreground/70 transition-colors disabled:opacity-50"
              disabled={isSubmitting || !username}
            >
              {isSubmitting ? 'Processing' : 'Confirm'}
              {isSubmitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};