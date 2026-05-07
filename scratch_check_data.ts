import prisma from './lib/prisma.js';

async function checkData() {
  try {
    const branches = await prisma.branch.findMany();
    console.log(`Branches count: ${branches.length}`);
    console.log('Branches:', JSON.stringify(branches, null, 2));
    
    const stock = await prisma.stockItem.findMany();
    console.log(`Stock count: ${stock.length}`);
  } catch (err) {
    console.error('Error checking data:', err);
  } finally {
    process.exit();
  }
}

checkData();
