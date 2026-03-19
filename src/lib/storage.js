import { supabase } from './supabase'

const ROW_ID = 'default'

let saveTimer = null
let lastData = null
let isSaving = false // guard to ignore our own realtime echoes

// Sync status: "idle" | "saving" | "saved" | "offline"
let syncStatus = "idle"
let syncListeners = []

// Realtime: listeners for remote data changes
let realtimeListeners = []

export function onRemoteUpdate(fn) {
  realtimeListeners.push(fn)
  return () => { realtimeListeners = realtimeListeners.filter(l => l !== fn) }
}

// Subscribe to realtime changes on tracker_state
supabase
  .channel('tracker-sync')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tracker_state', filter: `id=eq.${ROW_ID}` }, (payload) => {
    if (isSaving) return // ignore our own writes
    const remoteData = payload.new?.data
    if (remoteData) {
      lastData = remoteData
      realtimeListeners.forEach(fn => fn(remoteData))
    }
  })
  .subscribe()

export function onSyncStatus(fn) {
  syncListeners.push(fn)
  fn(syncStatus)
  return () => { syncListeners = syncListeners.filter(l => l !== fn) }
}

function setSyncStatus(s) {
  syncStatus = s
  syncListeners.forEach(fn => fn(s))
}

export async function loadData(seed) {
  const { data, error } = await supabase
    .from('tracker_state')
    .select('data')
    .eq('id', ROW_ID)
    .maybeSingle()

  if (error) {
    setSyncStatus("offline")
    throw error
  }

  setSyncStatus("saved")

  if (data?.data) return data.data

  // No row exists — upsert seed
  const { error: upsertErr } = await supabase
    .from('tracker_state')
    .upsert({ id: ROW_ID, data: seed, updated_at: new Date().toISOString() })

  if (upsertErr) throw upsertErr
  return seed
}

export function saveData(data) {
  lastData = data
  setSyncStatus("saving")
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    const payload = lastData
    isSaving = true
    try {
      const { error } = await supabase
        .from('tracker_state')
        .upsert({ id: ROW_ID, data: payload, updated_at: new Date().toISOString() })
      if (error) throw error
      setSyncStatus("saved")
    } catch (e) {
      console.warn('Save failed, retrying once...', e)
      try {
        const { error } = await supabase
          .from('tracker_state')
          .upsert({ id: ROW_ID, data: payload, updated_at: new Date().toISOString() })
        if (error) throw error
        setSyncStatus("saved")
      } catch (e2) {
        console.error('Retry failed', e2)
        setSyncStatus("offline")
      }
    } finally {
      setTimeout(() => { isSaving = false }, 1000) // brief window to ignore our own echo
    }
  }, 500)
}
