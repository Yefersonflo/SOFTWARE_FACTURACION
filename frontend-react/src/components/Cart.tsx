import React, { useState } from 'react'
import { useCart } from '../context/CartContext'
import { Box, Button, IconButton, List, ListItem, ListItemText, Snackbar, Typography } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function Cart() {
  const { items, removeItem, restoreLastRemoved } = useCart()
  const [snackOpen, setSnackOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRemove = (id: number) => {
    removeItem(id)
    setSnackOpen(true)
  }

  const handleUndo = () => {
    restoreLastRemoved()
    setSnackOpen(false)
  }

  const total = items.reduce((s, it) => s + it.price * it.quantity, 0)

  const handleCheckout = async () => {
    if (items.length === 0) return alert('Carrito vacío')
    setLoading(true)
    try {
      const payload = { items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity, price: it.price })), total }
      const res = await axios.post(`${API_BASE}/api/v1/sales`, payload)
      // on success, open printable receipt
      openReceiptWindow(res.data.id || new Date().getTime(), items, total)
      alert('Venta registrada y lista para imprimir')
    } catch (e) {
      alert('Error al procesar la venta')
    } finally { setLoading(false) }
  }

  const openReceiptWindow = (saleId: number | string, itemsList: any[], totalAmount: number) => {
    const win = window.open('', '_blank', 'width=400,height=800')
    if (!win) return
    const styles = `
      <style>
        body{ font-family: monospace; font-size:12px; }
        .receipt{ width: 320px; margin: 0 auto; }
        .center{ text-align:center }
        .items{ width:100%; border-top:1px dashed #000; border-bottom:1px dashed #000 }
        .row{ display:flex; justify-content:space-between }
        @media print { @page { margin: 0; size: 80mm auto } }
      </style>
    `
    const html = `
      <html><head><title>Factura ${saleId}</title>${styles}</head>
      <body>
        <div class="receipt">
          <div class="center">
            <h3>SUPERMERCADO</h3>
            <div>Dirección ejemplo</div>
            <div>Tel: 000-000-000</div>
            <hr />
          </div>
          <div>Factura ID: ${saleId}</div>
          <div>Fecha: ${new Date().toLocaleString()}</div>
          <div class="items">
            ${itemsList.map(i => `<div class="row"><div>${i.name} x${i.quantity}</div><div>$${(i.price*i.quantity).toFixed(2)}</div></div>`).join('')}
          </div>
          <div class="row"><strong>Total</strong><strong>$${totalAmount.toFixed(2)}</strong></div>
          <div class="center"><p>Gracias por su compra</p></div>
        </div>
      </body></html>
    `
    win.document.write(html)
    win.document.close()
    // delay to ensure render
    setTimeout(() => { win.focus(); win.print(); }, 500)
  }

  return (
    <Box sx={{ width: 360, ml: 2 }}>
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

      <Typography variant="subtitle1">Total: ${total.toFixed(2)}</Typography>
      <Button variant="contained" onClick={handleCheckout} disabled={loading} sx={{ mt: 2 }}>Finalizar Venta e Imprimir</Button>

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
