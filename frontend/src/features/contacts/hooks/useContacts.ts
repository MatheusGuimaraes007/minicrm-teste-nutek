import { useState, useEffect, useCallback } from "react";
import { api } from "@/shared/api/client";
import type { Contact, CreateContactData } from "../types";

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await api.get<Contact[]>("/contacts");
      setContacts(data);
    } catch {
      setError("Erro ao carregar contatos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createContact = useCallback(
    async (contactData: CreateContactData) => {
      await api.post("/contacts", contactData);
      await fetchContacts();
    },
    [fetchContacts]
  );

  const deleteContact = useCallback(
    async (id: string) => {
      await api.delete(`/contacts/${id}`);
      await fetchContacts();
    },
    [fetchContacts]
  );

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return {
    contacts,
    isLoading,
    error,
    createContact,
    deleteContact,
    refetch: fetchContacts,
  };
}
