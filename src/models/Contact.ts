import { db } from './database';
import { Contact } from '../types';

export class ContactModel {
  static async findByEmail(email: string): Promise<Contact[]> {
    return await db.all<Contact>(
      'SELECT * FROM Contact WHERE email = ? AND deletedAt IS NULL',
      [email]
    );
  }

  static async findByPhone(phoneNumber: string): Promise<Contact[]> {
    return await db.all<Contact>(
      'SELECT * FROM Contact WHERE phoneNumber = ? AND deletedAt IS NULL',
      [phoneNumber]
    );
  }

  static async findById(id: number): Promise<Contact | null> {
    return await db.get<Contact>(
      'SELECT * FROM Contact WHERE id = ? AND deletedAt IS NULL',
      [id]
    );
  }

  static async findByLinkedId(linkedId: number): Promise<Contact[]> {
    return await db.all<Contact>(
      'SELECT * FROM Contact WHERE linkedId = ? AND deletedAt IS NULL',
      [linkedId]
    );
  }

  static async createPrimary(email?: string, phoneNumber?: string): Promise<Contact> {
    const now = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO Contact (email, phoneNumber, linkPrecedence, createdAt, updatedAt) VALUES (?, ?, "primary", ?, ?)',
      [email, phoneNumber, now, now]
    );
    
    const contact = await this.findById(result.lastID!);
    if (!contact) throw new Error('Failed to create contact');
    return contact;
  }

  static async createSecondary(
    email?: string,
    phoneNumber?: string,
    linkedId?: number
  ): Promise<Contact> {
    const now = new Date().toISOString();
    const result = await db.run(
      'INSERT INTO Contact (email, phoneNumber, linkedId, linkPrecedence, createdAt, updatedAt) VALUES (?, ?, ?, "secondary", ?, ?)',
      [email, phoneNumber, linkedId, now, now]
    );
    
    const contact = await this.findById(result.lastID!);
    if (!contact) throw new Error('Failed to create contact');
    return contact;
  }

  static async updateLinkedId(id: number, linkedId: number): Promise<void> {
    const now = new Date().toISOString();
    await db.run(
      'UPDATE Contact SET linkedId = ?, updatedAt = ? WHERE id = ?',
      [linkedId, now, id]
    );
  }

  static async findAllByIds(ids: number[]): Promise<Contact[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    return await db.all<Contact>(
      `SELECT * FROM Contact WHERE id IN (${placeholders}) AND deletedAt IS NULL ORDER BY createdAt ASC`,
      ids
    );
  }
}