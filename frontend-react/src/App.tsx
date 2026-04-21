import React from 'react'
import { Container, CssBaseline, Box, AppBar, Toolbar, Typography } from '@mui/material'
import { CartProvider } from './context/CartContext'
import ProductList from './components/ProductList'
import Cart from './components/Cart'
import './App.css'

function App() {
  return (
    <CartProvider>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Sistema de Facturación — UI Moderna</Typography>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }}>
        <Box display="flex" alignItems="flex-start">
          <ProductList />
          <Cart />
        </Box>
      </Container>
    </CartProvider>
  )
}

export default App
