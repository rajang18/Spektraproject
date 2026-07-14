import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export interface UserRecord {
  username: string;
  password: string;
  displayName: string;
  email: string;
  roles: string[];
}

const USERS_FILE_PATH = path.join(process.cwd(), 'data', 'users.json');

export class UsersRepository {
  private readUsers(): UserRecord[] {
    if (!existsSync(USERS_FILE_PATH)) {
      return [];
    }

    const raw = readFileSync(USERS_FILE_PATH, 'utf-8');
    return JSON.parse(raw) as UserRecord[];
  }

  findByCredentials(email: string, password: string): UserRecord | undefined {
    return this.readUsers().find(
      (user) => user.email.toLowerCase() === email.toLowerCase() && user.password === password
    );
  }
}

export const usersRepository = new UsersRepository();
