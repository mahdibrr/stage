import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { centrifugoService } from '../services/centrifugoBackend';
export interface Delivery {
  id: string;
  customer_id: string;
  driver_id?: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
  pickup_address: string;
  delivery_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  scheduled_time: Date;
  estimated_delivery?: Date;
  actual_delivery?: Date;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  total_amount?: number;
  created_at: Date;
  updated_at: Date;
  items?: DeliveryItem[];
}
export interface DeliveryItem {
  id: string;
  delivery_id: string;
  name: string;
  quantity: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  price?: number;
}
export interface CreateDeliveryData {
  customer_id: string;
  pickup_address: string;
  delivery_address: string;
  pickup_lat?: number;
  pickup_lng?: number;
  delivery_lat?: number;
  delivery_lng?: number;
  scheduled_time: Date;
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  total_amount?: number;
  items: Omit<DeliveryItem, 'id' | 'delivery_id'>[];
}
export class DeliveryModel {
  static async create(deliveryData: CreateDeliveryData): Promise<Delivery | null> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const deliveryId = uuidv4();
      await connection.execute(
        `INSERT INTO deliveries (
          id, customer_id, status, pickup_address, delivery_address,
          pickup_lat, pickup_lng, delivery_lat, delivery_lng,
          scheduled_time, priority, notes, total_amount
        ) VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          deliveryId,
          deliveryData.customer_id,
          deliveryData.pickup_address,
          deliveryData.delivery_address,
          deliveryData.pickup_lat || null,
          deliveryData.pickup_lng || null,
          deliveryData.delivery_lat || null,
          deliveryData.delivery_lng || null,
          deliveryData.scheduled_time,
          deliveryData.priority || 'medium',
          deliveryData.notes || null,
          deliveryData.total_amount || null
        ]
      );
      for (const item of deliveryData.items) {
        await connection.execute(
          `INSERT INTO delivery_items (
            id, delivery_id, name, quantity, weight, length, width, height, price
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            uuidv4(),
            deliveryId,
            item.name,
            item.quantity,
            item.weight || null,
            item.length || null,
            item.width || null,
            item.height || null,
            item.price || null
          ]
        );
      }
      await connection.commit();
      await centrifugoService.sendNotification(deliveryData.customer_id, {
        type: 'delivery_update',
        title: 'New Delivery Created',
        message: `Your delivery to ${deliveryData.delivery_address} has been created and is pending assignment.`,
        data: { deliveryId, status: 'pending' }
      });
      return await this.findById(deliveryId);
    } catch (error) {
      await connection.rollback();
      console.error('Error creating delivery:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  static async findById(id: string): Promise<Delivery | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM deliveries WHERE id = ?',
        [id]
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }
      const delivery = rows[0] as Delivery;
      const [itemRows] = await connection.execute(
        'SELECT * FROM delivery_items WHERE delivery_id = ?',
        [id]
      );
      delivery.items = Array.isArray(itemRows) ? itemRows as DeliveryItem[] : [];
      return delivery;
    } catch (error) {
      console.error('Error finding delivery by ID:', error);
      return null;
    } finally {
      connection.release();
    }
  }
  static async getAll(page: number = 1, limit: number = 50, filters?: {
    status?: string;
    customer_id?: string;
    driver_id?: string;
  }): Promise<{ deliveries: Delivery[], total: number }> {
    const connection = await pool.getConnection();
    try {
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM deliveries';
      let countQuery = 'SELECT COUNT(*) as total FROM deliveries';
      const params: any[] = [];
      const whereConditions: string[] = [];
      if (filters?.status) {
        whereConditions.push('status = ?');
        params.push(filters.status);
      }
      if (filters?.customer_id) {
        whereConditions.push('customer_id = ?');
        params.push(filters.customer_id);
      }
      if (filters?.driver_id) {
        whereConditions.push('driver_id = ?');
        params.push(filters.driver_id);
      }
      if (whereConditions.length > 0) {
        const whereClause = ` WHERE ${whereConditions.join(' AND ')}`;
        query += whereClause;
        countQuery += whereClause;
      }
      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      const queryParams = [...params, limit, offset];
      const [rows] = await connection.execute(query, queryParams);
      const [countResult] = await connection.execute(countQuery, params);
      const total = Array.isArray(countResult) && countResult.length > 0 ? (countResult[0] as any).total : 0;
      return {
        deliveries: Array.isArray(rows) ? rows as Delivery[] : [],
        total
      };
    } catch (error) {
      console.error('Error getting all deliveries:', error);
      return { deliveries: [], total: 0 };
    } finally {
      connection.release();
    }
  }
  static async update(id: string, updateData: Partial<Delivery>): Promise<Delivery | null> {
    const connection = await pool.getConnection();
    try {
      const updates: string[] = [];
      const params: any[] = [];
      const allowedFields = [
        'driver_id', 'status', 'pickup_address', 'delivery_address',
        'pickup_lat', 'pickup_lng', 'delivery_lat', 'delivery_lng',
        'scheduled_time', 'estimated_delivery', 'actual_delivery',
        'priority', 'notes', 'total_amount'
      ];
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key)) {
          updates.push(`${key} = ?`);
          params.push(value);
        }
      }
      if (updates.length === 0) {
        return await this.findById(id);
      }
      params.push(id);
      await connection.execute(
        `UPDATE deliveries SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params
      );
      const delivery = await this.findById(id);
      if (delivery && updateData.status) {
        await centrifugoService.sendNotification(delivery.customer_id, {
          type: 'delivery_update',
          title: 'Delivery Status Updated',
          message: `Your delivery status has been updated to: ${updateData.status}`,
          data: { deliveryId: id, status: updateData.status }
        });
        if (delivery.driver_id) {
          await centrifugoService.sendNotification(delivery.driver_id, {
            type: 'delivery_update',
            title: 'Delivery Assignment Updated',
            message: `Delivery ${id} status updated to: ${updateData.status}`,
            data: { deliveryId: id, status: updateData.status }
          });
        }
      }
      return delivery;
    } catch (error) {
      console.error('Error updating delivery:', error);
      throw error;
    } finally {
      connection.release();
    }
  }
  static async delete(id: string): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        'DELETE FROM delivery_items WHERE delivery_id = ?',
        [id]
      );
      const [result] = await connection.execute(
        'DELETE FROM deliveries WHERE id = ?',
        [id]
      );
      await connection.commit();
      return (result as any).affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      console.error('Error deleting delivery:', error);
      return false;
    } finally {
      connection.release();
    }
  }
  static async getTracking(id: string): Promise<any[]> {
    const connection = await pool.getConnection();
    try {
      const delivery = await this.findById(id);
      if (!delivery || !delivery.driver_id) {
        return [];
      }
      const [rows] = await connection.execute(
        `SELECT latitude as lat, longitude as lng, timestamp 
         FROM driver_locations 
         WHERE driver_id = ? 
         ORDER BY timestamp DESC 
         LIMIT 50`,
        [delivery.driver_id]
      );
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      console.error('Error getting delivery tracking:', error);
      return [];
    } finally {
      connection.release();
    }
  }
  static async getStats(): Promise<{
    totalDeliveries: number;
    completedDeliveries: number;
    pendingDeliveries: number;
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
  }> {
    const connection = await pool.getConnection();
    try {
      const [totalResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM deliveries'
      );
      const [completedResult] = await connection.execute(
        "SELECT COUNT(*) as completed FROM deliveries WHERE status = 'delivered'"
      );
      const [pendingResult] = await connection.execute(
        "SELECT COUNT(*) as pending FROM deliveries WHERE status = 'pending'"
      );
      const totalDeliveries = (totalResult as any)[0]?.total || 0;
      const completedDeliveries = (completedResult as any)[0]?.completed || 0;
      const pendingDeliveries = (pendingResult as any)[0]?.pending || 0;
      return {
        totalDeliveries,
        completedDeliveries,
        pendingDeliveries,
        averageDeliveryTime: 45,
        onTimeDeliveryRate: completedDeliveries > 0 ? (completedDeliveries / totalDeliveries) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting delivery stats:', error);
      return {
        totalDeliveries: 0,
        completedDeliveries: 0,
        pendingDeliveries: 0,
        averageDeliveryTime: 0,
        onTimeDeliveryRate: 0
      };
    } finally {
      connection.release();
    }
  }
}
