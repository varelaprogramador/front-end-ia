import { API_BASE_URL, ApiResponse } from "./api-config"

export interface ClerkUser {
  id: string;
  username?: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: number;
  updatedAt: number;
  publicMetadata: Record<string, any>;
  privateMetadata: Record<string, any>;
  banned: boolean;
  locked: boolean;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verification?: {
      status: string;
    };
  }>;
  primaryEmailAddressId: string | null;
}

export interface InviteUserRequest {
  emailAddress: string;
  publicMetadata?: Record<string, any>;
  redirectUrl?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  publicMetadata?: Record<string, any>;
  privateMetadata?: Record<string, any>;
}

export interface UserListResponse {
  success: boolean;
  data: ClerkUser[];
  total: number;
  page: number;
  limit: number;
}

export interface UserResponse {
  success: boolean;
  data: ClerkUser;
  message?: string;
}

export interface InvitationResponse {
  success: boolean;
  data: {
    id: string;
    emailAddress: string;
    status: string;
    createdAt: number;
  };
  message?: string;
}

class UsersService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/users`;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async listUsers(
    page = 1,
    limit = 50,
    query?: string
  ): Promise<UserListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (query) {
      params.append("query", query);
    }

    return this.makeRequest<UserListResponse>(`?${params.toString()}`);
  }

  async getUser(userId: string): Promise<UserResponse> {
    return this.makeRequest<UserResponse>(`/${userId}`);
  }

  async inviteUser(data: InviteUserRequest): Promise<InvitationResponse> {
    return this.makeRequest<InvitationResponse>("/invite", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateUser(
    userId: string,
    data: UpdateUserRequest
  ): Promise<UserResponse> {
    return this.makeRequest<UserResponse>(`/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deleteUser(
    userId: string
  ): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest<{ success: boolean; message?: string }>(
      `/${userId}`,
      {
        method: "DELETE",
      }
    );
  }

  async banUser(userId: string): Promise<UserResponse> {
    return this.makeRequest<UserResponse>(`/${userId}/ban`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async unbanUser(userId: string): Promise<UserResponse> {
    return this.makeRequest<UserResponse>(`/${userId}/unban`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async updateMetadata(
    userId: string,
    type: "public" | "private",
    metadata: Record<string, any>
  ): Promise<UserResponse> {
    return this.makeRequest<UserResponse>(`/${userId}/metadata/${type}`, {
      method: "PATCH",
      body: JSON.stringify({ metadata }),
    });
  }
}

export const usersService = new UsersService();
