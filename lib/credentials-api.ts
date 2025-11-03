import { API_BASE_URL, ApiResponse } from "./api-config";
import {
  Credential,
  CreateCredentialDto,
  UpdateCredentialDto,
  TestCredentialResponse,
} from "@/types/credential";

const API_URL = `${API_BASE_URL}/credentials`;

// Helper function to get auth headers
async function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

// GET /credentials - Listar todas as credenciais
export async function getCredentials(): Promise<Credential[]> {
  const response = await fetch(API_URL, {
    method: "GET",
    headers: await getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Erro ao buscar credenciais");
  }

  const result: ApiResponse<Credential[]> = await response.json();
  return result.data || [];
}

// GET /credentials/:id - Buscar credencial específica
export async function getCredential(id: string): Promise<Credential> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "GET",
    headers: await getAuthHeaders(),
    credentials: "include",
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
  data: CreateCredentialDto
): Promise<Credential> {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: await getAuthHeaders(),
    credentials: "include",
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
  data: UpdateCredentialDto
): Promise<Credential> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    credentials: "include",
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
export async function deleteCredential(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Erro ao deletar credencial");
  }
}

// POST /credentials/:id/test - Testar credencial
export async function testCredential(
  id: string
): Promise<TestCredentialResponse> {
  const response = await fetch(`${API_URL}/${id}/test`, {
    method: "POST",
    headers: await getAuthHeaders(),
    credentials: "include",
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
