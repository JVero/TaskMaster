import { supabase } from './supabase'

const ROW_ID = 'default'

let saveTimer = null
let lastData = null

export async function loadData(seed) {
  const { data, error } = await supabase
    .from('tracker_state')
    .select('data')
    .eq('id', ROW_ID)
    .maybeSingle()

  if (error) throw error

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
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    const payload = lastData
    try {
      const { error } = await supabase
        .from('tracker_state')
        .upsert({ id: ROW_ID, data: payload, updated_at: new Date().toISOString() })
      if (error) throw error
    } catch (e) {
      console.warn('Save failed, retrying once...', e)
      // Show toast
      showToast('Save failed — retrying...')
      try {
        const { error } = await supabase
          .from('tracker_state')
          .upsert({ id: ROW_ID, data: payload, updated_at: new Date().toISOString() })
        if (error) throw error
        showToast('Saved!')
      } catch (e2) {
        console.error('Retry failed', e2)
        showToast('Save failed. Changes are local only.')
      }
    }
  }, 500)
}

// Minimal toast system
let toastEl = null
let toastTimer = null

function showToast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div')
    Object.assign(toastEl.style, {
      position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
      background: '#1e293b', color: '#fff', padding: '8px 20px', borderRadius: '8px',
      fontSize: '13px', fontFamily: 'system-ui', zIndex: '9999', transition: 'opacity 0.3s',
      pointerEvents: 'none',
    })
    document.body.appendChild(toastEl)
  }
  toastEl.textContent = msg
  toastEl.style.opacity = '1'
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastEl.style.opacity = '0' }, 2500)
}
