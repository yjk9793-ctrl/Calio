'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function HomePage() {
  const router = useRouter()
  const [user, setUser]             = useState<any>(null)
  const [meals, setMeals]           = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [aiComment, setAiComment]   = useState('')
  const [animPctIn, setAnimPctIn]   = useState(0)
  const [animPctOut, setAnimPctOut] = useState(0)
  const [displayNum, setDisplayNum] = useState(0)

  const totalIn   = meals.reduce((s, m) => s + m.calories, 0)
  const totalOut  = activities.reduce((s, a) => s + a.calories_burned, 0)
  const goal      = user?.daily_kcal_goal ?? 2000
  const remaining = goal - totalIn + totalOut
  const pctIn     = Math.min((totalIn / goal) * 100, 100)

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth'); return }
      const today = new Date().toISOString().split('T')[0]
      const [{ data: ud }, { data: md }, { data: ad }] = await Promise.all([
        supabase.from('users').select('*').eq('id', authUser.id).single(),
        supabase.from('meals').select('*').eq('user_id', authUser.id).gte('logged_at', today + 'T00:00:00').order('logged_at', { ascending: false }),
        supabase.from('activities').select('*').eq('user_id', authUser.id).gte('logged_at', today + 'T00:00:00').order('logged_at', { ascending: false }),
      ])
      setUser(ud); setMeals(md ?? []); setActivities(ad ?? [])
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    if (loading) return
    const tIn  = Math.min((totalIn / goal) * 100, 100)
    const tOut = Math.min((totalOut / goal) * 100, 100)
    const tNum = Math.abs(remaining)
    const steps = 80
    let step = 0
    const t = setInterval(() => {
      step++
      const ease = 1 - Math.pow(1 - step / steps, 3)
      setAnimPctIn(tIn * ease)
      setAnimPctOut(tOut * ease)
      setDisplayNum(Math.round(tNum * ease))
      if (step >= steps) {
        clearInterval(t)
        setAnimPctIn(tIn); setAnimPctOut(tOut); setDisplayNum(tNum)
      }
    }, 16)
    return () => clearInterval(t)
  }, [loading])

  useEffect(() => {
    if (!loading && meals.length > 0) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return
        fetch('/api/comment', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` } })
          .then(r => r.json()).then(d => { if (d.comment) setAiComment(d.comment) })
          .catch(() => {})
      })
    }
  }, [loading])

  // 링 끝점 dot 좌표 계산 (JSX 밖에서)
  const R1 = 82, R2 = 60
  const C1 = 2 * Math.PI * R1
  const C2 = 2 * Math.PI * R2

  const dot1Angle = (animPctIn / 100) * 360 - 90
  const dot1Rad   = dot1Angle * Math.PI / 180
  const dot1X     = 100 + R1 * Math.cos(dot1Rad)
  const dot1Y     = 100 + R1 * Math.sin(dot1Rad)

  const dot2Angle = (animPctOut / 100) * 360 - 90
  const dot2Rad   = dot2Angle * Math.PI / 180
  const dot2X     = 100 + R2 * Math.cos(dot2Rad)
  const dot2Y     = 100 + R2 * Math.sin(dot2Rad)

  const actIcons: Record<string,string>  = { exercise:'🏃', reading:'📖', conversation:'💬', walking:'🚶', meditation:'🧘', music:'🎵', other:'⚡' }
  const actColors: Record<string,string> = { exercise:'#E1F5EE', reading:'#E6F1FB', conversation:'#FAEEDA', walking:'#E1F5EE', meditation:'#EEEDFE', music:'#FBEAF0', other:'#F1EFE8' }
  const mealLabel: Record<string,string> = { breakfast:'아침', lunch:'점심', dinner:'저녁', snack:'간식' }

  if (loading) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0F0E0D' }}>
      <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:18, color:'rgba(255,255,255,0.4)' }}>불러오는 중...</div>
    </div>
  )

  return (
    <>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        .hw { min-height:100dvh; background:#F2F1EE; font-family:'Plus Jakarta Sans',sans-serif; max-width:430px; margin:0 auto; padding-bottom:calc(76px + env(safe-area-inset-bottom,0px)); }
        .hero { background:#0F0E0D; border-radius:0 0 36px 36px; padding:0 20px 28px; margin-bottom:16px; }
        .hdr { display:flex; justify-content:space-between; align-items:center; padding:52px 0 20px; }
        .logo-txt { font-family:'Bricolage Grotesque',sans-serif; font-size:28px; font-weight:800; color:#fff; letter-spacing:-0.03em; line-height:1; }
        .date-lbl { font-size:12px; color:rgba(255,255,255,0.35); font-weight:300; margin-top:3px; }
        .av { width:36px; height:36px; border-radius:18px; background:rgba(216,90,48,0.15); display:flex; align-items:center; justify-content:center; font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:700; color:#D85A30; cursor:pointer; border:1px solid rgba(216,90,48,0.25); }
        .ring-wrap { display:flex; flex-direction:column; align-items:center; }
        .ring-legend { display:flex; gap:20px; margin-top:14px; }
        .leg { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:500; }
        .pct-badge { background:rgba(216,90,48,0.12); border:1px solid rgba(216,90,48,0.25); border-radius:20px; padding:5px 14px; font-size:12px; font-weight:600; color:#D85A30; margin-top:10px; }
        .stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0 16px 12px; }
        .stat-card { background:#fff; border-radius:18px; padding:16px 18px; }
        .stat-lbl { font-size:13px; color:#aaa; margin-bottom:6px; }
        .stat-val { font-family:'Bricolage Grotesque',sans-serif; font-size:30px; font-weight:800; line-height:1; }
        .stat-sub { font-size:12px; color:#aaa; font-weight:300; margin-top:4px; }
        .ai-card { background:#fff; border-radius:18px; padding:16px 18px; margin:0 16px 12px; display:flex; gap:12px; align-items:flex-start; }
        .ai-icon { width:36px; height:36px; border-radius:12px; background:#FAECE7; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; font-weight:700; color:#D85A30; }
        .ai-lbl { font-size:11px; font-weight:700; letter-spacing:0.06em; color:#D85A30; margin-bottom:5px; }
        .ai-txt { font-size:14px; color:#0F0E0D; line-height:1.65; }
        .sec { font-family:'Bricolage Grotesque',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#aaa; margin:0 16px 8px; }
        .log-card { background:#fff; border-radius:18px; margin:0 16px; padding:4px 16px; }
        .log-row { display:flex; align-items:center; gap:12px; padding:13px 0; border-bottom:0.5px solid rgba(0,0,0,0.05); }
        .log-row:last-child { border-bottom:none; }
        .log-ic { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .log-nm { font-size:15px; font-weight:500; color:#0F0E0D; }
        .log-tm { font-size:12px; color:#aaa; margin-top:2px; }
        .log-cal { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; }
        .empty { background:#fff; border-radius:18px; margin:0 16px; padding:44px 24px; display:flex; flex-direction:column; align-items:center; text-align:center; }
        .empty-ttl { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; color:#0F0E0D; margin-bottom:6px; margin-top:12px; }
        .empty-sub { font-size:14px; color:#aaa; font-weight:300; line-height:1.5; }
        .fab { position:fixed; bottom:calc(80px + env(safe-area-inset-bottom,0px)); right:20px; width:56px; height:56px; border-radius:28px; background:#D85A30; color:#fff; font-size:28px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1; z-index:10; }
        .bnav { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:430px; background:#fff; border-top:0.5px solid rgba(0,0,0,0.08); display:flex; align-items:center; padding-bottom:env(safe-area-inset-bottom,0px); z-index:10; }
        .bni { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; padding:12px 0; cursor:pointer; }
        .bni-ic { font-size:22px; }
        .bni-lb { font-size:11px; color:#aaa; }
        .bni-lb.on { color:#D85A30; font-weight:700; }
      `}</style>

      <div className="hw">

        {/* 다크 히어로 */}
        <div className="hero">
          <div className="hdr">
            <div>
              <div style={{ display:'flex', alignItems:'baseline' }}>
                <span className="logo-txt">cali</span>
                <svg width="20" height="28" viewBox="0 0 20 28" style={{ overflow:'visible' }}>
                  <circle cx="10" cy="17" r="7" fill="none" stroke="rgba(216,90,48,0.25)" strokeWidth="4.8"/>
                  <circle cx="10" cy="17" r="7" fill="none" stroke="#D85A30" strokeWidth="4.8"
                    strokeDasharray="37 7" strokeLinecap="butt" transform="rotate(-90 10 17)"/>
                  <circle cx="10" cy="10" r="2.4" fill="#D85A30"/>
                </svg>
              </div>
              <div className="date-lbl">
                {new Date().toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'long' })}
              </div>
            </div>
            <div className="av" onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))}>
              {user?.nickname?.[0] ?? '나'}
            </div>
          </div>

          <div className="ring-wrap">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {/* 장식 원 */}
              <circle cx="100" cy="100" r="98" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
              <circle cx="100" cy="100" r="110" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>

              {/* 바깥 링 트랙 */}
              <circle cx="100" cy="100" r={R1} fill="none" stroke="rgba(216,90,48,0.15)" strokeWidth="16"/>
              {/* 바깥 링 채움 */}
              <circle cx="100" cy="100" r={R1} fill="none" stroke="#D85A30" strokeWidth="16"
                strokeDasharray={`${C1 * animPctIn / 100} ${C1}`}
                strokeLinecap="round" transform="rotate(-90 100 100)"/>
              {/* 바깥 링 끝점 dot */}
              {animPctIn > 2 && (
                <circle cx={dot1X} cy={dot1Y} r="8" fill="#FF7A52"/>
              )}

              {/* 안쪽 링 트랙 */}
              <circle cx="100" cy="100" r={R2} fill="none" stroke="rgba(29,158,117,0.15)" strokeWidth="12"/>
              {/* 안쪽 링 채움 */}
              <circle cx="100" cy="100" r={R2} fill="none" stroke="#1D9E75" strokeWidth="12"
                strokeDasharray={`${C2 * animPctOut / 100} ${C2}`}
                strokeLinecap="round" transform="rotate(-90 100 100)"/>
              {/* 안쪽 링 끝점 dot */}
              {animPctOut > 2 && (
                <circle cx={dot2X} cy={dot2Y} r="6" fill="#2DC98A"/>
              )}

              {/* 중앙 텍스트 */}
              <text x="100" y="86" textAnchor="middle"
                style={{ fontFamily:'Bricolage Grotesque,sans-serif', fontSize:11, fontWeight:600, fill:'rgba(255,255,255,0.35)', letterSpacing:'0.12em' }}>
                {remaining >= 0 ? 'REMAINING' : 'EXCEEDED'}
              </text>
              <text x="100" y="120" textAnchor="middle"
                style={{ fontFamily:'Bricolage Grotesque,sans-serif', fontSize:44, fontWeight:800, fill: remaining >= 0 ? '#fff' : '#FF6B6B' }}>
                {displayNum.toLocaleString()}
              </text>
              <text x="100" y="138" textAnchor="middle"
                style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:300, fill:'rgba(255,255,255,0.4)' }}>
                kcal
              </text>
            </svg>

            <div className="ring-legend">
              <div className="leg"><div style={{ width:8, height:8, borderRadius:4, background:'#D85A30' }}/><span style={{ color:'rgba(255,255,255,0.55)' }}>섭취 {totalIn.toLocaleString()}</span></div>
              <div className="leg"><div style={{ width:8, height:8, borderRadius:4, background:'#1D9E75' }}/><span style={{ color:'rgba(255,255,255,0.55)' }}>소비 {totalOut.toLocaleString()}</span></div>
            </div>
            <div className="pct-badge">목표 {goal.toLocaleString()} kcal · {Math.round(pctIn)}% 섭취</div>
          </div>
        </div>

        {/* 스탯 카드 */}
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-lbl">오늘 섭취</div>
            <div className="stat-val" style={{ color:'#D85A30' }}>{totalIn.toLocaleString()}</div>
            <div className="stat-sub">목표 {goal.toLocaleString()} kcal</div>
          </div>
          <div className="stat-card">
            <div className="stat-lbl">활동 소비</div>
            <div className="stat-val" style={{ color:'#1D9E75' }}>{totalOut.toLocaleString()}</div>
            <div className="stat-sub">운동+일상 합산</div>
          </div>
        </div>

        {/* AI 코멘트 */}
        {aiComment && (
          <div className="ai-card">
            <div className="ai-icon">✦</div>
            <div>
              <div className="ai-lbl">calio AI</div>
              <div className="ai-txt">{aiComment}</div>
            </div>
          </div>
        )}

        {/* 오늘 기록 */}
        <div className="sec">오늘의 기록</div>

        {meals.length === 0 && activities.length === 0 ? (
          <div className="empty">
            <div style={{ fontSize:40 }}>🍽️</div>
            <div className="empty-ttl">아직 기록이 없어요</div>
            <div className="empty-sub">+ 버튼을 눌러<br/>첫 음식을 기록해봐요</div>
          </div>
        ) : (
          <div className="log-card">
            {meals.map(m => (
              <div key={m.id} className="log-row">
                <div className="log-ic" style={{ background:'#FAECE7' }}>🍽️</div>
                <div style={{ flex:1 }}>
                  <div className="log-nm">{m.meal_name}</div>
                  <div className="log-tm">{mealLabel[m.meal_type ?? 'snack']} · {new Date(m.logged_at).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })}</div>
                </div>
                <div className="log-cal" style={{ color:'#D85A30' }}>+{m.calories}</div>
              </div>
            ))}
            {activities.map(a => (
              <div key={a.id} className="log-row">
                <div className="log-ic" style={{ background: actColors[a.activity_type] ?? '#F1EFE8' }}>
                  {actIcons[a.activity_type] ?? '⚡'}
                </div>
                <div style={{ flex:1 }}>
                  <div className="log-nm">{a.activity_type} {a.duration_min}분</div>
                  <div className="log-tm">{new Date(a.logged_at).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })}</div>
                </div>
                <div className="log-cal" style={{ color:'#1D9E75' }}>−{a.calories_burned}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height:20 }}/>
      </div>

      <button className="fab" onClick={() => router.push('/scan')}>+</button>

      <div className="bnav">
        <div className="bni"><div className="bni-ic">🏠</div><div className="bni-lb on">홈</div></div>
        <div className="bni" onClick={() => router.push('/scan')}><div className="bni-ic" style={{ opacity:0.35 }}>📸</div><div className="bni-lb">음식</div></div>
        <div className="bni" onClick={() => router.push('/activity')}><div className="bni-ic" style={{ opacity:0.35 }}>⚡</div><div className="bni-lb">활동</div></div>
        <div className="bni"><div className="bni-ic" style={{ opacity:0.35 }}>📊</div><div className="bni-lb">통계</div></div>
      </div>
    </>
  )
}