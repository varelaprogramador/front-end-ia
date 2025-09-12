import { useUser } from '@clerk/nextjs'

/**
 * Hook customizado para obter o userId do Clerk
 * Retorna o userId do usuário logado ou null se não estiver logado
 */
export function useUserId(): string | null {
  const { user, isLoaded } = useUser()
  
  // Aguarda o Clerk carregar antes de retornar
  if (!isLoaded) {
    return null
  }
  
  return user?.id || null
}

/**
 * Função para obter o userId de forma síncrona (para uso fora de componentes React)
 * Deve ser usado apenas quando você tem certeza de que o usuário está logado
 */
export function getCurrentUserId(): string {
  // Esta função deve ser usada apenas em contextos onde o usuário já está logado
  // Para uma implementação mais robusta, você pode acessar o token do Clerk
  const userId = typeof window !== 'undefined' ? localStorage.getItem('clerk-user-id') : null
  return userId || 'user_temp_fallback'
}