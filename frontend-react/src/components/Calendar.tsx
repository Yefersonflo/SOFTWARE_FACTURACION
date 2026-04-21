import React, { useEffect, useState } from 'react'
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, Paper, TextField, Typography } from '@mui/material'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export default function CalendarView() {
  const [current, setCurrent] = useState(new Date())
  const [days, setDays] = useState<number[]>([])
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    build()
  }, [current])

  const build = () => {
    const first = startOfMonth(current)
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
    setDays(Array.from({ length: daysInMonth }, (_, i) => i + 1))
  }

  const handleDayClick = (day: number) => {
    const clicked = new Date(current.getFullYear(), current.getMonth(), day)
    const today = new Date(); today.setHours(0,0,0,0)
    if (clicked < today) return // disallow past dates
    setSelectedDate(clicked.toISOString().slice(0,10))
    setOpen(true)
  }

  const handleSave = async () => {
    try {
      await axios.post(`${API_BASE}/api/v1/events`, { title, description, date: selectedDate })
      setOpen(false)
      setTitle('')
      setDescription('')
      alert('Nota agregada')
    } catch (e) {
      alert('Error al guardar')
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Calendario - Agregar nota</Typography>
      <Grid container spacing={1}>
        {days.map((d) => {
          const dateObj = new Date(current.getFullYear(), current.getMonth(), d)
          const isPast = dateObj < new Date(new Date().setHours(0,0,0,0))
          return (
            <Grid item key={d} xs={2}>
              <Paper elevation={1} sx={{ p: 2, cursor: isPast ? 'not-allowed' : 'pointer', opacity: isPast ? 0.5 : 1 }} onClick={() => !isPast && handleDayClick(d)}>
                <Typography>{d}</Typography>
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Agregar nota para {selectedDate}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Título" value={title} onChange={(e) => setTitle(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={4} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
