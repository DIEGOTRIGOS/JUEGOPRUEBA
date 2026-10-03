import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AuthService {
 constructor(private prisma:PrismaService,private jwt:JwtService){}
 async login(email:string,password:string){const u=await this.prisma.user.findUnique({where:{email}});if(!u||!(await bcrypt.compare(password,u.passwordHash)))throw new UnauthorizedException('Credenciales inválidas');return {accessToken:this.jwt.sign({sub:u.id,email:u.email,role:u.role}),user:{id:u.id,email:u.email,name:u.name,role:u.role,demoBalance:u.demoBalance}};}
 async me(id:string){return this.prisma.user.findUnique({where:{id},select:{id:true,email:true,name:true,role:true,demoBalance:true}})}
}
