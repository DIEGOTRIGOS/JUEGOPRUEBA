import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from './prisma.service';

export type AuthenticatedUser = { id: string; role: 'USER' | 'ADMIN' };

@Injectable()
export class BearerAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers.authorization;
    const token = typeof header === 'string' && header.startsWith('Bearer ')
      ? header.slice(7)
      : '';

    if (!token) throw new UnauthorizedException('Inicia sesión para continuar');

    let payload: { sub?: string };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('La sesión venció. Vuelve a iniciar sesión');
    }

    if (!payload.sub) throw new UnauthorizedException('Sesión inválida');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, active: true },
    });
    if (!user?.active) throw new UnauthorizedException('La cuenta no está disponible');

    request.authUser = { id: user.id, role: user.role } satisfies AuthenticatedUser;
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    if ((request.authUser as AuthenticatedUser | undefined)?.role !== 'ADMIN') {
      throw new ForbiddenException('Se requiere acceso administrativo');
    }
    return true;
  }
}
