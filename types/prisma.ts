export enum Role {
  ADMIN = "ADMIN",
  USER = "USER",
}

export interface Task {
  id: string;
  name: string;
  command: string;
  schedule: string;
  lastRun: string | null;
  nextRun: string | null;
  lastStatus: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}