import readline from 'readline';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import chalk from 'chalk';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function setupOwner() {
  console.clear();
  console.log(chalk.cyan.bold('\n' + '═'.repeat(50)));
  console.log(chalk.white.bold('   🛠️  WAQAR ELECTRONICS - OWNER SETUP 🛠️'));
  console.log(chalk.cyan.bold('═'.repeat(50)) + '\n');

  try {
    // Check if owner already exists
    const existingOwner = await prisma.user.findFirst({
      where: { role: 'OWNER' },
    });

    if (existingOwner) {
      console.log(chalk.yellow('⚠️  An Owner account already exists in the database.'));
      const confirm = await question('Do you want to create another owner? (y/n): ');
      if (confirm.toLowerCase() !== 'y') {
        process.exit(0);
      }
    }

    const name = await question('Enter Owner Name: ');
    const email = await question('Enter Owner Email: ');
    const password = await question('Enter Owner Password: ');

    if (!name || !email || !password) {
      console.log(chalk.red('\n❌ Error: All fields are required.'));
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const owner = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: 'OWNER',
        isActive: true,
      },
    });

    console.log(chalk.green('\n✅ Owner account created successfully!'));
    console.log(chalk.white(`   ID:    ${owner.id}`));
    console.log(chalk.white(`   Email: ${owner.email}`));
    console.log(chalk.cyan.bold('\n' + '═'.repeat(50)) + '\n');

  } catch (error) {
    console.error(chalk.red('\n❌ Setup failed:'), error);
  } finally {
    rl.close();
    process.exit(0);
  }
}

setupOwner();
