'use client'

import { useState, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { GlassPanel, SectionHeader, RoleBadge } from '@/components/orioster/ui-primitives'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  CheckSquare,
  FileText,
  Download,
  Upload,
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Users,
  HeartPulse,
  Stethoscope,
  FlaskConical,
  TrendingUp,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ═══════════════════════════════════════════════════════════════
// MY PROFILE — With image upload
// ═══════════════════════════════════════════════════════════════

export function MyProfileView() {
  const { user, profileImage, setProfileImage } = useAppStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState('+880 1712-345678')
  const [address, setAddress] = useState('Riverside Medical Camp, Zone A')

  const initials = (user?.name ?? '').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large (max 2MB)')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setProfileImage(reader.result as string)
      toast.success('Profile photo updated')
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-4 p-4">
      <SectionHeader title="My Profile" subtitle="Manage your personal information" />

      {/* Profile card with image upload */}
      <GlassPanel variant="strong" className="card-lift p-5 text-center">
        <div className="relative mx-auto mb-3 w-fit">
          <Avatar className="h-24 w-24 border-2 border-violet-500/30">
            {profileImage ? (
              <img src={profileImage} alt={user?.name} className="h-full w-full rounded-full object-cover" />
            ) : null}
            <AvatarFallback className="bg-violet-500/20 text-2xl font-bold text-violet-300">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-press absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-lg"
          >
            <Camera className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <h2 className="text-lg font-bold text-white">{user?.name}</h2>
        <p className="text-sm text-slate-400">{user?.email}</p>
        <div className="mt-2 flex justify-center">
          <RoleBadge role={user?.role ?? 'ADMIN'} />
        </div>
      </GlassPanel>

      {/* Edit form */}
      <GlassPanel className="space-y-4 p-5">
        <p className="text-sm font-semibold text-white">Personal Information</p>

        <div>
          <label className="mb-1 block text-xs text-slate-400">Full Name</label>
          <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2.5">
            <User className="h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">Email</label>
          <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2.5">
            <Mail className="h-4 w-4 text-slate-500" />
            <input
              type="email"
              value={user?.email ?? ''}
              disabled
              className="flex-1 bg-transparent text-sm text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">Phone</label>
          <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2.5">
            <Phone className="h-4 w-4 text-slate-500" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-slate-400">Address</label>
          <div className="glass-input flex items-center gap-2 rounded-lg px-3 py-2.5">
            <MapPin className="h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="flex-1 bg-transparent text-sm text-white focus:outline-none"
            />
          </div>
        </div>

        <Button className="fx-btn-border-trace btn-press ripple w-full gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Save Changes
        </Button>
      </GlassPanel>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MY COMPANY
// ═══════════════════════════════════════════════════════════════

export function MyCompanyView() {
  const { user } = useAppStore()
  return (
    <div className="space-y-4 p-4">
      <SectionHeader title="My Company" subtitle="Organization details" />

      <GlassPanel variant="strong" className="card-lift p-5">
        <div className="flex items-center gap-4">
          <div className="wope-logo-glow flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 text-white">
            <Building2 className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Riverside Medical Center</h2>
            <p className="text-sm text-slate-400">Tenant ID: tenant-default</p>
            <p className="mt-1 text-xs text-violet-400">Active · Community Clinic</p>
          </div>
        </div>
      </GlassPanel>

      <div className="grid grid-cols-2 gap-3">
        <GlassPanel className="card-lift p-4">
          <Users className="mb-2 h-6 w-6 text-violet-400" />
          <p className="text-2xl font-bold text-white">5</p>
          <p className="text-xs text-slate-400">Staff Members</p>
        </GlassPanel>
        <GlassPanel className="card-lift p-4">
          <HeartPulse className="mb-2 h-6 w-6 text-emerald-400" />
          <p className="text-2xl font-bold text-white">9</p>
          <p className="text-xs text-slate-400">Patients Served</p>
        </GlassPanel>
        <GlassPanel className="card-lift p-4">
          <Stethoscope className="mb-2 h-6 w-6 text-amber-400" />
          <p className="text-2xl font-bold text-white">2</p>
          <p className="text-xs text-slate-400">Doctors</p>
        </GlassPanel>
        <GlassPanel className="card-lift p-4">
          <FlaskConical className="mb-2 h-6 w-6 text-violet-400" />
          <p className="text-2xl font-bold text-white">12</p>
          <p className="text-xs text-slate-400">Lab Reports</p>
        </GlassPanel>
      </div>

      <GlassPanel className="space-y-3 p-5">
        <p className="text-sm font-semibold text-white">Company Information</p>
        {[
          { label: 'Company Name', value: 'Riverside Medical Center' },
          { label: 'Type', value: 'Community Clinic' },
          { label: 'Location', value: 'Riverside Camp, Zone A' },
          { label: 'Established', value: 'January 2025' },
          { label: 'Your Role', value: user?.role ?? 'ADMIN' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0">
            <span className="text-xs text-slate-400">{item.label}</span>
            <span className="text-sm font-medium text-white">{item.value}</span>
          </div>
        ))}
      </GlassPanel>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MY TASKS
// ═══════════════════════════════════════════════════════════════

export function MyTasksView() {
  const { user, setView, setActivePatient } = useAppStore()
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Review James Okoro\'s AI diagnosis', priority: 'high', done: false, patientId: 'cm...' },
    { id: 't2', title: 'Complete Mei Lin Zhao patient entry', priority: 'medium', done: false },
    { id: 't3', title: 'Approve lab report for Liam O Connor', priority: 'high', done: false },
    { id: 't4', title: 'Follow-up with Kwame Mensah', priority: 'low', done: true },
    { id: 't5', title: 'Generate invoice for Fatima Al-Rashid', priority: 'medium', done: false },
    { id: 't6', title: 'Review pending appointments', priority: 'low', done: true },
  ])

  function toggle(id: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const pending = tasks.filter((t) => !t.done)
  const completed = tasks.filter((t) => t.done)

  const priorityColors: Record<string, string> = {
    high: 'bg-red-500/15 text-red-400 border-red-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  }

  return (
    <div className="space-y-4 p-4">
      <SectionHeader title="My Tasks" subtitle={`${pending.length} pending · ${completed.length} completed`} />

      <div className="grid grid-cols-3 gap-3">
        <GlassPanel className="p-3 text-center">
          <p className="text-xl font-bold text-white">{tasks.length}</p>
          <p className="text-[10px] text-slate-400">Total</p>
        </GlassPanel>
        <GlassPanel className="p-3 text-center">
          <p className="text-xl font-bold text-amber-400">{pending.length}</p>
          <p className="text-[10px] text-slate-400">Pending</p>
        </GlassPanel>
        <GlassPanel className="p-3 text-center">
          <p className="text-xl font-bold text-emerald-400">{completed.length}</p>
          <p className="text-[10px] text-slate-400">Done</p>
        </GlassPanel>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <GlassPanel key={task.id} className={cn('card-lift flex items-center gap-3 p-3', task.done && 'opacity-50')}>
            <button
              onClick={() => toggle(task.id)}
              className="btn-press flex-shrink-0"
            >
              {task.done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              ) : (
                <Circle className="h-5 w-5 text-slate-600" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className={cn('text-sm font-medium', task.done ? 'text-slate-500 line-through' : 'text-white')}>
                {task.title}
              </p>
            </div>
            <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', priorityColors[task.priority])}>
              {task.priority}
            </span>
          </GlassPanel>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════
// MY DOCUMENTS
// ═══════════════════════════════════════════════════════════════

export function MyDocumentsView() {
  const { setView, setActivePatient } = useAppStore()
  const documents = [
    { id: 'd1', name: 'James Okoro - Prescription', type: 'Prescription', date: '2025-01-15', size: '124 KB' },
    { id: 'd2', name: 'Liam O Connor - Lab Report (CBC)', type: 'Lab Report', date: '2025-01-14', size: '89 KB' },
    { id: 'd3', name: 'Kwame Mensah - Medical Certificate', type: 'Certificate', date: '2025-01-13', size: '56 KB' },
    { id: 'd4', name: 'Mei Lin Zhao - Invoice #INV-001', type: 'Invoice', date: '2025-01-12', size: '42 KB' },
    { id: 'd5', name: 'James Okoro - Treatment Plan', type: 'Treatment', date: '2025-01-11', size: '78 KB' },
  ]

  const typeIcons: Record<string, React.ReactNode> = {
    'Prescription': <FileText className="h-5 w-5 text-violet-400" />,
    'Lab Report': <FlaskConical className="h-5 w-5 text-emerald-400" />,
    'Certificate': <CheckCircle2 className="h-5 w-5 text-amber-400" />,
    'Invoice': <TrendingUp className="h-5 w-5 text-violet-400" />,
    'Treatment': <HeartPulse className="h-5 w-5 text-red-400" />,
  }

  return (
    <div className="space-y-4 p-4">
      <SectionHeader
        title="My Documents"
        subtitle={`${documents.length} documents`}
        action={
          <Button className="fx-btn-border-trace fx-btn-border-trace-sm btn-press ripple gap-1.5">
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        }
      />

      <div className="space-y-2">
        {documents.map((doc) => (
          <GlassPanel key={doc.id} className="card-lift flex items-center gap-3 p-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
              {typeIcons[doc.type]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{doc.name}</p>
              <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
                <span>{doc.type}</span>
                <span>·</span>
                <span>{doc.date}</span>
                <span>·</span>
                <span>{doc.size}</span>
              </div>
            </div>
            <button className="btn-press flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-violet-500/10 hover:text-violet-300">
              <Download className="h-4 w-4" />
            </button>
          </GlassPanel>
        ))}
      </div>
    </div>
  )
}
