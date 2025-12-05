import { z } from 'zod';

// Common validation schemas

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Password validation (min 8 chars, at least one letter and one number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Username validation
export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// Slug validation
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(100, 'Slug must be at most 100 characters')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens');

// URL validation
export const urlSchema = z.string().url('Invalid URL');

// Optional URL validation
export const optionalUrlSchema = z.string().url('Invalid URL').optional().or(z.literal(''));

// UUID validation
export const uuidSchema = z.string().uuid('Invalid UUID');

// Positive number validation
export const positiveNumberSchema = z.number().positive('Must be a positive number');

// Non-negative number validation
export const nonNegativeNumberSchema = z.number().nonnegative('Must be zero or positive');

// Price validation (in rubles, max 2 decimal places)
export const priceSchema = z
  .number()
  .nonnegative('Price cannot be negative')
  .multipleOf(0.01, 'Price can have at most 2 decimal places');

// Pagination validation
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Sort order validation
export const sortOrderSchema = z.enum(['asc', 'desc']).default('desc');

// Model type validation
export const modelTypeSchema = z.enum([
  'llm',
  'image',
  'audio',
  'video',
  'multimodal',
  'embedding',
  'code',
  'speech-to-text',
  'text-to-speech',
]);

// Pricing type validation
export const pricingTypeSchema = z.enum([
  'free',
  'freemium',
  'pay_per_use',
  'subscription',
  'custom',
]);

// User registration schema
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  username: usernameSchema.optional(),
});

// User login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Create AI model schema
export const createModelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  slug: slugSchema,
  type: modelTypeSchema,
  shortDescription: z.string().max(500, 'Short description is too long').optional(),
  description: z.string().optional(),
  baseUrl: urlSchema.optional(),
  pricingType: pricingTypeSchema.default('free'),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(10).optional(),
  organizationId: uuidSchema.optional(),
});

// Create pricing plan schema
export const createPricingPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  slug: slugSchema,
  description: z.string().optional(),
  price: priceSchema,
  currency: z.string().length(3).default('RUB'),
  billingPeriod: z.enum(['monthly', 'yearly', 'one_time']).default('monthly'),
  limits: z.object({
    requestsPerMonth: positiveNumberSchema.optional(),
    tokensPerMonth: positiveNumberSchema.optional(),
    concurrentRequests: positiveNumberSchema.optional(),
  }).optional(),
  features: z.array(z.string().max(200)).max(20).optional(),
  trialDays: nonNegativeNumberSchema.int().default(0),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
});

// Create endpoint schema
export const createEndpointSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  slug: slugSchema,
  description: z.string().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('POST'),
  path: z.string().min(1, 'Path is required'),
  pricePerRequest: priceSchema.optional(),
  pricePerToken: z.number().nonnegative().optional(),
  isActive: z.boolean().default(true),
});

// Create organization schema
export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  slug: slugSchema,
  description: z.string().optional(),
  website: optionalUrlSchema,
  email: emailSchema.optional(),
  supportEmail: emailSchema.optional(),
});

// Create API key schema
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  expiresAt: z.coerce.date().optional(),
  permissions: z.object({
    models: z.array(uuidSchema).optional(),
    endpoints: z.array(uuidSchema).optional(),
    ipWhitelist: z.array(z.string().ip()).optional(),
  }).optional(),
  rateLimits: z.object({
    requestsPerMinute: positiveNumberSchema.optional(),
    requestsPerDay: positiveNumberSchema.optional(),
  }).optional(),
});

// Payment schema
export const createPaymentSchema = z.object({
  amount: priceSchema.positive('Amount must be positive'),
  subscriptionId: uuidSchema.optional(),
  description: z.string().max(500).optional(),
  successUrl: urlSchema.optional(),
  failUrl: urlSchema.optional(),
});

// Export Zod for convenience
export { z };
