import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@dashboard.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'admin@dashboard.com',
      password: hashedPassword,
      name: 'Administrador',
      role: Role.ADMIN,
    },
  });

  console.log('Created admin user:', adminUser.email);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
