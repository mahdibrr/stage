import Joi from 'joi';
export const registerSchema = Joi.object({
  username: Joi.string()
    .min(1)
    .max(30)
    .required()
    .messages({
      'string.min': 'Username is required',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required'
    }),
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Password is required',
      'any.required': 'Password is required'
    }),
  full_name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name must not exceed 100 characters',
      'any.required': 'Full name is required'
    }),
  role: Joi.string()
    .valid('admin', 'dispatcher', 'driver', 'customer')
    .default('customer')
    .messages({
      'any.only': 'Role must be one of: admin, dispatcher, driver, customer'
    }),
  department: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Department must not exceed 50 characters'
    }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    })
});
export const loginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});
export const updateUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  full_name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Full name must be at least 2 characters long',
      'string.max': 'Full name must not exceed 100 characters'
    }),
  role: Joi.string()
    .valid('admin', 'dispatcher', 'driver', 'customer')
    .optional()
    .messages({
      'any.only': 'Role must be one of: admin, dispatcher, driver, customer'
    }),
  department: Joi.string()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Department must not exceed 50 characters'
    }),
  phone: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .optional()
    .allow('')
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  password: Joi.string()
    .min(6)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .optional()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
    })
});
export const deliverySchema = Joi.object({
  customer_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Customer ID must be a valid UUID',
      'any.required': 'Customer ID is required'
    }),
  pickup_address: Joi.string()
    .min(5)
    .max(255)
    .required()
    .messages({
      'string.min': 'Pickup address must be at least 5 characters long',
      'string.max': 'Pickup address must not exceed 255 characters',
      'any.required': 'Pickup address is required'
    }),
  delivery_address: Joi.string()
    .min(5)
    .max(255)
    .required()
    .messages({
      'string.min': 'Delivery address must be at least 5 characters long',
      'string.max': 'Delivery address must not exceed 255 characters',
      'any.required': 'Delivery address is required'
    }),
  pickup_lat: Joi.number()
    .min(-90)
    .max(90)
    .optional()
    .messages({
      'number.min': 'Pickup latitude must be between -90 and 90',
      'number.max': 'Pickup latitude must be between -90 and 90'
    }),
  pickup_lng: Joi.number()
    .min(-180)
    .max(180)
    .optional()
    .messages({
      'number.min': 'Pickup longitude must be between -180 and 180',
      'number.max': 'Pickup longitude must be between -180 and 180'
    }),
  delivery_lat: Joi.number()
    .min(-90)
    .max(90)
    .optional()
    .messages({
      'number.min': 'Delivery latitude must be between -90 and 90',
      'number.max': 'Delivery latitude must be between -90 and 90'
    }),
  delivery_lng: Joi.number()
    .min(-180)
    .max(180)
    .optional()
    .messages({
      'number.min': 'Delivery longitude must be between -180 and 180',
      'number.max': 'Delivery longitude must be between -180 and 180'
    }),
  scheduled_time: Joi.date()
    .iso()
    .min('now')
    .required()
    .messages({
      'date.iso': 'Scheduled time must be a valid ISO date',
      'date.min': 'Scheduled time must be in the future',
      'any.required': 'Scheduled time is required'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high')
    .default('medium')
    .messages({
      'any.only': 'Priority must be one of: low, medium, high'
    }),
  notes: Joi.string()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Notes must not exceed 1000 characters'
    }),
  total_amount: Joi.number()
    .positive()
    .precision(2)
    .optional()
    .messages({
      'number.positive': 'Total amount must be a positive number',
      'number.precision': 'Total amount must have at most 2 decimal places'
    }),
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().min(1).max(100).required(),
        quantity: Joi.number().integer().positive().required(),
        weight: Joi.number().positive().optional(),
        length: Joi.number().positive().optional(),
        width: Joi.number().positive().optional(),
        height: Joi.number().positive().optional(),
        price: Joi.number().positive().precision(2).optional()
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'Items are required'
    })
});
export const messageSchema = Joi.object({
  conversation_id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'Conversation ID must be a valid UUID',
      'any.required': 'Conversation ID is required'
    }),
  content: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Message content cannot be empty',
      'string.max': 'Message content must not exceed 2000 characters',
      'any.required': 'Message content is required'
    }),
  type: Joi.string()
    .valid('text', 'image', 'file', 'location')
    .default('text')
    .messages({
      'any.only': 'Message type must be one of: text, image, file, location'
    }),
  metadata: Joi.object()
    .optional()
});
export const locationSchema = Joi.object({
  latitude: Joi.number()
    .min(-90)
    .max(90)
    .required()
    .messages({
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required'
    }),
  longitude: Joi.number()
    .min(-180)
    .max(180)
    .required()
    .messages({
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required'
    }),
  accuracy: Joi.number()
    .positive()
    .optional()
    .messages({
      'number.positive': 'Accuracy must be a positive number'
    }),
  speed: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Speed cannot be negative'
    }),
  heading: Joi.number()
    .min(0)
    .max(360)
    .optional()
    .messages({
      'number.min': 'Heading must be between 0 and 360',
      'number.max': 'Heading must be between 0 and 360'
    })
});
