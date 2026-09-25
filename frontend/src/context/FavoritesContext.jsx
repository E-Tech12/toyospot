import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { favoriteApi } from '../lib/endpoints'
import { useAuth } from './AuthContext'

const FavoritesContext = createContext(null)

export function FavoritesProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [favorites, setFavorites] = useState([]) // full Food objects from the API
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setFavorites([])
      setFavoriteIds(new Set())
      return
    }
    setIsLoading(true)
    try {
      const foods = await favoriteApi.list()
      setFavorites(foods)
      setFavoriteIds(new Set(foods.map((f) => f.id)))
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggleFavorite = useCallback(
    async (food) => {
      if (!isAuthenticated) return
      const isFav = favoriteIds.has(food.id)
      // optimistic update
      setFavoriteIds((prev) => {
        const next = new Set(prev)
        if (isFav) next.delete(food.id)
        else next.add(food.id)
        return next
      })
      try {
        if (isFav) {
          await favoriteApi.remove(food.id)
          setFavorites((prev) => prev.filter((f) => f.id !== food.id))
        } else {
          await favoriteApi.add(food.id)
          setFavorites((prev) => [...prev, food])
        }
      } catch {
        // roll back on failure
        refresh()
      }
    },
    [favoriteIds, isAuthenticated, refresh]
  )

  return (
    <FavoritesContext.Provider value={{ favorites, favoriteIds, isLoading, toggleFavorite, refresh }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
