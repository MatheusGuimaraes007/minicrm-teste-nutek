export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactData {
  name: string;
  email?: string;
  phone?: string;
}
