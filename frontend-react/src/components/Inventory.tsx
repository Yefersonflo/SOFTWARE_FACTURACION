import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, TextField, Typography } from '@mui/material'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

type Product = { id: number; name: string; barcode: string; sale_price: number; stock: number }

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([])
  const [editing, setEditing] = useState<Product | null>(null)

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/v1/products`)
      setProducts(res.data)
    } catch (e) { setProducts([]) }
  }

  const openEdit = (p: Product) => setEditing(p)
  const closeEdit = () => setEditing(null)

  const save = async () => {
    if (!editing) return
    try {
      await axios.put(`${API_BASE}/api/v1/products/${editing.id}`, {
        name: editing.name,
        barcode: editing.barcode,
        purchase_price: 0,
        sale_price: editing.sale_price,
        stock: editing.stock,
        min_stock: 5,
      })
      alert('Producto actualizado')
      closeEdit()
      fetchProducts()
    } catch (e) { alert('Error al guardar') }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Inventario</Typography>
      <List>
        {products.map((p) => (
          <ListItem key={p.id} secondaryAction={<Button onClick={() => openEdit(p)}>Editar</Button>}>
            <ListItemText primary={p.name} secondary={`Precio: ${p.sale_price} — Stock: ${p.stock}`} />
          </ListItem>
        ))}
      </List>

      <Dialog open={!!editing} onClose={closeEdit}>
        <DialogTitle>Editar producto</DialogTitle>
        <DialogContent>
          {editing && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: 400, mt: 1 }}>
              <TextField label="Nombre" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <TextField label="Código" value={editing.barcode} onChange={(e) => setEditing({ ...editing, barcode: e.target.value })} />
              <TextField type="number" label="Precio" value={editing.sale_price} onChange={(e) => setEditing({ ...editing, sale_price: Number(e.target.value) })} />
              <TextField type="number" label="Stock" value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: Number(e.target.value) })} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeEdit}>Cancelar</Button>
          <Button variant="contained" onClick={save}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
