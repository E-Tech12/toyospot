import { createContext, useContext, useEffect, useState } from 'react'
import { catalogApi } from '../lib/endpoints'

const CategoriesContext = createContext(null)

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    catalogApi
      .listCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setIsLoading(false))
  }, [])

  return <CategoriesContext.Provider value={{ categories, isLoading }}>{children}</CategoriesContext.Provider>
}

export function useCategories() {
  const ctx = useContext(CategoriesContext)
  if (!ctx) throw new Error('useCategories must be used within CategoriesProvider')
  return ctx
}
