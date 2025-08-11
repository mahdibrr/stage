import { Router, Response } from 'express';
import { DeliveryModel, CreateDeliveryData } from '../models/Delivery';
import { AuthenticatedRequest } from '../middleware/auth';
import { deliverySchema } from '../validation/schemas';
const router = Router();
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;
    const priority = req.query.priority as string;
    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (req.user!.role === 'driver') {
      filters.driver_id = req.user!.userId;
    } else if (req.user!.role === 'customer') {
      filters.customer_id = req.user!.userId;
    }
    const result = await DeliveryModel.getAll(page, limit, filters);
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
    console.error('Error getting deliveries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get deliveries'
    });
  }
});
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const delivery = await DeliveryModel.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found'
      });
    }
    if (req.user!.role === 'customer' && delivery.customer_id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    if (req.user!.role === 'driver' && delivery.driver_id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    res.json({
      success: true,
      data: delivery
    });
  } catch (error) {
    console.error('Error getting delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get delivery'
    });
  }
});
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error, value } = deliverySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }
    const deliveryData: CreateDeliveryData = {
      ...value,
      customer_id: req.user!.role === 'customer' ? req.user!.userId : value.customer_id
    };
    const delivery = await DeliveryModel.create(deliveryData);
    if (!delivery) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create delivery'
      });
    }
    res.status(201).json({
      success: true,
      message: 'Delivery created successfully',
      data: delivery
    });
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create delivery'
    });
  }
});
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role === 'customer') {
      return res.status(403).json({
        success: false,
        error: 'Customers cannot update deliveries'
      });
    }
    const delivery = await DeliveryModel.update(req.params.id, req.body);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found'
      });
    }
    res.json({
      success: true,
      message: 'Delivery updated successfully',
      data: delivery
    });
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update delivery'
    });
  }
});
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user!.role !== 'admin' && req.user!.role !== 'dispatcher') {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    const success = await DeliveryModel.delete(req.params.id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found'
      });
    }
    res.json({
      success: true,
      message: 'Delivery cancelled successfully'
    });
  } catch (error) {
    console.error('Error deleting delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete delivery'
    });
  }
});
router.put('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }
    if (req.user!.role === 'customer') {
      return res.status(403).json({
        success: false,
        error: 'Customers cannot update delivery status'
      });
    }
    const delivery = await DeliveryModel.update(req.params.id, { status });
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found'
      });
    }
    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery
    });
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update delivery status'
    });
  }
});
router.get('/:id/tracking', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const delivery = await DeliveryModel.findById(req.params.id);
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found'
      });
    }
    if (req.user!.role === 'customer' && delivery.customer_id !== req.user!.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }
    const trackingData = await DeliveryModel.getTracking(req.params.id);
    res.json({
      success: true,
      data: trackingData
    });
  } catch (error) {
    console.error('Error getting tracking data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get tracking data'
    });
  }
});
router.put('/:id/assign', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { driver_id } = req.body;
    if (!driver_id) {
      return res.status(400).json({
        success: false,
        error: 'Driver ID is required'
      });
    }
    if (req.user!.role !== 'admin' && req.user!.role !== 'dispatcher') {
      return res.status(403).json({
        success: false,
        error: 'Only admins and dispatchers can assign drivers'
      });
    }
    const delivery = await DeliveryModel.update(req.params.id, { 
      driver_id, 
      status: 'assigned' 
    });
    if (!delivery) {
      return res.status(404).json({
        success: false,
        error: 'Delivery not found'
      });
    }
    res.json({
      success: true,
      message: 'Driver assigned successfully',
      data: delivery
    });
  } catch (error) {
    console.error('Error assigning driver:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign driver'
    });
  }
});
export { router as deliveryRoutes };
