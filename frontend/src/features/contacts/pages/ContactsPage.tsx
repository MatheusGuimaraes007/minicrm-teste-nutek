import { Link } from "react-router-dom";
import { Layout } from "@/shared/components/Layout";
import { useContacts } from "../hooks/useContacts";
import { useState } from "react";

export function ContactsPage() {
  const { contacts, isLoading, error, deleteContact } = useContacts();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este contato?")) return;
    setDeletingId(id);
    try {
      await deleteContact(id);
    } catch {
      alert("Erro ao excluir contato");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Contatos</h1>
        <Link
          to="/contacts/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          + Novo Contato
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-gray-500">Carregando contatos...</p>
      ) : contacts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">Nenhum contato cadastrado</p>
          <Link to="/contacts/new" className="text-blue-600 hover:underline">
            Criar primeiro contato
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Telefone
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {contact.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {contact.email || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {contact.phone || "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(contact.id)}
                      disabled={deletingId === contact.id}
                      className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {deletingId === contact.id ? "Excluindo..." : "Excluir"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
}
