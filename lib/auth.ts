export interface User {
  id: string
  email: string
  name: string
}

// Mock user for demonstration
const MOCK_USER: User = {
  id: "1",
  email: "admin@empresa.com",
  name: "Administrador",
}

// Mock authentication functions
export const login = async (email: string, password: string): Promise<User | null> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Simple mock validation
  if (email === "admin@empresa.com" && password === "admin123") {
    localStorage.setItem("user", JSON.stringify(MOCK_USER))
    return MOCK_USER
  }

  return null
}

export const logout = () => {
  localStorage.removeItem("user")
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null

  const userStr = localStorage.getItem("user")
  if (!userStr) return null

  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null
}
