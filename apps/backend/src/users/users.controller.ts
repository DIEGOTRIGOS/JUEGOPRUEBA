import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthenticatedUser, BearerAuthGuard } from '../common/auth.guards';
import { PrismaService } from '../common/prisma.service';

@Controller('users')
@UseGuards(BearerAuthGuard)
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  me(@Req() request: { authUser: AuthenticatedUser }) {
    return this.prisma.user.findUnique({
      where: { id: request.authUser.id },
      select: { id: true, email: true, name: true, role: true, demoBalance: true },
    });
  }
}
