import Joi from 'joi';
export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(2).max(100).required(),
  role: Joi.string().valid('admin', 'dispatcher', 'driver', 'customer').default('customer'),
  department: Joi.string().max(50).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
});
export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});
export const deliverySchema = Joi.object({
  customer_id: Joi.string().uuid().required(),
  driver_id: Joi.string().uuid().optional(),
  pickup_address: Joi.string().required(),
  delivery_address: Joi.string().required(),
  pickup_lat: Joi.number().min(-90).max(90).optional(),
  pickup_lng: Joi.number().min(-180).max(180).optional(),
  delivery_lat: Joi.number().min(-90).max(90).optional(),
  delivery_lng: Joi.number().min(-180).max(180).optional(),
  scheduled_time: Joi.date().iso().required(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  notes: Joi.string().optional(),
  items: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    quantity: Joi.number().integer().min(1).required(),
    weight: Joi.number().min(0).optional(),
    length: Joi.number().min(0).optional(),
    width: Joi.number().min(0).optional(),
    height: Joi.number().min(0).optional(),
    price: Joi.number().min(0).optional()
  })).min(1).required()
});
export const messageSchema = Joi.object({
  content: Joi.string().required(),
  type: Joi.string().valid('text', 'image', 'file', 'location').default('text'),
  metadata: Joi.object().optional()
});
