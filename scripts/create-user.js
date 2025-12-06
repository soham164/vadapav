const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finbridge',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function createUser(name, email, password, role = 'BORROWER', businessName = null, sector = null, location = null) {
  try {
    // Check if user exists
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('❌ User already exists with email:', email);
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, password_hash, role]
    );
    
    const user = result.rows[0];
    console.log('✅ User created successfully!');
    console.log('   ID:', user.id);
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    
    // Create business profile for borrowers
    if (role === 'BORROWER') {
      await pool.query(
        'INSERT INTO business_profiles (user_id, business_name, sector, location) VALUES ($1, $2, $3, $4)',
        [user.id, businessName || `${name}'s Business`, sector || 'General', location || 'India']
      );
      console.log('   Business:', businessName || `${name}'s Business`);
    }
    
    console.log('\n📝 Login Credentials:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
  } finally {
    await pool.end();
  }
}

// Get command line arguments
const args = process.argv.slice(2);

if (args.length < 3) {
  console.log('Usage: node create-user.js <name> <email> <password> [role] [business_name] [sector] [location]');
  console.log('\nExample:');
  console.log('  node create-user.js "John Doe" john@example.com mypassword123');
  console.log('  node create-user.js "Jane Smith" jane@example.com pass456 BORROWER "Jane\'s Store" Retail Mumbai');
  console.log('\nRoles: BORROWER (default), LENDER, ADMIN');
  process.exit(1);
}

const [name, email, password, role, businessName, sector, location] = args;

createUser(name, email, password, role, businessName, sector, location);
