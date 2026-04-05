export type RSVPStatus = 'confirmed' | 'pending' | 'declined'
export type PaymentStatus = 'lunas' | 'dp' | 'belum'
export type TaskStatus = 'todo' | 'in-progress' | 'done'
export type Priority = 'low' | 'medium' | 'high'

export interface Guest {
  id: string
  nama: string
  telepon?: string
  email?: string
  undangan_dikirim: boolean
  rsvp_status: RSVPStatus
  jumlah_hadir: number
  pilihan_makan?: string
  nomor_meja?: number
  catatan?: string
}

export interface BudgetItem {
  id: string
  kategori: string
  item: string
  estimasi: number
  realisasi: number
  status_bayar: PaymentStatus
  vendor?: string
  tanggal_bayar?: string
  catatan?: string
}

export interface Vendor {
  id: string
  nama: string
  kategori: string
  kontak?: string
  telepon?: string
  harga: number
  dp_dibayar: number
  lunas: boolean
  tanggal_kontrak?: string
  catatan?: string
}

export interface ChecklistItem {
  id: string
  task: string
  kategori: string
  due_date?: string
  assignee?: string
  status: TaskStatus
  prioritas: Priority
  catatan?: string
}

export interface SeatingTable {
  nomor_meja: number
  nama_meja: string
  kapasitas: number
}

export type MoodboardCategory =
  | 'dekorasi'
  | 'busana'
  | 'fotografi'
  | 'venue'
  | 'bunga'
  | 'kue'
  | 'undangan'
  | 'warna'
  | 'lainnya'

export interface MoodboardNote {
  id: string
  judul: string
  kategori: MoodboardCategory
  gambar_url?: string
  catatan: string
  tanggal_dibuat: string
}

export interface WeddingConfig {
  tanggal_pernikahan: string
  nama_pengantin_1: string
  nama_pengantin_2: string
  venue?: string
  total_budget: number
  target_tamu: number
}

export interface TimelineEvent {
  id: string
  waktu: string       // HH:MM format
  judul: string
  lokasi?: string
  catatan?: string
  urutan: number      // display order
}

export type SheetRow = string[]

export interface ApiResponse<T> {
  data: T
  error?: string
}
