import React, { useState } from 'react'
import { Container, CssBaseline, Box, AppBar, Toolbar, Typography, Button, Stack } from '@mui/material'
import { CartProvider } from './context/CartContext'
import ProductList from './components/ProductList'
import Cart from './components/Cart'
import Reports from './components/Reports'
import CalendarView from './components/Calendar'
import Expenses from './components/Expenses'
import Inventory from './components/Inventory'
import './App.css'

type View = 'pos' | 'reports' | 'calendar' | 'expenses' | 'inventory'

function App() {
  const [view, setView] = useState<View>('pos')

  return (
    <CartProvider>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flex: 1 }}>Sistema de Facturación — UI Moderna</Typography>
          <Stack direction="row" spacing={1}>
            <Button color="inherit" onClick={() => setView('pos')}>Facturación</Button>
            <Button color="inherit" onClick={() => setView('reports')}>Reportes</Button>
            <Button color="inherit" onClick={() => setView('calendar')}>Calendario</Button>
            <Button color="inherit" onClick={() => setView('expenses')}>Gastos</Button>
            <Button color="inherit" onClick={() => setView('inventory')}>Inventario</Button>
          </Stack>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        {view === 'pos' && (
          <Box display="flex" alignItems="flex-start">
            <ProductList />
            <Cart />
          </Box>
        )}
        {view === 'reports' && <Reports />}
        {view === 'calendar' && <CalendarView />}
        {view === 'expenses' && <Expenses />}
        {view === 'inventory' && <Inventory />}
      </Container>
    </CartProvider>
  )
}

export default App
