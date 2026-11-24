import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Account, AccountUpdate } from '@repo/shared';
import { UsersRepository } from './users.repository.js';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  list(): Promise<Account[]> {
    return this.repository.findAll();
  }

  /**
   * Changes another user's role or active flag. Admins can't change their own,
   * so the acting admin always remains and the office never loses its last one.
   */
  async update(
    id: string,
    changes: AccountUpdate,
    actorId: string,
  ): Promise<Account> {
    if (id === actorId) {
      throw new ForbiddenException("You can't change your own account");
    }
    const account = await this.repository.update(id, changes);
    if (!account) throw new NotFoundException('User not found');
    return account;
  }
}
