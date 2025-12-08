import { API_BASE_URL, ApiResponse } from "./api-config";
import {
  Credential,
  CreateCredentialDto,
  UpdateCredentialDto,
  TestCredentialResponse,
} from "@/types/credential";

const API_URL = `${API_BASE_URL}/credentials`;

// GET /credentials - Listar todas as credenciais
export async function getCredentials(userId: string): Promise<Credential[]> {
  const response = await fetch(`${API_URL}?userId=${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar credenciais");
  }

  const result: ApiResponse<Credential[]> = await response.json();
  return result.data || [];
}

// GET /credentials/:id - Buscar credencial específica
export async function getCredential(id: string, userId?: string): Promise<Credential> {
  const url = userId ? `${API_URL}/${id}?userId=${userId}` : `${API_URL}/${id}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar credencial");
  }

  const result: ApiResponse<Credential> = await response.json();
  if (!result.data) {
    throw new Error("Credencial não encontrada");
  }
  return result.data;
}

// POST /credentials - Criar nova credencial
export async function createCredential(
  data: CreateCredentialDto & { userId: string }
): Promise<Credential> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao criar credencial");
  }

  const result: ApiResponse<Credential> = await response.json();
  if (!result.data) {
    throw new Error("Erro ao criar credencial");
  }
  return result.data;
}

// PUT /credentials/:id - Atualizar credencial
export async function updateCredential(
  id: string,
  data: UpdateCredentialDto & { userId?: string }
): Promise<Credential> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao atualizar credencial");
  }

  const result: ApiResponse<Credential> = await response.json();
  if (!result.data) {
    throw new Error("Erro ao atualizar credencial");
  }
  return result.data;
}

// DELETE /credentials/:id - Deletar credencial
export async function deleteCredential(id: string, userId?: string): Promise<void> {
  const url = userId ? `${API_URL}/${id}?userId=${userId}` : `${API_URL}/${id}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao deletar credencial");
  }
}

// POST /credentials/:id/test - Testar credencial
export async function testCredential(
  id: string,
  userId?: string
): Promise<TestCredentialResponse> {
  const response = await fetch(`${API_URL}/${id}/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao testar credencial");
  }

  const result: ApiResponse<TestCredentialResponse> = await response.json();
  if (!result.data) {
    throw new Error("Erro ao testar credencial");
  }
  return result.data;
}

// POST /credentials/:id/resend - Reenviar credencial para N8N
export async function resendCredential(id: string, userId?: string): Promise<any> {
  const response = await fetch(`${API_URL}/${id}/resend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || "Erro ao reenviar credencial");
  }

  return result;
}
