import { Router, Response } from 'express';
import { DriverModel } from '../models/Driver';
import { DeliveryModel } from '../models/Delivery';
import { AuthenticatedRequest } from '../middleware/auth';
const router = Router();
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const drivers = await DriverModel.getAll();
    res.json({
      success: true,
      data: drivers
    });
  } catch (error) {
    console.error('Error getting drivers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get drivers'
    });
  }
});
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const driver = await DriverModel.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({
        success: false,
        error: 'Driver not found'
      });
    }
    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    console.error('Error getting driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get driver'
    });
  }
});
router.put('/:id/location', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lat, lng, accuracy, speed, heading } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }
    if (req.user!.role === 'driver' && req.user!.userId !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Drivers can only update their own location'
      });
    }
    const success = await DriverModel.updateLocation(req.params.id, {
      lat,
      lng,
      accuracy,
      speed,
      heading
    });
    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update location'
      });
    }
    res.json({
      success: true,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update driver location'
    });
  }
});
router.get('/:id/deliveries', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role === 'driver' && req.user!.userId !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Drivers can only view their own deliveries'
      });
    }
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const result = await DeliveryModel.getAll(page, limit, { driver_id: req.params.id });
    res.json({
      success: true,
      data: result.deliveries,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting driver deliveries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get driver deliveries'
    });
  }
});
router.get('/:id/location-history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role === 'driver' && req.user!.userId !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    const limit = parseInt(req.query.limit as string) || 100;
    const locationHistory = await DriverModel.getLocationHistory(req.params.id, limit);
    res.json({
      success: true,
      data: locationHistory
    });
  } catch (error) {
    console.error('Error getting driver location history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get location history'
    });
  }
});
export { router as driverRoutes };
