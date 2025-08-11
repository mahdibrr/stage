import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { centrifugoService } from '../services/centrifugoBackend';
export interface Conversation {
  id: string;
  name?: string;
  type: 'direct' | 'group';
  created_by: string;
  created_at: Date;
  updated_at: Date;
  participants?: string[];
  last_message?: Message;
  unread_count?: number;
}
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'location';
  metadata?: any;
  created_at: Date;
  read_by?: string[];
}
export interface OnlineUser {
  id: string;
  name: string;
  status: 'online' | 'away' | 'offline';
  last_seen: string;
}
export class MessagingModel {
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT DISTINCT c.* 
         FROM conversations c
         INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
         WHERE cp.user_id = ?
         ORDER BY c.updated_at DESC`,
        [userId]
      );
      const conversations = Array.isArray(rows) ? rows as Conversation[] : [];
      for (const conversation of conversations) {
        const [participantRows] = await connection.execute(
          `SELECT cp.user_id, u.full_name as name
           FROM conversation_participants cp
           INNER JOIN users u ON cp.user_id = u.id
           WHERE cp.conversation_id = ?`,
          [conversation.id]
        );
        conversation.participants = Array.isArray(participantRows) 
          ? (participantRows as any[]).map(p => p.user_id) 
          : [];
        const [messageRows] = await connection.execute(
          `SELECT * FROM messages 
           WHERE conversation_id = ? 
           ORDER BY created_at DESC 
           LIMIT 1`,
          [conversation.id]
        );
        if (Array.isArray(messageRows) && messageRows.length > 0) {
          conversation.last_message = messageRows[0] as Message;
        }
        const [unreadRows] = await connection.execute(
          `SELECT COUNT(*) as unread_count
           FROM messages m
           LEFT JOIN message_read_status mrs ON m.id = mrs.message_id AND mrs.user_id = ?
           WHERE m.conversation_id = ? AND m.sender_id != ? AND mrs.id IS NULL`,
          [userId, conversation.id, userId]
        );
        conversation.unread_count = Array.isArray(unreadRows) && unreadRows.length > 0 
          ? (unreadRows[0] as any).unread_count 
          : 0;
      }
      return conversations;
    } catch (error) {
      console.error('Error getting user conversations:', error);
      return [];
    } finally {
      connection.release();
    }
  }
  static async getConversationMessages(conversationId: string, page: number = 1, limit: number = 50): Promise<Message[]> {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      const [rows] = await connection.execute(
        `SELECT m.*, 
                GROUP_CONCAT(mrs.user_id) as read_by_users
         FROM messages m
         LEFT JOIN message_read_status mrs ON m.id = mrs.message_id
         WHERE m.conversation_id = ?
         GROUP BY m.id
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [conversationId, limit, offset]
      );
      const messages = Array.isArray(rows) ? rows as any[] : [];
      return messages.map(msg => ({
        ...msg,
        read_by: msg.read_by_users ? msg.read_by_users.split(',') : []
      }));
    } catch (error) {
      console.error('Error getting conversation messages:', error);
      return [];
    } finally {
      connection.release();
    }
  }
  static async sendMessage(conversationId: string, senderId: string, messageData: {
    content: string;
    type?: 'text' | 'image' | 'file' | 'location';
    metadata?: any;
  }): Promise<Message | null> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const messageId = uuidv4();
      await connection.execute(
        `INSERT INTO messages (id, conversation_id, sender_id, content, type, metadata)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          messageId,
          conversationId,
          senderId,
          messageData.content,
          messageData.type || 'text',
          messageData.metadata ? JSON.stringify(messageData.metadata) : null
        ]
      );
      await connection.execute(
        `INSERT INTO message_read_status (id, message_id, user_id)
         VALUES (?, ?, ?)`,
        [uuidv4(), messageId, senderId]
      );
      await connection.execute(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );
      await connection.commit();
      const message = await this.getMessageById(messageId);
      if (message) {
        const [participantRows] = await connection.execute(
          'SELECT user_id FROM conversation_participants WHERE conversation_id = ?',
          [conversationId]
        );
        const participants = Array.isArray(participantRows) 
          ? (participantRows as any[]).map(p => p.user_id)
          : [];
        for (const participantId of participants) {
          if (participantId !== senderId) {
            await centrifugoService.sendNotification(participantId, {
              type: 'message',
              title: 'New Message',
              message: messageData.content,
              data: { conversationId, messageId, senderId }
            });
          }
        }
        await centrifugoService.publishToChannel(`conversation:${conversationId}`, {
          type: 'new_message',
          message
        });
      }
      return message;
    } catch (error) {
      await connection.rollback();
      console.error('Error sending message:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  static async createConversation(createdBy: string, participants: string[], data: {
    type?: 'direct' | 'group';
    name?: string;
  }): Promise<Conversation | null> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const conversationId = uuidv4();
      await connection.execute(
        `INSERT INTO conversations (id, name, type, created_by)
         VALUES (?, ?, ?, ?)`,
        [
          conversationId,
          data.name || null,
          data.type || 'direct',
          createdBy
        ]
      );
      const allParticipants = [...new Set([createdBy, ...participants])];
      for (const participantId of allParticipants) {
        await connection.execute(
          `INSERT INTO conversation_participants (id, conversation_id, user_id)
           VALUES (?, ?, ?)`,
          [uuidv4(), conversationId, participantId]
        );
      }
      await connection.commit();
      return await this.getConversationById(conversationId);
    } catch (error) {
      await connection.rollback();
      console.error('Error creating conversation:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  static async markMessageAsRead(messageId: string, userId: string): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT IGNORE INTO message_read_status (id, message_id, user_id)
         VALUES (?, ?, ?)`,
        [uuidv4(), messageId, userId]
      );
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    } finally {
      connection.release();
    }
  }
  static async getOnlineUsers(): Promise<OnlineUser[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT id, full_name as name, 'online' as status, 
                CURRENT_TIMESTAMP as last_seen
         FROM users 
         WHERE is_active = true 
         LIMIT 20`
      );
      return Array.isArray(rows) ? rows as OnlineUser[] : [];
    } catch (error) {
      console.error('Error getting online users:', error);
      return [];
    } finally {
      connection.release();
    }
  }
  private static async getMessageById(messageId: string): Promise<Message | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM messages WHERE id = ?',
        [messageId]
      );
      return Array.isArray(rows) && rows.length > 0 ? rows[0] as Message : null;
    } catch (error) {
      console.error('Error getting message by ID:', error);
      return null;
    } finally {
      connection.release();
    }
  }
  private static async getConversationById(conversationId: string): Promise<Conversation | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM conversations WHERE id = ?',
        [conversationId]
      );
      return Array.isArray(rows) && rows.length > 0 ? rows[0] as Conversation : null;
    } catch (error) {
      console.error('Error getting conversation by ID:', error);
      return null;
    } finally {
      connection.release();
    }
  }
}
