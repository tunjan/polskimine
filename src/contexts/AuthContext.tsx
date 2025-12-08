import React, { createContext, useContext, useEffect, useState } from "react";
import { db, hashPassword, generateId, LocalUser } from "@/db/dexie";
import { toast } from "sonner";

interface AuthUser {
  id: string;
  username: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  register: (username: string, password: string) => Promise<{ user: AuthUser }>;
  login: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUsername: (username: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  getRegisteredUsers: () => Promise<LocalUser[]>;
}

const SESSION_KEY = "linguaflow_current_user";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedUserId = localStorage.getItem(SESSION_KEY);
        if (savedUserId) {
          const existingUser = await db.users.get(savedUserId);
          if (existingUser) {
            setUser({ id: existingUser.id, username: existingUser.username });
          } else {
            localStorage.removeItem(SESSION_KEY);
          }
        }
      } catch (error) {
        console.error("Failed to restore session:", error);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const register = async (
    username: string,
    password: string,
  ): Promise<{ user: AuthUser }> => {
    const existingUser = await db.users
      .where("username")
      .equals(username)
      .first();
    if (existingUser) {
      throw new Error("Username already exists");
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await db.users.add({
      id: userId,
      username,
      passwordHash,
      created_at: now,
    });

    await db.profile.put({
      id: userId,
      username,
      xp: 0,
      points: 0,
      level: 1,
      created_at: now,
      updated_at: now,
    });

    localStorage.setItem(SESSION_KEY, userId);

    const authUser = { id: userId, username };
    setUser(authUser);

    return { user: authUser };
  };

  const login = async (username: string, password: string): Promise<void> => {
    const existingUser = await db.users
      .where("username")
      .equals(username)
      .first();

    if (!existingUser) {
      throw new Error("User not found");
    }

    const passwordHash = await hashPassword(password);
    if (existingUser.passwordHash !== passwordHash) {
      throw new Error("Invalid password");
    }

    localStorage.setItem(SESSION_KEY, existingUser.id);
    setUser({ id: existingUser.id, username: existingUser.username });

    toast.success(`Welcome back, ${existingUser.username}!`);
  };

  const updateUsername = async (username: string) => {
    if (!user) throw new Error("No user logged in");

    const now = new Date().toISOString();

    await db.users.update(user.id, { username });

    const exists = await db.profile.get(user.id);
    if (exists) {
      await db.profile.update(user.id, { username, updated_at: now });
    } else {
      await db.profile.put({
        id: user.id,
        username,
        xp: 0,
        points: 0,
        level: 1,
        created_at: now,
        updated_at: now,
      });
    }

    setUser((prev) => (prev ? { ...prev, username } : null));
  };

  const signOut = async () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    toast.success("Signed out");
  };

  const deleteAccount = async () => {
    if (!user) throw new Error("No user logged in");

    await db.transaction(
      "rw",
      [db.users, db.profile, db.cards, db.revlog, db.history],
      async () => {
        await db.users.delete(user.id);
        await db.profile.delete(user.id);

        const userCards = await db.cards
          .where("user_id")
          .equals(user.id)
          .toArray();
        await db.cards.bulkDelete(userCards.map((c) => c.id));

        await db.revlog.where("user_id").equals(user.id).delete();
      },
    );

    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    toast.success("Account deleted");
  };

  const getRegisteredUsers = async (): Promise<LocalUser[]> => {
    return await db.users.toArray();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        register,
        login,
        signOut,
        deleteAccount,
        updateUsername,
        getRegisteredUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
