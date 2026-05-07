import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });

async function checkTable() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'stock_items';
    `);
    console.log('Columns in stock_items:');
    res.rows.forEach(row => {
      console.log(`${row.column_name}: ${row.data_type}`);
    });
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

checkTable();
