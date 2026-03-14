"use client";

import { create } from "zustand";
import type { User } from "@/src/types/smart-mortgage";

type UserState = {
  user: User;
  setUser: (user: User) => void;
};

const DEFAULT_USER: User = {
  id: "user-borrower-001",
  fullName: "Jordan Bennett",
  email: "jordan.bennett@smartmortgagepro.test",
  role: "borrower",
};

export const useUserStore = create<UserState>((set) => ({
  user: DEFAULT_USER,
  setUser: (user) => set({ user }),
}));
