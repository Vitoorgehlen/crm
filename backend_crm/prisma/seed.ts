import { prisma } from "../prisma/client";
import bcrypt from 'bcrypt';

const email = process.env.SUPER_EMAIL;
const password = process.env.SUPER_PASSWORD;

async function seed() {
  const hashedPassword = await bcrypt.hash(String(password), 10);
  await prisma.superUser.create({
    data: {
      id: 1,
      email: email!,
      password: hashedPassword,
    },
  });

    console.log('Database seeded');
    await prisma.$disconnect();
}

if (email && password) {
  seed().catch(e => {
      console.error(e);
      prisma.$disconnect();
      process.exit(1);
  });
};

