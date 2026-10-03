import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(name: string, email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedName = name.trim();
    const passwordHash = await bcrypt.hash(password, 12);

    try {
      const user = await this.prisma.$transaction(async transaction => {
        const created = await transaction.user.create({
          data: {
            name: normalizedName,
            email: normalizedEmail,
            passwordHash,
            demoBalance: new Prisma.Decimal(100000),
          },
        });
        await transaction.ledgerEntry.create({
          data: {
            userId: created.id,
            type: 'DEMO_GRANT',
            amount: new Prisma.Decimal(100000),
            reference: 'Créditos iniciales de práctica',
          },
        });
        return created;
      });

      return this.createSession(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe una cuenta con ese correo');
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!user?.active || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    return this.createSession(user);
  }

  private createSession(user: {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    demoBalance: Prisma.Decimal;
  }) {
    return {
      accessToken: this.jwt.sign({ sub: user.id, email: user.email, role: user.role }),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        demoBalance: user.demoBalance,
      },
    };
  }

  async me(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true, demoBalance: true },
    });
  }
}
