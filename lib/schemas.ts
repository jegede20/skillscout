import { z } from 'zod';

export const difficultySchema = z.enum(['beginner', 'intermediate', 'advanced']);
export const formatSchema = z.enum(['video', 'text', 'interactive', 'podcast', 'course', 'book']);
export const durationSchema = z.enum(['short', 'medium', 'long']);

export const searchBodySchema = z.object({
  query: z.string().trim().min(2, 'Tell us a skill (at least 2 characters).').max(200),
  level: difficultySchema.optional(),
  filters: z
    .object({
      difficulty: difficultySchema.optional(),
      format: formatSchema.optional(),
      duration: durationSchema.optional(),
    })
    .optional(),
});

export const swapBodySchema = z.object({
  resourceId: z.string().uuid(),
  skillTags: z.array(z.string().max(60)).max(20),
});

export const recommendBodySchema = z.object({
  userId: z.string().max(64).optional(),
  goal: z.string().max(200).optional(),
  interests: z.array(z.string().max(60)).max(18).default([]),
  skills: z.array(z.string().max(60)).max(20).default([]),
});

export const feedbackBodySchema = z.object({
  roadmapId: z.string().min(4).max(128),
  rating: z.enum(['up', 'down']),
  comment: z.string().max(1000).optional(),
});

export const signInSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
});

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(80),
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.').max(72),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(80),
  email: z.string().trim().email('Enter a valid email address.'),
  message: z.string().trim().min(10, 'Tell us a little more (10+ characters).').max(2000),
});
