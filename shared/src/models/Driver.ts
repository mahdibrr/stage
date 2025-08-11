import { pool } from '../config/database';
import { UserModel } from './User';
export interface Driver {
  id: string;
  name: string;
  email: string;
  phone?: string;
  vehicle_type?: string;
  vehicle_id?: string;
  status: 'available' | 'busy' | 'offline';
  current_location?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
}
export interface DriverLocation {
  id: string;
  driver_id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}
export class DriverModel {
  static async getAll(): Promise<Driver[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
          u.id, 
          u.full_name as name, 
          u.email, 
          u.phone,
          'available' as status
         FROM users u 
         WHERE u.role = 'driver' AND u.is_active = true`
      );
      const drivers = Array.isArray(rows) ? rows as Driver[] : [];
      for (const driver of drivers) {
        const [locationRows] = await connection.execute(
          `SELECT latitude as lat, longitude as lng, timestamp 
           FROM driver_locations 
           WHERE driver_id = ? 
           ORDER BY timestamp DESC 
           LIMIT 1`,
          [driver.id]
        );
        if (Array.isArray(locationRows) && locationRows.length > 0) {
          const location = locationRows[0] as any;
          driver.current_location = {
            lat: location.lat,
            lng: location.lng,
            timestamp: location.timestamp
          };
        }
      }
      return drivers;
    } catch (error) {
      console.error('Error getting all drivers:', error);
      return [];
    } finally {
      connection.release();
    }
  }
  static async findById(id: string): Promise<Driver | null> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT 
          u.id, 
          u.full_name as name, 
          u.email, 
          u.phone,
          'available' as status
         FROM users u 
         WHERE u.id = ? AND u.role = 'driver' AND u.is_active = true`,
        [id]
      );
      if (!Array.isArray(rows) || rows.length === 0) {
        return null;
      }
      const driver = rows[0] as Driver;
      const [locationRows] = await connection.execute(
        `SELECT latitude as lat, longitude as lng, timestamp 
         FROM driver_locations 
         WHERE driver_id = ? 
         ORDER BY timestamp DESC 
         LIMIT 1`,
        [id]
      );
      if (Array.isArray(locationRows) && locationRows.length > 0) {
        const location = locationRows[0] as any;
        driver.current_location = {
          lat: location.lat,
          lng: location.lng,
          timestamp: location.timestamp
        };
      }
      return driver;
    } catch (error) {
      console.error('Error finding driver by ID:', error);
      return null;
    } finally {
      connection.release();
    }
  }
  static async updateLocation(driverId: string, location: {
    lat: number;
    lng: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
  }): Promise<boolean> {
    const connection = await pool.getConnection();
    try {
      const { v4: uuidv4 } = await import('uuid');
      await connection.execute(
        `INSERT INTO driver_locations (
          id, driver_id, latitude, longitude, accuracy, speed, heading
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          driverId,
          location.lat,
          location.lng,
          location.accuracy || null,
          location.speed || null,
          location.heading || null
        ]
      );
      return true;
    } catch (error) {
      console.error('Error updating driver location:', error);
      return false;
    } finally {
      connection.release();
    }
  }
  static async getLocationHistory(driverId: string, limit: number = 100): Promise<DriverLocation[]> {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        `SELECT * FROM driver_locations 
         WHERE driver_id = ? 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        [driverId, limit]
      );
      return Array.isArray(rows) ? rows as DriverLocation[] : [];
    } catch (error) {
      console.error('Error getting driver location history:', error);
      return [];
    } finally {
      connection.release();
    }
  }
}
