import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import {
  accountIdParamsSchema,
  accountSchema,
  accountUpdateSchema,
} from '@repo/shared';
import { Session, type UserSession } from '@thallesp/nestjs-better-auth';
import { createZodDto, ZodResponse } from 'nestjs-zod';
import { Roles } from '../auth/roles.decorator.js';
import { UsersService } from './users.service.js';

class AccountDto extends createZodDto(accountSchema, { codec: true }) {}
class AccountIdParamsDto extends createZodDto(accountIdParamsSchema) {}
class AccountUpdateDto extends createZodDto(accountUpdateSchema) {}

@Roles(['admin'])
@Controller('admin/users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ZodResponse({ type: [AccountDto] })
  list() {
    return this.users.list();
  }

  @Patch(':id')
  @ZodResponse({ type: AccountDto })
  update(
    @Param() { id }: AccountIdParamsDto,
    @Body() body: AccountUpdateDto,
    @Session() session: UserSession,
  ) {
    return this.users.update(id, body, session.user.id);
  }
}
