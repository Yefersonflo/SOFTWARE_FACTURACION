import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Box, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function Reports() {
  const [period, setPeriod] = useState('daily')
  const [reportType, setReportType] = useState('mixed')
  const [limit, setLimit] = useState(30)
  const [series, setSeries] = useState<any[]>([])

  useEffect(() => {
    fetchReport()
  }, [period, reportType, limit])

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/v1/reports/summary`, { params: { period, report_type: reportType, limit } })
      setSeries(res.data.series || [])
    } catch (e) {
      setSeries([])
    }
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Reportes</Typography>

      <Box display="flex" gap={2} mb={2}>
        <FormControl>
          <InputLabel id="per-label">Período</InputLabel>
          <Select labelId="per-label" value={period} label="Período" onChange={(e: SelectChangeEvent) => setPeriod(e.target.value)}>
            <MenuItem value="daily">Diario</MenuItem>
            <MenuItem value="weekly">Semanal</MenuItem>
            <MenuItem value="monthly">Mensual</MenuItem>
            <MenuItem value="quarterly">Trimestral</MenuItem>
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel id="type-label">Tipo</InputLabel>
          <Select labelId="type-label" value={reportType} label="Tipo" onChange={(e: SelectChangeEvent) => setReportType(e.target.value)}>
            <MenuItem value="sales">Ventas</MenuItem>
            <MenuItem value="expenses">Gastos</MenuItem>
            <MenuItem value="mixed">Mixto</MenuItem>
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel id="limit-label">Máx</InputLabel>
          <Select labelId="limit-label" value={String(limit)} label="Máx" onChange={(e) => setLimit(Number(e.target.value))}>
            <MenuItem value={7}>7</MenuItem>
            <MenuItem value={30}>30</MenuItem>
            <MenuItem value={90}>90</MenuItem>
          </Select>
        </FormControl>

        <Button variant="contained" onClick={fetchReport}>Actualizar</Button>
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Periodo</TableCell>
            <TableCell>Ventas</TableCell>
            <TableCell>Ingresos</TableCell>
            <TableCell>Gastos</TableCell>
            <TableCell>Neto</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {series.map((s) => (
            <TableRow key={s.label}>
              <TableCell>{s.label}</TableCell>
              <TableCell>{s.sales_count}</TableCell>
              <TableCell>{s.income_total}</TableCell>
              <TableCell>{s.expense_total}</TableCell>
              <TableCell>{s.net_total}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  )
}
