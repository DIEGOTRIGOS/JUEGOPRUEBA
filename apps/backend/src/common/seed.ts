import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
const prisma = new PrismaClient();
export async function seedDemo(){
  const hash=await bcrypt.hash('Demo1234!',12);
  await prisma.user.upsert({where:{email:'demo@example.com'},update:{},create:{email:'demo@example.com',name:'Demo User',passwordHash:hash,demoBalance:100000}});
  await prisma.user.upsert({where:{email:'admin@example.com'},update:{},create:{email:'admin@example.com',name:'Admin Demo',role:'ADMIN',passwordHash:hash,demoBalance:100000}});
  await prisma.$disconnect();
}
