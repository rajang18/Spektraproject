import { randomUUID } from 'node:crypto';
import { AppError } from '../../core/errors/app-error.js';
import { AuthLoginRequest } from './auth.schema.js';
import { usersRepository } from './users.repository.js';

export class AuthService {
  async login(request: AuthLoginRequest) {
    const user = usersRepository.findByCredentials(request.email, request.password);

    if (!user) {
      throw new AppError(
        'Email or password does not exist. Please check your credentials and try again.',
        401,
        'INVALID_CREDENTIALS'
      );
    }

    return {
      accessToken: randomUUID(),
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      roles: user.roles
    };
  }
}

export const authService = new AuthService();
