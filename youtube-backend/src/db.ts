import mysql from 'mysql2/promise';
import type { RowDataPacket } from 'mysql2';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'ytanalysis',
  password: process.env.DB_PASSWORD || '0Gg12m',
  database: process.env.DB_NAME || 'ytanalysis',
};

export const pool = mysql.createPool(dbConfig);

async function columnExists(table: string, column: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) as count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [dbConfig.database, table, column],
  );
  return (rows[0]?.count ?? 0) > 0;
}

async function addColumnIfMissing(table: string, column: string, definition: string) {
  if (await columnExists(table, column)) {
    return;
  }
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}

export async function init() {
  await pool.query(`CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    plan ENUM('Pro','Business','Enterprise') DEFAULT 'Pro',
    is_active TINYINT(1) DEFAULT 1,
    mrr DECIMAL(10,2) DEFAULT 0,
    plan_expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await addColumnIfMissing('companies', 'plan', `ENUM('Pro','Business','Enterprise') DEFAULT 'Pro'`);
  await addColumnIfMissing('companies', 'is_active', 'TINYINT(1) DEFAULT 1');
  await addColumnIfMissing('companies', 'mrr', 'DECIMAL(10,2) DEFAULT 0');
  await addColumnIfMissing('companies', 'plan_expires_at', 'DATETIME');

  await pool.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('owner','admin','member') DEFAULT 'member',
    is_active TINYINT(1) DEFAULT 1,
    company_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  )`);

  await addColumnIfMissing('users', 'is_active', 'TINYINT(1) DEFAULT 1');

  await pool.query(`CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS channels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    avatar VARCHAR(512),
    subscriber_count BIGINT,
    url VARCHAR(512),
    youtube_id VARCHAR(255) NOT NULL,
    company_id INT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_company_channel (youtube_id, company_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    channels INT NOT NULL,
    active TINYINT(1) DEFAULT 1,
    popular TINYINT(1) DEFAULT 0
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS smtp_settings (
    id TINYINT PRIMARY KEY,
    host VARCHAR(255),
    port INT,
    secure TINYINT(1),
    user VARCHAR(255),
    pass VARCHAR(255),
    from_name VARCHAR(255),
    from_email VARCHAR(255),
    reply_to VARCHAR(255)
  )`);

  await pool.query(`INSERT INTO smtp_settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id=id`);

  await pool.query(`CREATE TABLE IF NOT EXISTS mp_settings (
    id TINYINT PRIMARY KEY,
    access_token VARCHAR(255),
    webhook_secret VARCHAR(255)
  )`);

  await pool.query(`INSERT INTO mp_settings (id) VALUES (1) ON DUPLICATE KEY UPDATE id=id`);

  await pool.query(`CREATE TABLE IF NOT EXISTS subscriptions (
    payment_id VARCHAR(255) PRIMARY KEY,
    company_id INT NOT NULL,
    plan_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id)
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(255) PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    email VARCHAR(255),
    status VARCHAR(50),
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
}
