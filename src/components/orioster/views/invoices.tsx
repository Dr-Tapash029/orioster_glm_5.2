'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { GlassPanel, SectionHeader, DisclaimerChip } from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Receipt, Plus, Sparkles, Loader2, Trash2, Printer, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Invoice {
  id: string
  invoiceNo: string
  items: string
  subtotal: number
  tax: number
  total: number
  status: string
  createdAt: string
  patient: { id: string; fullName: string; localId: string }
}

interface Patient { id: string; fullName: string; localId: string }

const SERVICE_TEMPLATES = [
  { description: 'Consultation', unit_price: 500 },
  { description: 'Follow-up Consultation', unit_price: 300 },
  { description: 'Lab Test - CBC', unit_price: 400 },
  { description: 'Lab Test - Lipid Panel', unit_price: 800 },
  { description: 'Lab Test - LFT', unit_price: 900 },
  { description: 'Lab Test - RFT', unit_price: 850 },
  { description: 'X-Ray Chest', unit_price: 600 },
  { description: 'ECG', unit_price: 500 },
  { description: 'Ultrasound', unit_price: 1200 },
  { description: 'Wound Dressing', unit_price: 250 },
  { description: 'IV Fluids', unit_price: 350 },
  { description: 'Injection (per dose)', unit_price: 150 },
]

export function InvoicesView() {
  const { user, setActivePatient, setView } = useAppStore()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState('')
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unit_price: number }>>([
    { description: 'Consultation', quantity: 1, unit_price: 500 },
  ])
  const [generating, setGenerating] = useState(false)
  const [useAi, setUseAi] = useState(false)

  const fetchInvoices = () => {
    setLoading(true)
    fetch('/api/invoices')
      .then((r) => r.json())
      .then((d) => setInvoices(d.invoices ?? []))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchInvoices()
  }, [])

  useEffect(() => {
    if (open) {
      fetch('/api/patients?limit=200').then((r) => r.json()).then((d) => setPatients(d.patients ?? []))
    }
  }, [open])

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
  const tax = Math.round(subtotal * 0.05 * 100) / 100
  const total = subtotal + tax

  function addItem() {
    setItems([...items, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(idx: number) {
    setItems(items.filter((_, i) => i !== idx))
  }

  function updateItem(idx: number, field: 'description' | 'quantity' | 'unit_price', value: string | number) {
    setItems(items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)))
  }

  async function generateInvoice() {
    if (!selectedPatient) {
      toast.error('Select a patient')
      return
    }
    if (items.length === 0 || items.every((i) => !i.description)) {
      toast.error('Add at least one line item')
      return
    }

    setGenerating(true)
    try {
      let finalItems = items.filter((i) => i.description)

      if (useAi) {
        // AI-assisted invoice generation
        const summaryText = `Generate an itemized invoice for patient ${patients.find((p) => p.id === selectedPatient)?.fullName}. Requested services: ${finalItems.map((i) => `${i.description} x${i.quantity}`).join(', ')}.`
        try {
          const aiRes = await fetch('/api/orio-ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId: selectedPatient, task: 'INVOICE', customSummary: summaryText }),
          })
          const aiData = await aiRes.json()
          if (aiRes.ok && aiData.output?.line_items?.length) {
            finalItems = aiData.output.line_items.map((li: { description: string; quantity: number; unit_price: number }) => ({
              description: li.description,
              quantity: li.quantity,
              unit_price: li.unit_price,
            }))
          }
        } catch {
          toast.warning('AI generation unavailable, using manual items')
        }
      }

      const sub = finalItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)
      const tx = Math.round(sub * 0.05 * 100) / 100

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatient,
          items: finalItems,
          subtotal: sub,
          tax: tx,
          total: sub + tx,
          createdBy: user?.id,
        }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Invoice generated')
      setOpen(false)
      setItems([{ description: 'Consultation', quantity: 1, unit_price: 500 }])
      setUseAi(false)
      fetchInvoices()
    } catch {
      toast.error('Failed to generate invoice')
    } finally {
      setGenerating(false)
    }
  }

  const totalRevenue = invoices.reduce((s, i) => s + i.total, 0)

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Invoices"
        subtitle={`${invoices.length} invoices · Total revenue: ৳${totalRevenue.toLocaleString()}`}
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="fx-btn-border-trace gap-2">
                <Plus className="h-4 w-4" />
                New Invoice
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generate Invoice</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Patient</Label>
                  <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.fullName} ({p.localId})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium text-slate-400">Line Items</p>
                    <Button size="sm" variant="ghost" onClick={addItem} className="h-7 text-xs text-slate-300 hover:text-slate-100">
                      <Plus className="h-3 w-3" /> Add
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_70px_90px_32px] items-center gap-1.5">
                        <Select
                          value={item.description}
                          onValueChange={(v) => {
                            const tmpl = SERVICE_TEMPLATES.find((t) => t.description === v)
                            updateItem(idx, 'description', v)
                            if (tmpl) updateItem(idx, 'unit_price', tmpl.unit_price)
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Service" />
                          </SelectTrigger>
                          <SelectContent>
                            {SERVICE_TEMPLATES.map((t) => (
                              <SelectItem key={t.description} value={t.description} className="text-xs">
                                {t.description} (৳{t.unit_price})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                          className="h-8 text-xs"
                        />
                        <Input
                          type="number"
                          value={item.unit_price}
                          onChange={(e) => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="h-8 text-xs"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(idx)}
                          className="h-8 w-8 text-red-400 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 space-y-1 border-t border-white/10 pt-2 text-xs">
                    <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="font-medium tabular-nums text-slate-100">৳{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Tax (5%)</span><span className="font-medium tabular-nums text-slate-100">৳{tax.toLocaleString()}</span></div>
                    <div className="flex justify-between border-t border-white/10 pt-1"><span className="font-semibold text-slate-100">Total</span><span className="font-bold tabular-nums text-cyan-300">৳{total.toLocaleString()}</span></div>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={useAi}
                    onChange={(e) => setUseAi(e.target.checked)}
                    className="h-4 w-4 rounded accent-cyan-500"
                  />
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Use AI to suggest line items (advisory — requires Step 8 summary)</span>
                </label>

                <Button onClick={generateInvoice} disabled={generating} className="fx-btn-border-trace w-full gap-2">
                  {generating ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  ) : (
                    <><Receipt className="h-4 w-4" /> Generate Invoice</>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      ) : invoices.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
            <Receipt className="h-7 w-7 text-slate-500" />
          </div>
          <div>
            <p className="font-medium text-slate-100">No invoices</p>
            <p className="text-sm text-slate-400">Generate a new invoice to get started.</p>
          </div>
        </GlassPanel>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {invoices.map((inv) => {
            let items: Array<{ description: string; quantity: number; unit_price: number }> = []
            try { items = JSON.parse(inv.items) } catch { /* */ }
            return (
              <GlassPanel key={inv.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-cyan-400" />
                      <span className="font-mono text-sm font-semibold text-slate-100">{inv.invoiceNo}</span>
                    </div>
                    <button
                      onClick={() => { setActivePatient(inv.patient.id); setView('patient-detail') }}
                      className="mt-0.5 text-left text-sm text-slate-300 hover:text-cyan-300 hover:underline"
                    >
                      {inv.patient.fullName}
                    </button>
                  </div>
                  <span className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                    inv.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-300'
                      : inv.status === 'CANCELLED' ? 'bg-red-500/15 text-red-400'
                      : 'bg-amber-500/15 text-amber-300'
                  )}>
                    {inv.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1">
                  {items.slice(0, 4).map((it, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="truncate pr-2 text-slate-200">{it.description} ×{it.quantity}</span>
                      <span className="tabular-nums text-slate-400">৳{(it.quantity * it.unit_price).toLocaleString()}</span>
                    </div>
                  ))}
                  {items.length > 4 && (
                    <p className="text-[11px] text-slate-400">+{items.length - 4} more items</p>
                  )}
                </div>

                <div className="mt-3 border-t border-white/10 pt-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="tabular-nums text-slate-100">৳{inv.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Tax</span><span className="tabular-nums text-slate-100">৳{inv.tax.toLocaleString()}</span></div>
                  <div className="mt-1 flex justify-between border-t border-white/10 pt-1"><span className="font-semibold text-slate-100">Total</span><span className="font-bold tabular-nums text-cyan-300">৳{inv.total.toLocaleString()}</span></div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">{format(new Date(inv.createdAt), 'MMM d, yyyy')}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.print()}
                    className="h-7 text-xs text-slate-300 hover:text-slate-100"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print
                  </Button>
                </div>
              </GlassPanel>
            )
          })}
        </div>
      )}
    </div>
  )
}
