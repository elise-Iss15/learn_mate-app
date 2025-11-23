const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool(process.env.DB_URI);

const promisePool = pool.promise();

const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

module.exports = {
  pool: promisePool,
  testConnection
};
