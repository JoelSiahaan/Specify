// scripts/test-db-connection.ts
// Script to test database connection

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from root .env file
config({ path: resolve(__dirname, '../../.env') });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');
    console.log(`📍 DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);
    
    // Test connection with a simple query
    await prisma.$queryRaw`SELECT 1 as result`;
    
    console.log('✅ Database connection successful!');
    console.log('📊 Database info:');
    
    // Get database version
    const result = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
    console.log(`   PostgreSQL Version: ${result[0].version.split(' ')[1]}`);
    
    // Test connection pool
    console.log('\n🔗 Testing connection pool...');
    const promises = Array.from({ length: 5 }, (_, i) => 
      prisma.$queryRaw`SELECT ${i + 1} as connection_test`
    );
    await Promise.all(promises);
    console.log('✅ Connection pool working correctly!');
    
    console.log('\n✨ All database tests passed!');
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
