import { z } from "zod";

// ─── Auth ────────────────────────────────────────────────────────────────────

export const registerSchema = z
  .object({
    employee_code: z
      .string()
      .min(1, "Employee ID is required")
      .max(50, "Max 50 characters"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const completeProfileSchema = z.object({
  employee_code: z
    .string()
    .min(1, "Employee ID is required")
    .max(50, "Max 50 characters"),
  full_name: z.string().min(2, "Full name is required"),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

// ─── Leave ───────────────────────────────────────────────────────────────────

export const leaveRequestSchema = z
  .object({
    leave_type: z.enum(["paid", "sick", "unpaid"], {
      message: "Select a leave type",
    }),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
    remarks: z.string().max(500, "Max 500 characters").optional(),
  })
  .refine((d) => new Date(d.end_date) >= new Date(d.start_date), {
    message: "End date must be on or after start date",
    path: ["end_date"],
  });

export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
