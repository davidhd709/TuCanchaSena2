import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'admin@tucancha.com' },
    });

    if (user) {
      const hashedPassword = await bcrypt.hash('123456789', 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
      console.log('Password updated successfully for admin@tucancha.com');
    } else {
      console.log('User admin@tucancha.com not found');
    }
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();


checkUser();
