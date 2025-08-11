import { pool } from '../config/database';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { centrifugoService, CentrifugoService } from '../services/centrifugoBackend';
export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'admin' | 'dispatcher' | 'driver' | 'customer';
  department?: string;
  phone?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: 'admin' | 'dispatcher' | 'driver' | 'customer';
  department?: string;
  phone?: string;
}
export interface LoginData {
  username: string;
  password: string;
}
export class UserModel {
  static async create(userData: CreateUserData): Promise<User | null> {
    const connection = await pool.getConnection();
    try {
      const userId = uuidv4();
      const passwordHash = await bcrypt.hash(userData.password, 12);
      const [existing] = await connection.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [userData.username, userData.email]
      );
      if (Array.isArray(existing) && existing.length > 0) {
        throw new Error('Username or email already exists');
      }
      await connection.execute(
        `INSERT INTO users (id, username, email, password_hash, full_name, role, department, phone)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          userData.username,
          userData.email,
          passwordHash,
          userData.full_name,
          userData.role || 'customer',
          userData.department || null,
          userData.phone || null
        ]
      );
      const user = await this.findById(userId);
      if (user) {
        try {
          const channels = CentrifugoService.getUserChannels(userId, user.role);
          const centrifugoToken = await centrifugoService.generateUserToken(userId, channels);
          await centrifugoService.registerUserChannels(userId, channels);
          await connection.execute(
            `INSERT INTO user_sessions (id, user_id, centrifugo_token, channels, expires_at)
             VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
            [
              uuidv4(),
              userId,
              centrifugoToken,
              JSON.stringify(channels.map(ch => ch.name))
            ]
          );
          console.log(`✅ Centrifugo integration setup for user ${user.username}`);
        } catch (centrifugoError) {
          console.warn(`⚠️ Centrifugo integration failed for user ${user.username}:`, centrifugoError);
        }
        await centrifugoService.sendNotification(userId, {
          type: 'system',
          title: 'Welcome to Khedma!',
          message: `Welcome ${user.full_name}! Your account has been created successfully.`,
          data: { userId, role: user.role }
        });
      }
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  static async authenticate(loginData: LoginData): Promise<User | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE username = ? AND is_active = true',
        [loginData.username]
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }
      const user = rows[0] as any;
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password_hash);
      if (!isPasswordValid) {
        return null;
      }
      const channels = CentrifugoService.getUserChannels(user.id, user.role);
      const centrifugoToken = await centrifugoService.generateUserToken(user.id, channels);
      await connection.execute(
        `INSERT INTO user_sessions (id, user_id, centrifugo_token, channels, expires_at)
         VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))
         ON DUPLICATE KEY UPDATE
         centrifugo_token = VALUES(centrifugo_token),
         channels = VALUES(channels),
         expires_at = VALUES(expires_at)`,
        [
          uuidv4(),
          user.id,
          centrifugoToken,
          JSON.stringify(channels.map(ch => ch.name))
        ]
      );
      await centrifugoService.registerUserChannels(user.id, channels);
      delete user.password_hash;
      return user as User;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  static async findById(id: string): Promise<User | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, username, email, full_name, role, department, phone, is_active, created_at, updated_at FROM users WHERE id = ?',
        [id]
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }
      return rows[0] as User;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    } finally {
      connection.release();
    }
  }
  static async findByUsername(username: string): Promise<User | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT id, username, email, full_name, role, department, phone, is_active, created_at, updated_at FROM users WHERE username = ?',
        [username]
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }
      return rows[0] as User;
    } catch (error) {
      console.error('Error finding user by username:', error);
      return null;
    } finally {
      connection.release();
    }
  }
  static async getAll(page: number = 1, limit: number = 50, role?: string): Promise<{ users: User[], total: number }> {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      let query = 'SELECT id, username, email, full_name, role, department, phone, is_active, created_at, updated_at FROM users';
      let countQuery = 'SELECT COUNT(*) as total FROM users';
      const params: any[] = [];
      if (role) {
        query += ' WHERE role = ?';
        countQuery += ' WHERE role = ?';
        params.push(role);
      }
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const queryParams = [...params, limit, offset];
      const [rows] = await connection.execute(query, queryParams);
      const [countResult] = await connection.execute(countQuery, params);
      const total = Array.isArray(countResult) && countResult.length > 0 ? (countResult[0] as any).total : 0;
      return {
        users: Array.isArray(rows) ? rows as User[] : [],
        total
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      return { users: [], total: 0 };
    } finally {
      connection.release();
    }
  }
  static async update(id: string, updateData: Partial<CreateUserData>): Promise<User | null> {
    const connection = await pool.getConnection();
    try {
      const updates: string[] = [];
      const params: any[] = [];
      if (updateData.email) {
        updates.push('email = ?');
        params.push(updateData.email);
      }
      if (updateData.full_name) {
        updates.push('full_name = ?');
        params.push(updateData.full_name);
      }
      if (updateData.role) {
        updates.push('role = ?');
        params.push(updateData.role);
      }
      if (updateData.department !== undefined) {
        updates.push('department = ?');
        params.push(updateData.department);
      }
      if (updateData.phone !== undefined) {
        updates.push('phone = ?');
        params.push(updateData.phone);
      }
      if (updateData.password) {
        const passwordHash = await bcrypt.hash(updateData.password, 12);
        updates.push('password_hash = ?');
        params.push(passwordHash);
      }
      if (updates.length === 0) {
        return await this.findById(id);
      }
      params.push(id);
      await connection.execute(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );
      return await this.findById(id);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  static async deactivate(id: string): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await centrifugoService.disconnectUser(id);
      await connection.execute(
        'UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );
      await connection.execute(
        'DELETE FROM user_sessions WHERE user_id = ?',
        [id]
      );
      return true;
    } catch (error) {
      console.error('Error deactivating user:', error);
      return false;
    } finally {
      connection.release();
    }
  }
  static async getCentrifugoToken(userId: string): Promise<string | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT centrifugo_token FROM user_sessions WHERE user_id = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }
      return (rows[0] as any).centrifugo_token;
    } catch (error) {
      console.error('Error getting Centrifugo token:', error);
      return null;
    } finally {
      connection.release();
    }
  }
}
