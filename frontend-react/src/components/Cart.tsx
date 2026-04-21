import React, { useState } from 'react'
import { useCart } from '../context/CartContext'
import { Box, Button, IconButton, List, ListItem, ListItemText, Snackbar, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'

export default function Cart() {
  const { items, removeItem, restoreLastRemoved } = useCart()
  const [snackOpen, setSnackOpen] = useState(false)

  const handleRemove = (id: number) => {
    removeItem(id)
    setSnackOpen(true)
  }

  const handleUndo = () => {
    restoreLastRemoved()
    setSnackOpen(false)
  }

  return (
    <Box sx={{ width: 320, ml: 2 }}>
      <Typography variant="h6">Carrito</Typography>
      <List>
        {items.length === 0 && <Typography variant="body2">Carrito vacío</Typography>}
        {items.map((it) => (
          <ListItem key={it.product_id} secondaryAction={
            <IconButton edge="end" aria-label="delete" onClick={() => handleRemove(it.product_id)}>
              <DeleteIcon />
            </IconButton>
          }>
            <ListItemText primary={`${it.name} x${it.quantity}`} secondary={`$${(it.price * it.quantity).toFixed(2)}`} />
          </ListItem>
        ))}
      </List>

      <Snackbar
        open={snackOpen}
        message="Artículo eliminado"
        action={<Button color="inherit" size="small" onClick={handleUndo}>Deshacer</Button>}
        onClose={() => setSnackOpen(false)}
        autoHideDuration={6000}
      />
    </Box>
  )
}
