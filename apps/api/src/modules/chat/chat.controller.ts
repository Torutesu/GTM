import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  async sendMessage(
    @CurrentUser() user: { id: string; tenantId: string },
    @Body('content') content: string,
  ) {
    return this.chatService.processMessage(user.tenantId, user.id, content);
  }
}
