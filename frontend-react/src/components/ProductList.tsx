import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { Box, Button, Card, CardActions, CardContent, Grid, Typography } from '@mui/material'

type Product = {
  id: number
  name: string
  barcode: string
  sale_price: number
  stock: number
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const { addItem } = useCart()

  useEffect(() => {
    axios.get(`${API_BASE}/api/v1/products`).then((res) => setProducts(res.data)).catch(() => setProducts([]))
  }, [])

  return (
    <Box sx={{ flex: 1 }}>
      <Typography variant="h5" gutterBottom>Productos</Typography>
      <Grid container spacing={2}>
        {products.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{p.name}</Typography>
                <Typography variant="body2">Código: {p.barcode}</Typography>
                <Typography variant="subtitle1">${p.sale_price.toFixed(2)}</Typography>
                <Typography variant="caption">Stock: {p.stock}</Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => addItem({ product_id: p.id, name: p.name, price: p.sale_price, quantity: 1 })}>
                  Añadir
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
