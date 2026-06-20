import { Controller, Get, Patch, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Prisma } from '@prisma/client';
import { UserService } from './user.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMe(@CurrentUser() user: { id: string }) {
    return this.userService.findById(user.id);
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: { id: string },
    @Body() data: { name?: string; settings?: Prisma.JsonValue },
  ) {
    return this.userService.update(user.id, data);
  }

  @Post('me/password')
  async changePassword(
    @CurrentUser() user: { id: string },
    @Body() data: { currentPassword: string; newPassword: string },
  ) {
    return this.userService.changePassword(user.id, data.currentPassword, data.newPassword);
  }

  @Get()
  async list(@CurrentUser() user: { tenantId: string }) {
    return this.userService.findByTenant(user.tenantId);
  }
}
