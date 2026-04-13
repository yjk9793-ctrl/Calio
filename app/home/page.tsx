'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { User, Meal, Activity } from '@/types/database'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [meals, setMeals] = useState<Meal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [aiComment, setAiComment] = useState('')

  const totalIn  = meals.reduce((s, m) => s + m.calories, 0)
  const totalOut = activities.reduce((s, a) => s + a.calories_burned, 0)
  const goal     = user?.daily_kcal_goal ?? 2000
  const remaining = goal - totalIn + totalOut
  const pctIn    = Math.min((totalIn / goal) * 100, 100)
  const pctOut   = Math.min((totalOut / goal) * 100, 100)

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth'); return }

      const today = new Date().toISOString().split('T')[0]

      const [{ data: userData }, { data: mealData }, { data: actData }] = await Promise.all([
        supabase.from('users').select('*').eq('id', authUser.id).single(),
        supabase.from('meals').select('*').eq('user_id', authUser.id).gte('logged_at', today + 'T00:00:00').order('logged_at', { ascending: false }),
        supabase.from('activities').select('*').eq('user_id', authUser.id).gte('logged_at', today + 'T00:00:00').order('logged_at', { ascending: false }),
      ])

      setUser(userData)
      setMeals(mealData ?? [])
      setActivities(actData ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    if (!loading && meals.length > 0) {
      fetchComment()
    }
  }, [loading])

  const fetchComment = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      })
      const data = await res.json()
      if (data.comment) setAiComment(data.comment)
    } catch (e) {
      console.error(e)
    }
  }

  const activityIcons: Record<string, string> = {
    exercise: '🏃', reading: '📖', conversation: '💬',
    walking: '🚶', meditation: '🧘', music: '🎵', other: '⚡'
  }
  const activityColors: Record<string, string> = {
    exercise: '#E1F5EE', reading: '#E6F1FB', conversation: '#FAEEDA',
    walking: '#E1F5EE', meditation: '#EEEDFE', music: '#FBEAF0', other: '#F1EFE8'
  }
  const mealTypeLabel: Record<string, string> = {
    breakfast: '아침', lunch: '점심', dinner: '저녁', snack: '간식'
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F2' }}>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 16, color: '#7A7570' }}>불러오는 중...</div>
    </div>
  )

  return (
    <div style={s.wrap}>

      {/* 헤더 */}
      <div style={s.header}>
        <div>
          {/* 로고 */}
          <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 4 }}>
            <span style={s.logoTxt}>cali</span>
            <svg width="16" height="22" viewBox="0 0 16 22" style={{ overflow: 'visible' }}>
              <circle cx="8" cy="13" r="5.8" fill="none" stroke="rgba(216,90,48,0.2)" strokeWidth="4"/>
              <circle cx="8" cy="13" r="5.8" fill="none" stroke="#D85A30" strokeWidth="4"
                strokeDasharray="30 6" strokeLinecap="butt" transform="rotate(-90 8 13)"/>
              <circle cx="8" cy="7.2" r="2" fill="#D85A30"/>
            </svg>
          </div>
          <div style={s.dateLabel}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </div>
        </div>
        <div style={s.avatar} onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))}>
          {user?.nickname?.[0] ?? '나'}
        </div>
      </div>

      {/* 칼로리 링 */}
      <div style={s.ringBox}>
        <svg width="180" height="180" viewBox="0 0 180 180">
          {/* 바깥 링 (섭취) */}
          <circle cx="90" cy="90" r="74" fill="none" stroke="#F5C4B3" strokeWidth="14"/>
          <circle cx="90" cy="90" r="74" fill="none" stroke="#D85A30" strokeWidth="14"
            strokeDasharray={`${2 * Math.PI * 74 * pctIn / 100} ${2 * Math.PI * 74 * (1 - pctIn / 100)}`}
            strokeLinecap="butt" transform="rotate(-90 90 90)"/>
          {/* 안쪽 링 (소비) */}
          <circle cx="90" cy="90" r="54" fill="none" stroke="#9FE1CB" strokeWidth="10"/>
          <circle cx="90" cy="90" r="54" fill="none" stroke="#1D9E75" strokeWidth="10"
            strokeDasharray={`${2 * Math.PI * 54 * pctOut / 100} ${2 * Math.PI * 54 * (1 - pctOut / 100)}`}
            strokeLinecap="butt" transform="rotate(-90 90 90)"/>
          {/* 중앙 텍스트 */}
          <text x="90" y="80" textAnchor="middle"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 34, fontWeight: 800, fill: remaining >= 0 ? '#D85A30' : '#E24B4A' }}>
            {Math.abs(remaining)}
          </text>
          <text x="90" y="96" textAnchor="middle"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 300, fill: '#993C1D' }}>
            {remaining >= 0 ? '남은 kcal' : '초과 kcal'}
          </text>
        </svg>

        {/* 범례 */}
        <div style={s.ringLegend}>
          <div style={s.legendItem}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#D85A30' }}/>
            <span style={{ color: '#993C1D' }}>섭취 {totalIn.toLocaleString()}</span>
          </div>
          <div style={s.legendItem}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: '#1D9E75' }}/>
            <span style={{ color: '#0F6E56' }}>소비 {totalOut.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div style={s.statRow}>
        <div style={{ ...s.statCard, borderLeft: '3px solid #D85A30' }}>
          <div style={s.statLabel}>오늘 섭취</div>
          <div style={s.statVal}>{totalIn.toLocaleString()}</div>
          <div style={s.statSub}>목표 {goal.toLocaleString()} kcal</div>
        </div>
        <div style={{ ...s.statCard, borderLeft: '3px solid #1D9E75' }}>
          <div style={s.statLabel}>활동 소비</div>
          <div style={s.statVal}>{totalOut.toLocaleString()}</div>
          <div style={s.statSub}>운동+일상 합산</div>
        </div>
      </div>

      {/* AI 코멘트 */}
      {aiComment && (
        <div style={s.aiBox}>
          <div style={s.aiLabel}>✦ calio AI</div>
          <div style={s.aiText}>{aiComment}</div>
        </div>
      )}

      {/* 오늘 기록 */}
      <div style={s.secTitle}>오늘의 기록</div>

      {meals.length === 0 && activities.length === 0 ? (
        <div style={s.emptyBox}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🍽️</div>
          <div style={s.emptyText}>아직 기록이 없어요</div>
          <div style={s.emptySubText}>음식을 찍어 칼로리를 기록해보세요</div>
        </div>
      ) : (
        <div style={s.logList}>
          {meals.map(m => (
            <div key={m.id} style={s.logItem}>
              <div style={{ ...s.logIcon, background: '#FAECE7' }}>🍽️</div>
              <div style={{ flex: 1 }}>
                <div style={s.logName}>{m.meal_name}</div>
                <div style={s.logTime}>
                  {mealTypeLabel[m.meal_type ?? 'snack']} · {new Date(m.logged_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <div style={{ ...s.logCal, color: '#D85A30' }}>+{m.calories}</div>
            </div>
          ))}
          {activities.map(a => (
            <div key={a.id} style={s.logItem}>
              <div style={{ ...s.logIcon, background: activityColors[a.activity_type] ?? '#F1EFE8' }}>
                {activityIcons[a.activity_type] ?? '⚡'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.logName}>{a.activity_type} {a.duration_min}분</div>
                <div style={s.logTime}>{new Date(a.logged_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ ...s.logCal, color: '#1D9E75' }}>−{a.calories_burned}</div>
            </div>
          ))}
        </div>
      )}

      {/* 하단 여백 */}
      <div style={{ height: 80 }}/>

      {/* FAB */}
      <button onClick={() => router.push('/scan')} style={s.fab}>+</button>

      {/* 하단 네비 */}
      <div style={s.bnav}>
        <div style={{ ...s.bni, color: '#D85A30' }}>
          <div style={{ fontSize: 20 }}>🏠</div>
          <div style={{ fontSize: 10, fontWeight: 600 }}>홈</div>
        </div>
        <div style={s.bni} onClick={() => router.push('/scan')}>
          <div style={{ fontSize: 20, opacity: 0.35 }}>📸</div>
          <div style={{ fontSize: 10, color: '#7A7570' }}>음식</div>
        </div>
        <div style={s.bni}>
          <div style={{ fontSize: 20, opacity: 0.35 }}>⚡</div>
          <div style={{ fontSize: 10, color: '#7A7570' }}>활동</div>
        </div>
        <div style={s.bni}>
          <div style={{ fontSize: 20, opacity: 0.35 }}>📊</div>
          <div style={{ fontSize: 10, color: '#7A7570' }}>통계</div>
        </div>
      </div>

    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    background: '#F7F5F2',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    maxWidth: 430,
    margin: '0 auto',
    paddingBottom: 80,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '52px 20px 12px',
  },
  logoTxt: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 22,
    fontWeight: 800,
    color: '#0F0E0D',
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#7A7570',
    fontWeight: 300,
    marginTop: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    background: '#FAECE7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 12,
    fontWeight: 700,
    color: '#D85A30',
    cursor: 'pointer',
  },
  ringBox: {
    background: '#FAECE7',
    borderRadius: 20,
    margin: '0 16px 12px',
    padding: '20px 16px 14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  ringLegend: {
    display: 'flex',
    gap: 20,
    marginTop: 8,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    fontWeight: 500,
  },
  statRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    margin: '0 16px 12px',
  },
  statCard: {
    background: '#fff',
    borderRadius: 14,
    padding: '12px 14px',
  },
  statLabel: {
    fontSize: 11,
    color: '#7A7570',
    marginBottom: 4,
  },
  statVal: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 22,
    fontWeight: 800,
    color: '#0F0E0D',
  },
  statSub: {
    fontSize: 10,
    color: '#7A7570',
    fontWeight: 300,
    marginTop: 2,
  },
  aiBox: {
    background: '#fff',
    borderRadius: 14,
    padding: '14px 16px',
    margin: '0 16px 12px',
    borderLeft: '3px solid #D85A30',
  },
  aiLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#D85A30',
    marginBottom: 6,
  },
  aiText: {
    fontSize: 13,
    color: '#0F0E0D',
    lineHeight: 1.65,
    fontWeight: 400,
  },
  secTitle: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#7A7570',
    margin: '4px 16px 10px',
  },
  logList: {
    background: '#fff',
    borderRadius: 16,
    margin: '0 16px',
    padding: '4px 14px',
  },
  logItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 0',
    borderBottom: '0.5px solid rgba(0,0,0,0.06)',
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    flexShrink: 0,
  },
  logName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#0F0E0D',
  },
  logTime: {
    fontSize: 11,
    color: '#7A7570',
    marginTop: 1,
  },
  logCal: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 14,
    fontWeight: 700,
  },
  emptyBox: {
    background: '#fff',
    borderRadius: 16,
    margin: '0 16px',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center' as const,
  },
  emptyText: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    color: '#0F0E0D',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: '#7A7570',
    fontWeight: 300,
  },
  fab: {
    position: 'fixed' as const,
    bottom: 80,
    right: '50%',
    transform: 'translateX(calc(50% + 130px))',
    width: 48,
    height: 48,
    borderRadius: 24,
    background: '#D85A30',
    color: '#fff',
    fontSize: 24,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    lineHeight: 1,
    zIndex: 10,
  },
  bnav: {
    position: 'fixed' as const,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: 430,
    height: 64,
    background: '#fff',
    borderTop: '0.5px solid rgba(0,0,0,0.08)',
    display: 'flex',
    alignItems: 'center',
    zIndex: 10,
  },
  bni: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 3,
    cursor: 'pointer',
  },
}
