import { db } from './index';

async function testDatabaseConnection() {
	try {
		const user = await db.selectFrom('users').selectAll().limit(1).executeTakeFirst();

		console.log('✅ Database connection successful!');
		console.log('User:', user);
	} catch (error) {
		console.error('❌ Database connection failed:', error);
	}
}

testDatabaseConnection();
