import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

const connectDB = async () => {
  const connection = await pool.getConnection();
  console.log("✅ MySQL connected:", connection.config.database);
  connection.release();
};

export default connectDB;

export { pool };

