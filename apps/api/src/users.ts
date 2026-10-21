import bcrypt from "bcryptjs";
import { normalizeEmail } from "@login-lab/shared";

export const BCRYPT_COST = 10;

export interface User {
  id: string;
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | undefined>;
}

export function createInMemoryUserRepository(users: User[]): UserRepository {
  const byEmail = new Map(users.map((u) => [normalizeEmail(u.email), u]));
  return {
    async findByEmail(email) {
      return byEmail.get(normalizeEmail(email));
    },
  };
}

export async function seedUser(email: string, password: string): Promise<User> {
  return {
    id: "user-1",
    email: normalizeEmail(email),
    passwordHash: await bcrypt.hash(password, BCRYPT_COST),
  };
}
