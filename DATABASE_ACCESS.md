# 🗄️ Database Access Guide

## Method 1: Using psql Command Line (Recommended)

### Windows
```bash
# Connect to database
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d finbridge

# Or if psql is in PATH
psql -U postgres -d finbridge
```

### Linux/Mac
```bash
psql -U postgres -d finbridge
```

## Method 2: Using pgAdmin (GUI Tool)

1. Open pgAdmin (comes with PostgreSQL installation)
2. Right-click "Servers" → Create → Server
3. Enter connection details:
   - Name: FinBridge
   - Host: localhost
   - Port: 5432
   - Database: finbridge
   - Username: postgres
   - Password: (your postgres password)

## Common Database Queries

### View All Users
```sql
SELECT * FROM users;
```

### View User with Business Profile
```sql
SELECT u.*, bp.business_name, bp.sector, bp.location 
FROM users u 
LEFT JOIN business_profiles bp ON u.id = bp.user_id;
```

### View Transactions for a User
```sql
SELECT * FROM transactions 
WHERE user_id = 1 
ORDER BY date DESC;
```

### View Monthly Income/Expense Summary
```sql
SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
FROM transactions 
WHERE user_id = 1
GROUP BY DATE_TRUNC('month', date)
ORDER BY month;
```

### View Loan Products
```sql
SELECT * FROM loan_products WHERE is_active = true;
```

### View Loan Applications
```sql
SELECT la.*, u.name, lp.lender_name 
FROM loan_applications la
JOIN users u ON la.user_id = u.id
JOIN loan_products lp ON la.loan_product_id = lp.id;
```

### View ML Scores
```sql
SELECT u.name, ms.eligibility_score, ms.health_score, ms.risk_level, ms.created_at
FROM model_scores ms
JOIN users u ON ms.user_id = u.id
ORDER BY ms.created_at DESC;
```

### View Risk Flags
```sql
SELECT rf.*, u.name 
FROM risk_flags rf
JOIN users u ON rf.user_id = u.id
ORDER BY rf.created_at DESC;
```

## Method 3: Using DBeaver (Universal Database Tool)

1. Download DBeaver: https://dbeaver.io/download/
2. Create new connection → PostgreSQL
3. Enter connection details:
   - Host: localhost
   - Port: 5432
   - Database: finbridge
   - Username: postgres
   - Password: (your password)

## Method 4: Using Node.js Script

Create a file `scripts/db-query.js`:

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'finbridge',
  password: 'password',
  port: 5432,
});

async function query() {
  try {
    // Example: Get all users
    const result = await pool.query('SELECT * FROM users');
    console.log(result.rows);
    
    // Example: Get user transactions
    const txs = await pool.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC',
      [1]
    );
    console.log(txs.rows);
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

query();
```

Run it:
```bash
cd backend
node ../scripts/db-query.js
```

## Method 5: Using Python Script

Create a file `scripts/db_query.py`:

```python
import psycopg2
from psycopg2.extras import RealDictCursor

conn = psycopg2.connect(
    host="localhost",
    database="finbridge",
    user="postgres",
    password="password",
    port="5432"
)

cursor = conn.cursor(cursor_factory=RealDictCursor)

# Get all users
cursor.execute("SELECT * FROM users")
users = cursor.fetchall()
for user in users:
    print(user)

# Get transactions
cursor.execute("SELECT * FROM transactions WHERE user_id = %s ORDER BY date DESC", (1,))
transactions = cursor.fetchall()
for tx in transactions:
    print(tx)

cursor.close()
conn.close()
```

Run it:
```bash
cd ml
python ../scripts/db_query.py
```

## Useful Database Commands

### List all tables
```sql
\dt
```

### Describe table structure
```sql
\d users
\d transactions
```

### Count records
```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM transactions;
```

### Export data to CSV
```sql
\copy (SELECT * FROM transactions WHERE user_id = 1) TO 'transactions.csv' CSV HEADER;
```

### Import data from CSV
```sql
\copy transactions(user_id, date, amount, type, category, description) FROM 'data.csv' CSV HEADER;
```

## Database Backup & Restore

### Backup
```bash
# Windows
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres finbridge > backup.sql

# Linux/Mac
pg_dump -U postgres finbridge > backup.sql
```

### Restore
```bash
# Windows
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres finbridge < backup.sql

# Linux/Mac
psql -U postgres finbridge < backup.sql
```

## Connection String Format

For use in applications:
```
postgresql://postgres:password@localhost:5432/finbridge
```

## Troubleshooting

### Can't connect?
1. Check if PostgreSQL service is running
2. Verify credentials in backend/.env
3. Check firewall settings
4. Ensure database exists: `psql -U postgres -l`

### Permission denied?
```sql
GRANT ALL PRIVILEGES ON DATABASE finbridge TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
```

### Reset password?
```bash
# As postgres user
ALTER USER postgres PASSWORD 'newpassword';
```
