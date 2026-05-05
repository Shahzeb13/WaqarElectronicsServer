import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import chalk from 'chalk';

export const seedOwner = async () => {
  const OWNER_EMAIL = 'admin@waqarelectronics.com';
  const OWNER_PASSWORD = 'admin_password_123'; // Change this after first login
  const OWNER_NAME = 'Waqar Owner';

  try {
    const existingOwner = await prisma.user.findFirst({
      where: { role: 'OWNER' }
    });

    if (existingOwner) {
      console.log(chalk.blue('ℹ  Owner already exists. Skipping hardcoded seed.'));
      return;
    }

    const hashedPassword = await bcrypt.hash(OWNER_PASSWORD, 10);

    const owner = await prisma.user.create({
      data: {
        name: OWNER_NAME,
        email: OWNER_EMAIL,
        passwordHash: hashedPassword,
        role: 'OWNER',
        isActive: true,
      },
    });

    console.log(chalk.green.bold('\n✅ HARDCODED OWNER CREATED SUCCESSFULLY'));
    console.log(chalk.white(`   Email:    ${OWNER_EMAIL}`));
    console.log(chalk.white(`   Password: ${OWNER_PASSWORD}`));
    console.log(chalk.yellow('   ⚠️  Please change this password immediately after login!\n'));

  } catch (error) {
    console.error(chalk.red('❌ Failed to seed hardcoded owner:'), error);
  }
};
