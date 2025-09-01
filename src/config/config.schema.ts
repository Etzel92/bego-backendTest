import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  MONGODB_URI: Joi.string()
    .uri({ scheme: ['mongodb'] })
    .required(),
});
