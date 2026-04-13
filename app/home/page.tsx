'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [meals, setMeals] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
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
    if (!loading && meals.length > 0) fetchComment()
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
    } catch (e) { console.error(e) }
  }

  const actIcons: Record<string, string> = {
    exercise: '🏃', reading: '📖', conversation: '💬',
    walking: '🚶', meditation: '🧘', music: '🎵', other: '⚡'
  }
  const actColors: Record<string, string> = {
    exercise: '#E1F5EE', reading: '#E6F1FB', conversation: '#FAEEDA',
    walking: '#E1F5EE', meditation: '#EEEDFE', music: '#FBEAF0', other: '#F1EFE8'
  }
  const mealLabel: Record<string, string> = {
    breakfast: '아침', lunch: '점심', dinner: '저녁', snack: '간식'
  }

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 18, color: '#7A7570' }}>불러오는 중...</div>
    </div>
  )

  return (
    <>
      <style>{`
        .home-wrap {
          min-height: 100dvh;
          background: #fff;
          font-family: 'Plus Jakarta Sans', sans-serif;
          max-width: 430px;
          margin: 0 auto;
          padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px));
        }
        .home-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 56px 20px 16px;
        }
        .logo-txt {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 30px;
          font-weight: 800;
          color: #0F0E0D;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .date-label {
          font-size: 13px;
          color: #7A7570;
          font-weight: 300;
          margin-top: 3px;
        }
        .avatar {
          width: 38px; height: 38px;
          border-radius: 19px;
          background: #FAECE7;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 14px; font-weight: 700; color: #D85A30;
          cursor: pointer;
        }
        .ring-box {
          background: #FAECE7;
          border-radius: 22px;
          margin: 0 16px 14px;
          padding: 22px 16px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .ring-legend {
          display: flex; gap: 24px; margin-top: 10px;
        }
        .legend-item {
          display: flex; align-items: center; gap: 7px;
          font-size: 14px; font-weight: 500;
        }
        .stat-row {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 12px; margin: 0 16px 14px;
        }
        .stat-card {
          background: #F7F5F2;
          border-radius: 16px;
          padding: 14px 16px;
        }
        .stat-label { font-size: 13px; color: #7A7570; margin-bottom: 6px; }
        .stat-val {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 28px; font-weight: 800; color: #0F0E0D;
        }
        .stat-sub { font-size: 12px; color: #7A7570; font-weight: 300; margin-top: 3px; }
        .ai-box {
          background: #F7F5F2;
          border-radius: 16px;
          padding: 16px 18px;
          margin: 0 16px 14px;
          border-left: 4px solid #D85A30;
        }
        .ai-label {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.08em; color: #D85A30; margin-bottom: 7px;
        }
        .ai-text { font-size: 15px; color: #0F0E0D; line-height: 1.65; }
        .sec-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 12px; font-weight: 700;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #7A7570; margin: 0 16px 10px;
        }
        .log-list {
          background: #F7F5F2;
          border-radius: 18px;
          margin: 0 16px;
          padding: 4px 16px;
        }
        .log-item {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 0;
          border-bottom: 0.5px solid rgba(0,0,0,0.06);
        }
        .log-item:last-child { border-bottom: none; }
        .log-icon {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .log-name { font-size: 15px; font-weight: 500; color: #0F0E0D; }
        .log-time { font-size: 13px; color: #7A7570; margin-top: 2px; }
        .log-cal {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 16px; font-weight: 700;
        }
        .empty-box {
          background: #F7F5F2; border-radius: 18px;
          margin: 0 16px; padding: 40px;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
        }
        .empty-text {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 17px; font-weight: 700; color: #0F0E0D; margin-bottom: 6px;
        }
        .empty-sub { font-size: 14px; color: #7A7570; font-weight: 300; }
        .fab {
          position: fixed;
          bottom: calc(76px + env(safe-area-inset-bottom, 0px));
          right: 20px;
          width: 54px; height: 54px;
          border-radius: 27px;
          background: #D85A30; color: #fff;
          font-size: 26px; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          line-height: 1; z-index: 10;
          -webkit-tap-highlight-color: transparent;
        }
        .bnav {
          position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
          width: 100%; max-width: 430px;
          background: #fff;
          border-top: 0.5px solid rgba(0,0,0,0.08);
          display: flex; align-items: center;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          z-index: 10;
        }
        .bni {
          flex: 1; display: flex; flex-direction: column;
          align-items: center; gap: 4px;
          padding: 12px 0;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .bni-ic { font-size: 22px; }
        .bni-lb { font-size: 11px; color: #7A7570; }
        .bni-lb.on { color: #D85A30; font-weight: 600; }
      `}</style>

      <div className="home-wrap">

        {/* 헤더 */}
        <div className="home-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline' }}>
              <span className="logo-txt">cali</span>
              <svg width="22" height="30" viewBox="0 0 22 30" style={{ overflow: 'visible' }}>
                <circle cx="11" cy="18" r="7.8" fill="none" stroke="rgba(216,90,48,0.2)" strokeWidth="5.2"/>
                <circle cx="11" cy="18" r="7.8" fill="none" stroke="#D85A30" strokeWidth="5.2"
                  strokeDasharray="40 8" strokeLinecap="butt" transform="rotate(-90 11 18)"/>
                <circle cx="11" cy="10.2" r="2.6" fill="#D85A30"/>
              </svg>
            </div>
            <div className="date-label">
              {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
            </div>
          </div>
          <div className="avatar" onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))}>
            {user?.nickname?.[0] ?? '나'}
          </div>
        </div>

        {/* 칼로리 링 */}
        <div className="ring-box">
          <svg width="190" height="190" viewBox="0 0 190 190">
            <circle cx="95" cy="95" r="78" fill="none" stroke="#F5C4B3" strokeWidth="15"/>
            <circle cx="95" cy="95" r="78" fill="none" stroke="#D85A30" strokeWidth="15"
              strokeDasharray={`${2*Math.PI*78*pctIn/100} ${2*Math.PI*78*(1-pctIn/100)}`}
              strokeLinecap="butt" transform="rotate(-90 95 95)"/>
            <circle cx="95" cy="95" r="57" fill="none" stroke="#9FE1CB" strokeWidth="11"/>
            <circle cx="95" cy="95" r="57" fill="none" stroke="#1D9E75" strokeWidth="11"
              strokeDasharray={`${2*Math.PI*57*pctOut/100} ${2*Math.PI*57*(1-pctOut/100)}`}
              strokeLinecap="butt" transform="rotate(-90 95 95)"/>
            <text x="95" y="83" textAnchor="middle"
              style={{ fontFamily: 'Bricolage Grotesque,sans-serif', fontSize: 38, fontWeight: 800, fill: remaining >= 0 ? '#D85A30' : '#E24B4A' }}>
              {Math.abs(remaining)}
            </text>
            <text x="95" y="102" textAnchor="middle"
              style={{ fontFamily: 'Plus Jakarta Sans,sans-serif', fontSize: 13, fontWeight: 300, fill: '#993C1D' }}>
              {remaining >= 0 ? '남은 kcal' : '초과 kcal'}
            </text>
          </svg>
          <div className="ring-legend">
            <div className="legend-item">
              <div style={{ width: 9, height: 9, borderRadius: 5, background: '#D85A30' }}/>
              <span style={{ color: '#993C1D' }}>섭취 {totalIn.toLocaleString()}</span>
            </div>
            <div className="legend-item">
              <div style={{ width: 9, height: 9, borderRadius: 5, background: '#1D9E75' }}/>
              <span style={{ color: '#0F6E56' }}>소비 {totalOut.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 통계 */}
        <div className="stat-row">
          <div className="stat-card" style={{ borderLeft: '4px solid #D85A30' }}>
            <div className="stat-label">오늘 섭취</div>
            <div className="stat-val">{totalIn.toLocaleString()}</div>
            <div className="stat-sub">목표 {goal.toLocaleString()} kcal</div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #1D9E75' }}>
            <div className="stat-label">활동 소비</div>
            <div className="stat-val">{totalOut.toLocaleString()}</div>
            <div className="stat-sub">운동+일상 합산</div>
          </div>
        </div>

        {/* AI 코멘트 */}
        {aiComment && (
          <div className="ai-box">
            <div className="ai-label">✦ calio AI</div>
            <div className="ai-text">{aiComment}</div>
          </div>
        )}

        {/* 오늘 기록 */}
        <div className="sec-title">오늘의 기록</div>

        {meals.length === 0 && activities.length === 0 ? (
          <div className="empty-box">
            <div style={{ fontSize: 36, marginBottom: 10 }}>🍽️</div>
            <div className="empty-text">아직 기록이 없어요</div>
            <div className="empty-sub">음식을 찍어 칼로리를 기록해보세요</div>
          </div>
        ) : (
          <div className="log-list">
            {meals.map(m => (
              <div key={m.id} className="log-item">
                <div className="log-icon" style={{ background: '#FAECE7' }}>🍽️</div>
                <div style={{ flex: 1 }}>
                  <div className="log-name">{m.meal_name}</div>
                  <div className="log-time">
                    {mealLabel[m.meal_type ?? 'snack']} · {new Date(m.logged_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <div className="log-cal" style={{ color: '#D85A30' }}>+{m.calories}</div>
              </div>
            ))}
            {activities.map(a => (
              <div key={a.id} className="log-item">
                <div className="log-icon" style={{ background: actColors[a.activity_type] ?? '#F1EFE8' }}>
                  {actIcons[a.activity_type] ?? '⚡'}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="log-name">{a.activity_type} {a.duration_min}분</div>
                  <div className="log-time">{new Date(a.logged_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div className="log-cal" style={{ color: '#1D9E75' }}>−{a.calories_burned}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height: 20 }}/>
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => router.push('/scan')}>+</button>

      {/* 하단 네비 */}
      <div className="bnav">
        <div className="bni">
          <div className="bni-ic">🏠</div>
          <div className="bni-lb on">홈</div>
        </div>
        <div className="bni" onClick={() => router.push('/scan')}>
          <div className="bni-ic" style={{ opacity: 0.4 }}>📸</div>
          <div className="bni-lb">음식</div>
        </div>
        <div className="bni" onClick={() => router.push('/activity')}>
          <div className="bni-ic" style={{ opacity: 0.4 }}>⚡</div>
          <div className="bni-lb">활동</div>
        </div>
        <div className="bni">
          <div className="bni-ic" style={{ opacity: 0.4 }}>📊</div>
          <div className="bni-lb">통계</div>
        </div>
      </div>
    </>
  )
}