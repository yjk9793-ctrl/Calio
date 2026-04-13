'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calcActivityCalories } from '@/lib/calories'
import type { Activity } from '@/types/database'

const ACTIVITIES = [
  { key: 'exercise',     icon: '🏃', name: '운동',      desc: '조깅, 헬스, 자전거 등', color: '#E1F5EE', cal: 7.0 },
  { key: 'walking',      icon: '🚶', name: '걷기',      desc: '산책, 출퇴근 걷기 등',  color: '#E1F5EE', cal: 3.5 },
  { key: 'reading',      icon: '📖', name: '독서',      desc: '책, 논문, 아티클 등',   color: '#E6F1FB', cal: 1.4 },
  { key: 'conversation', icon: '💬', name: '대화·미팅', desc: '회의, 통화, 수업 등',   color: '#FAEEDA', cal: 1.1 },
  { key: 'meditation',   icon: '🧘', name: '명상',      desc: '마음 챙김, 호흡 명상',  color: '#EEEDFE', cal: 1.0 },
  { key: 'music',        icon: '🎵', name: '악기·창작', desc: '피아노, 기타, 그림 등', color: '#FBEAF0', cal: 1.6 },
]

export default function ActivityPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<string | null>(null)
  const [duration, setDuration] = useState(30)
  const [weight, setWeight] = useState(70)
  const [logs, setLogs] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [totalBurned, setTotalBurned] = useState(0)

  const selectedAct = ACTIVITIES.find(a => a.key === selected)
  const estimatedCal = selected
    ? calcActivityCalories(selected, duration, weight)
    : 0

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { data: userData } = await supabase
      .from('users')
      .select('weight_kg')
      .eq('id', user.id)
      .single()
    if ((userData as any)?.weight_kg) setWeight(Number((userData as any)?.weight_kg))

    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', today + 'T00:00:00')
      .order('logged_at', { ascending: false })

    const actData = (data ?? []) as any[]
    setLogs(actData)
    setTotalBurned(actData.reduce((s: number, a: any) => s + a.calories_burned, 0))
  }

  const handleSave = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { error } = await supabase.from('activities').insert({
        user_id:         user.id,
        activity_type:   selected,
        duration_min:    duration,
        calories_burned: estimatedCal,
        logged_at:       new Date().toISOString(),
      })

      if (error) throw error
      setSaved(true)
      await loadLogs()
      setSelected(null)
      setDuration(30)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const activityNames: Record<string, string> = {
    exercise: '운동', walking: '걷기', reading: '독서',
    conversation: '대화·미팅', meditation: '명상', music: '악기·창작', other: '기타'
  }

  const s = styles

  return (
    <div style={s.wrap}>

      {/* 헤더 */}
      <div style={s.header}>
        <button onClick={() => router.push('/home')} style={s.backBtn}>←</button>
        <div style={s.headerTitle}>활동 기록</div>
        <div style={{ width: 32 }}/>
      </div>

      {/* 오늘 소비 배너 */}
      <div style={s.banner}>
        <div>
          <div style={s.bannerNum}>{totalBurned.toLocaleString()}</div>
          <div style={s.bannerLabel}>오늘 소비 kcal</div>
        </div>
        <div style={{ flex: 1, marginLeft: 16 }}>
          <div style={s.bannerSub}>활동으로 소비한 총 칼로리예요</div>
          <div style={s.progBg}>
            <div style={{ ...s.progFill, width: `${Math.min((totalBurned / 500) * 100, 100)}%` }}/>
          </div>
          <div style={s.progLabel}>목표 500 kcal</div>
        </div>
      </div>

      {/* 활동 선택 */}
      <div style={s.secTitle}>활동 선택</div>
      <div style={s.actGrid}>
        {ACTIVITIES.map(a => (
          <div key={a.key}
            onClick={() => { setSelected(a.key); setSaved(false) }}
            style={{
              ...s.actCard,
              borderColor: selected === a.key ? '#D85A30' : 'rgba(0,0,0,0.08)',
              background: selected === a.key ? '#FAECE7' : '#fff',
            }}>
            <div style={{ fontSize: 22 }}>{a.icon}</div>
            <div style={s.actName}>{a.name}</div>
            <div style={s.actDesc}>{a.desc}</div>
          </div>
        ))}
      </div>

      {/* 시간 설정 */}
      {selected && (
        <div style={s.durationBox}>
          <div style={s.secTitle2}>시간 설정</div>

          {/* 빠른 선택 */}
          <div style={s.quickRow}>
            {[10, 20, 30, 45, 60, 90].map(min => (
              <button key={min}
                onClick={() => setDuration(min)}
                style={{
                  ...s.quickBtn,
                  background: duration === min ? '#D85A30' : '#F7F5F2',
                  color: duration === min ? '#fff' : '#7A7570',
                  borderColor: duration === min ? '#D85A30' : 'transparent',
                }}>
                {min}분
              </button>
            ))}
          </div>

          {/* 슬라이더 */}
          <input
            type="range" min="5" max="180" step="5"
            value={duration}
            onChange={e => setDuration(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#D85A30', marginTop: 8 }}
          />

          {/* 칼로리 미리보기 */}
          <div style={s.calPreview}>
            <div style={s.calPreviewLeft}>
              <div style={{ fontSize: 28 }}>{selectedAct?.icon}</div>
              <div>
                <div style={s.calPreviewName}>{selectedAct?.name} {duration}분</div>
                <div style={s.calPreviewSub}>체중 {weight}kg 기준</div>
              </div>
            </div>
            <div style={s.calPreviewRight}>
              <div style={s.calPreviewNum}>−{estimatedCal}</div>
              <div style={s.calPreviewUnit}>kcal</div>
            </div>
          </div>

          {/* 저장 버튼 */}
          {saved ? (
            <div style={s.savedBanner}>✓ 기록에 저장됐어요!</div>
          ) : (
            <button onClick={handleSave} disabled={loading} style={s.saveBtn}>
              {loading ? '저장 중...' : '활동 기록 저장하기'}
            </button>
          )}
        </div>
      )}

      {/* 오늘 기록 */}
      {logs.length > 0 && (
        <>
          <div style={s.secTitle}>오늘 활동 기록</div>
          <div style={s.logList}>
            {logs.map(log => {
              const act = ACTIVITIES.find(a => a.key === log.activity_type)
              return (
                <div key={log.id} style={s.logItem}>
                  <div style={{ ...s.logIcon, background: act?.color ?? '#F1EFE8' }}>
                    {act?.icon ?? '⚡'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={s.logName}>{activityNames[log.activity_type] ?? log.activity_type}</div>
                    <div style={s.logTime}>
                      {log.duration_min}분 · {new Date(log.logged_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={s.logBar}>
                      <div style={{
                        ...s.logBarFill,
                        width: `${Math.min((log.calories_burned / 300) * 100, 100)}%`
                      }}/>
                    </div>
                  </div>
                  <div style={s.logCal}>−{log.calories_burned}</div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* 홈 버튼 */}
      <div style={{ padding: '16px 16px 40px' }}>
        <button onClick={() => router.push('/home')} style={s.homeBtn}>
          홈으로 돌아가기
        </button>
      </div>

    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    background: '#F7F5F2',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    maxWidth: 430,
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '52px 20px 16px',
  },
  backBtn: {
    background: 'none', border: 'none',
    fontSize: 22, cursor: 'pointer', color: '#7A7570', padding: 0,
  },
  headerTitle: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 16, fontWeight: 700, color: '#0F0E0D',
  },
  banner: {
    background: '#E1F5EE',
    borderRadius: 18,
    margin: '0 16px 16px',
    padding: '16px 18px',
    display: 'flex',
    alignItems: 'center',
  },
  bannerNum: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 32, fontWeight: 800, color: '#1D9E75', lineHeight: 1,
  },
  bannerLabel: {
    fontSize: 11, color: '#0F6E56', fontWeight: 300, marginTop: 3,
  },
  bannerSub: {
    fontSize: 11, color: '#0F6E56', fontWeight: 300, marginBottom: 6,
  },
  progBg: {
    height: 5, background: '#9FE1CB', borderRadius: 3, overflow: 'hidden',
  },
  progFill: {
    height: '100%', borderRadius: 3, background: '#1D9E75',
  },
  progLabel: {
    fontSize: 10, color: '#0F6E56', fontWeight: 300, marginTop: 4,
  },
  secTitle: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#7A7570', margin: '4px 16px 10px',
  },
  secTitle2: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#7A7570', marginBottom: 12,
  },
  actGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    margin: '0 16px 16px',
  },
  actCard: {
    border: '1.5px solid',
    borderRadius: 14,
    padding: '14px 12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  actName: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 13, fontWeight: 700, color: '#0F0E0D', marginTop: 6,
  },
  actDesc: {
    fontSize: 11, color: '#7A7570', fontWeight: 300, marginTop: 2,
  },
  durationBox: {
    background: '#fff',
    borderRadius: 18,
    margin: '0 16px 16px',
    padding: '18px',
  },
  quickRow: {
    display: 'flex', gap: 6, flexWrap: 'wrap' as const,
  },
  quickBtn: {
    padding: '7px 12px',
    borderRadius: 20,
    border: '1px solid',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 12, fontWeight: 500,
    cursor: 'pointer',
  },
  calPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#F7F5F2',
    borderRadius: 14,
    padding: '14px',
    margin: '14px 0',
  },
  calPreviewLeft: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  calPreviewName: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 14, fontWeight: 700, color: '#0F0E0D',
  },
  calPreviewSub: {
    fontSize: 11, color: '#7A7570', fontWeight: 300, marginTop: 2,
  },
  calPreviewRight: { textAlign: 'right' as const },
  calPreviewNum: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 26, fontWeight: 800, color: '#1D9E75', lineHeight: 1,
  },
  calPreviewUnit: {
    fontSize: 11, color: '#0F6E56', fontWeight: 500,
  },
  savedBanner: {
    padding: '13px 14px',
    background: '#E1F5EE',
    borderRadius: 13,
    fontSize: 14, fontWeight: 600, color: '#085041',
    textAlign: 'center' as const,
  },
  saveBtn: {
    width: '100%', padding: 14,
    borderRadius: 13,
    background: '#D85A30', color: '#fff',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 15, fontWeight: 700,
    border: 'none', cursor: 'pointer',
  },
  logList: {
    background: '#fff',
    borderRadius: 16,
    margin: '0 16px 16px',
    padding: '4px 14px',
  },
  logItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 0',
    borderBottom: '0.5px solid rgba(0,0,0,0.06)',
  },
  logIcon: {
    width: 36, height: 36, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, flexShrink: 0,
  },
  logName: {
    fontSize: 13, fontWeight: 500, color: '#0F0E0D',
  },
  logTime: {
    fontSize: 11, color: '#7A7570', marginTop: 1,
  },
  logBar: {
    height: 3, background: 'rgba(0,0,0,0.06)',
    borderRadius: 2, overflow: 'hidden', marginTop: 5,
  },
  logBarFill: {
    height: '100%', borderRadius: 2, background: '#1D9E75',
  },
  logCal: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 14, fontWeight: 700, color: '#1D9E75',
  },
  homeBtn: {
    width: '100%', padding: 14,
    borderRadius: 13,
    background: '#0F0E0D', color: '#fff',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 14, fontWeight: 700,
    border: 'none', cursor: 'pointer',
  },
}
