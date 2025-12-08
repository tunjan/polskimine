import React, { createContext, useContext } from "react";
import { db } from "@/db/dexie";
import { useAuth } from "./AuthContext";
import { useProfile } from "@/features/profile/hooks/useProfile";

interface GamificationContextType {
  incrementXP: (amount: number) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(
  undefined,
);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();

  const incrementXP = (amount: number) => {
    if (!profile || !user) return;

    const newXP = (profile.xp || 0) + amount;
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

    db.profile
      .update(user.id, {
        xp: newXP,
        points: (profile.points || 0) + amount,
        level: newLevel,
        updated_at: new Date().toISOString(),
      })
      .then(() => {
        refreshProfile();
      })
      .catch(console.error);
  };

  return (
    <GamificationContext.Provider value={{ incrementXP }}>
      {children}
    </GamificationContext.Provider>
  );
};

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within GamificationProvider");
  }
  return context;
};
