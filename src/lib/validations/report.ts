import { z } from 'zod'

export const reportSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  incident_date: z.string().min(1, 'Date is required'),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  address: z.string().optional(),
  landmark: z.string().optional(),
  is_anonymous: z.boolean().default(false),
  reporter_name: z.string().optional(),
  reporter_contact: z.string().optional(),
})

export type ReportValues = z.infer<typeof reportSchema>
