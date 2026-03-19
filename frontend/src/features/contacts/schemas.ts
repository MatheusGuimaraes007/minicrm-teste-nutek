import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido").or(z.literal("")).optional(),
  phone: z.string().optional(),
});

export type CreateContactFormData = z.infer<typeof createContactSchema>;
