import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000), // default ke 3000 kalau tidak ada
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  DATABASE_URL: Joi.string().uri().required(), // wajib, harus URI valid
  JWT_SECRET: Joi.string().min(32).required(), // wajib, minimal 32 karakter
  JWT_EXPIRES_IN: Joi.string().default('1h'), // default 1   
  LOG_LEVEL: Joi.string().valid('debug', 'log', 'warn', 'error').default('log'),
});