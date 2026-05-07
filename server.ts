import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import chalk from 'chalk';
import authRoutes from './routes/auth.routes.js';
import branchRoutes from './routes/branch.routes.js';
import userRoutes from './routes/user.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import managerRoutes from './routes/manager.routes.js';
import ownerRoutes from './routes/owner.routes.js';
import { seedOwner } from './utils/seedOwner.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Base route
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to Waqar Electronics API' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/owner/branches', branchRoutes);
app.use('/api/owner/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/owner', ownerRoutes);

// Start server with a beautiful terminal UI
app.listen(PORT, async () => {
    // Seed hardcoded owner if none exists
    await seedOwner();
    
    console.clear();
    console.log(chalk.cyan.bold('\n' + '═'.repeat(50)));
    console.log(chalk.white.bold('   ⚡ WAQAR ELECTRONICS SERVER ⚡'));
    console.log(chalk.cyan.bold('═'.repeat(50)));
    console.log(chalk.green('  ✔  Status:   ') + chalk.white('Running'));
    console.log(chalk.green('  ✔  Port:     ') + chalk.yellow(PORT));
    console.log(chalk.green('  ✔  Env:      ') + chalk.magenta(process.env.NODE_ENV || 'development'));
    console.log(chalk.green('  ✔  URL:      ') + chalk.blue.underline(`http://localhost:${PORT}`));
    console.log(chalk.cyan.bold('═'.repeat(50)) + '\n');
    console.log(chalk.gray('  Watching for changes...\n'));
});

export default app;
