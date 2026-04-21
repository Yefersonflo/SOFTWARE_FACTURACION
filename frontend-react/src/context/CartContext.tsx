import React, { createContext, useContext, useState, ReactNode } from 'react'

export type CartItem = {
  product_id: number
  name: string
  price: number
  quantity: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: number) => void
  restoreLastRemoved: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [lastRemoved, setLastRemoved] = useState<{ item: CartItem; index: number } | null>(null)

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.product_id === item.product_id)
      if (existing) {
        return prev.map((p) => (p.product_id === item.product_id ? { ...p, quantity: p.quantity + item.quantity } : p))
      }
      return [...prev, item]
    })
  }

  const removeItem = (productId: number) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.product_id === productId)
      if (idx === -1) return prev
      const item = prev[idx]
      setLastRemoved({ item, index: idx })
      return prev.filter((p) => p.product_id !== productId)
    })
  }

  const restoreLastRemoved = () => {
    if (!lastRemoved) return
    setItems((prev) => {
      const copy = [...prev]
      copy.splice(lastRemoved.index, 0, lastRemoved.item)
      return copy
    })
    setLastRemoved(null)
  }

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, restoreLastRemoved }}>
      {children}
    </CartContext.Provider>
  )
}
