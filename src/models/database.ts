import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = './contacts.db') {
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  private async init(): Promise<void> {
    const run = promisify(this.db.run.bind(this.db));
    
    await run(`
      CREATE TABLE IF NOT EXISTS Contact (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneNumber TEXT,
        email TEXT,
        linkedId INTEGER,
        linkPrecedence TEXT NOT NULL CHECK(linkPrecedence IN ('primary', 'secondary')),
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        deletedAt DATETIME,
        FOREIGN KEY (linkedId) REFERENCES Contact(id)
      )
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_contact_email ON Contact(email)
    `);
    
    await run(`
      CREATE INDEX IF NOT EXISTS idx_contact_phone ON Contact(phoneNumber)
    `);
    
    await run(`
      CREATE INDEX IF NOT EXISTS idx_contact_linkedId ON Contact(linkedId)
    `);
  }

  async get<T>(sql: string, params: any[] = []): Promise<T | null> {
    const get = this.db.get.bind(this.db) as (sql: string, params: any[], callback: (err: Error | null, row: any) => void) => void;
    return new Promise((resolve) => {
      get(sql, params, (err, row) => {
        if (err) throw err;
        resolve(row || null);
      });
    });
  }

  async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    const all = this.db.all.bind(this.db) as (sql: string, params: any[], callback: (err: Error | null, rows: any[]) => void) => void;
    return new Promise((resolve) => {
      all(sql, params, (err, rows) => {
        if (err) throw err;
        resolve(rows || []);
      });
    });
  }

  async run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
    const run = this.db.run.bind(this.db) as (sql: string, params: any[], callback: (err: Error | null, result: sqlite3.RunResult) => void) => void;
    return new Promise((resolve, reject) => {
      run(sql, params, function(this: sqlite3.RunResult, err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }

  async close(): Promise<void> {
    const close = promisify(this.db.close.bind(this.db));
    await close();
  }
}

export const db = new Database();