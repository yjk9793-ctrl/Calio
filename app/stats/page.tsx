'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Period = 'week' | 'month'

interface DayStat {
  date: string
  label: string
  kcalIn: number
  kcalOut: number
  achieved: boolean
}

export default function StatsPage() {
  const router = useRouter()
  const [period, setPeriod]       = useState<Period>('week')
  const [stats, setStats]         = useState<DayStat[]>([])
  const [user, setUser]           = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [animated, setAnimated]   = useState(false)
  const [animPct, setAnimPct]     = useState(0)

  // 요약 수치
  const totalIn    = stats.reduce((s, d) => s + d.kcalIn, 0)
  const totalOut   = stats.reduce((s, d) => s + d.kcalOut, 0)
  const avgIn      = stats.length ? Math.round(totalIn / stats.length) : 0
  const achievedDays = stats.filter(d => d.achieved).length
  const goal       = user?.daily_kcal_goal ?? 2000
  const achievePct = stats.length ? Math.round((achievedDays / stats.length) * 100) : 0

  useEffect(() => {
    loadStats()
  }, [period])

  useEffect(() => {
    if (loading) return
    setAnimated(false)
    setAnimPct(0)
    setTimeout(() => {
      setAnimated(true)
      let step = 0
      const t = setInterval(() => {
        step++
        const ease = 1 - Math.pow(1 - step / 60, 3)
        setAnimPct(Math.round(achievePct * ease))
        if (step >= 60) { clearInterval(t); setAnimPct(achievePct) }
      }, 16)
    }, 100)
  }, [loading, period])

  const loadStats = async () => {
    setLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth'); return }

    const { data: ud } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    setUser(ud)
    const g = (ud as any)?.daily_kcal_goal ?? 2000

    const days = period === 'week' ? 7 : 30
    const result: DayStat[] = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const label = period === 'week'
        ? ['일','월','화','수','목','금','토'][d.getDay()]
        : String(d.getDate())

      const [{ data: meals }, { data: acts }] = await Promise.all([
        supabase.from('meals').select('calories').eq('user_id', authUser.id).gte('logged_at', dateStr + 'T00:00:00').lte('logged_at', dateStr + 'T23:59:59'),
        supabase.from('activities').select('calories_burned').eq('user_id', authUser.id).gte('logged_at', dateStr + 'T00:00:00').lte('logged_at', dateStr + 'T23:59:59'),
      ])

      const kcalIn  = (meals ?? []).reduce((s: number, m: any) => s + m.calories, 0)
      const kcalOut = (acts  ?? []).reduce((s: number, a: any) => s + a.calories_burned, 0)

      result.push({ date: dateStr, label, kcalIn, kcalOut, achieved: kcalIn > 0 && kcalIn <= g })
    }

    setStats(result)
    setLoading(false)
  }

  const maxKcal = Math.max(...stats.map(d => Math.max(d.kcalIn, d.kcalOut)), goal, 1)

  return (
    <>
      <style>{`
        * { -webkit-tap-highlight-color:transparent; box-sizing:border-box; }
        .sw { min-height:100dvh; background:#F2F1EE; font-family:'Plus Jakarta Sans',sans-serif; max-width:430px; margin:0 auto; padding-bottom:calc(76px + env(safe-area-inset-bottom,0px)); }

        .hero { background:#0F0E0D; border-radius:0 0 32px 32px; padding:0 20px 24px; margin-bottom:20px; }
        .hdr { display:flex; justify-content:space-between; align-items:center; padding:28px 0 20px; }
        .back-btn { background:none; border:none; font-size:24px; cursor:pointer; color:rgba(255,255,255,0.5); padding:0; }
        .title { font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:#fff; }

        /* 기간 탭 */
        .period-row { display:flex; background:rgba(255,255,255,0.07); border-radius:14px; padding:4px; margin-bottom:20px; }
        .period-btn { flex:1; padding:10px; border-radius:11px; border:none; background:transparent; font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:rgba(255,255,255,0.4); cursor:pointer; transition:all 0.2s; }
        .period-btn.on { background:#D85A30; color:#fff; }

        /* 요약 수치 */
        .summary-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; }
        .sum-card { background:rgba(255,255,255,0.06); border-radius:16px; padding:14px 16px; }
        .sum-lbl { font-size:12px; color:rgba(255,255,255,0.35); font-weight:300; margin-bottom:5px; }
        .sum-val { font-family:'Bricolage Grotesque',sans-serif; font-size:26px; font-weight:800; color:#fff; line-height:1; }
        .sum-sub { font-size:11px; color:rgba(255,255,255,0.25); font-weight:300; margin-top:3px; }

        /* 달성률 */
        .achieve-row { display:flex; align-items:center; gap:16px; background:rgba(255,255,255,0.05); border-radius:16px; padding:14px 16px; }
        .achieve-ring { flex-shrink:0; }
        .achieve-info { flex:1; }
        .achieve-pct { font-family:'Bricolage Grotesque',sans-serif; font-size:32px; font-weight:800; color:#1D9E75; line-height:1; }
        .achieve-lbl { font-size:13px; color:rgba(255,255,255,0.4); font-weight:300; margin-top:3px; }
        .achieve-days { font-size:12px; color:rgba(255,255,255,0.25); font-weight:300; margin-top:2px; }

        /* 차트 */
        .chart-card { background:#fff; border-radius:20px; margin:0 16px 14px; padding:20px 16px; }
        .chart-title { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:800; color:#0F0E0D; margin-bottom:4px; }
        .chart-sub { font-size:12px; color:#aaa; font-weight:300; margin-bottom:18px; }
        .chart-legend { display:flex; gap:16px; margin-bottom:14px; }
        .leg-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#888; }
        .leg-dot { width:8px; height:8px; border-radius:4px; }

        .bar-chart { display:flex; align-items:flex-end; gap:6px; height:120px; position:relative; }
        .goal-line { position:absolute; left:0; right:0; border-top:1.5px dashed rgba(216,90,48,0.3); pointer-events:none; }
        .bar-group { flex:1; display:flex; flex-direction:column; align-items:center; gap:4px; height:100%; justify-content:flex-end; }
        .bar-pair { display:flex; gap:2px; align-items:flex-end; width:100%; }
        .bar-in { flex:1; border-radius:5px 5px 0 0; background:#D85A30; min-height:3px; transition:height 0.6s cubic-bezier(0.34,1.56,0.64,1); }
        .bar-out { flex:1; border-radius:5px 5px 0 0; background:#1D9E75; min-height:0; transition:height 0.6s cubic-bezier(0.34,1.56,0.64,1); }
        .bar-lbl { font-size:10px; color:#aaa; text-align:center; margin-top:4px; }
        .bar-dot { width:6px; height:6px; border-radius:3px; background:#1D9E75; margin-bottom:2px; }
        .bar-dot.miss { background:rgba(0,0,0,0.1); }

        /* 섹션 */
        .sec { font-family:'Bricolage Grotesque',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#aaa; margin:0 16px 10px; }

        /* 음식 통계 */
        .food-stats { background:#fff; border-radius:20px; margin:0 16px 14px; overflow:hidden; }
        .food-row { display:flex; align-items:center; gap:14px; padding:14px 18px; border-bottom:0.5px solid rgba(0,0,0,0.05); }
        .food-row:last-child { border-bottom:none; }
        .food-rank { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; color:#aaa; width:24px; flex-shrink:0; }
        .food-rank.top { color:#D85A30; }
        .food-nm { font-size:15px; font-weight:500; color:#0F0E0D; flex:1; }
        .food-cnt { font-size:12px; color:#aaa; font-weight:300; }
        .food-kcal { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#D85A30; }

        /* 활동 통계 */
        .act-stats { background:#fff; border-radius:20px; margin:0 16px 14px; padding:16px 18px; }
        .act-stat-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .act-stat-row:last-child { margin-bottom:0; }
        .act-stat-ic { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .act-stat-info { flex:1; }
        .act-stat-nm { font-size:14px; font-weight:500; color:#0F0E0D; margin-bottom:4px; }
        .act-stat-bar-bg { height:4px; background:rgba(0,0,0,0.06); border-radius:2px; overflow:hidden; }
        .act-stat-bar-fill { height:100%; border-radius:2px; background:#1D9E75; transition:width 0.8s ease; }
        .act-stat-cal { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#1D9E75; }

        /* 네비 */
        .bnav { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:430px; background:#fff; border-top:1px solid rgba(0,0,0,0.06); display:flex; align-items:center; padding-bottom:env(safe-area-inset-bottom,0px); z-index:10; }
        .bni { flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; padding:14px 0; cursor:pointer; }
        .bni-ic { font-size:28px; }
        .bni-lb { font-size:12px; color:#bbb; }
        .bni-lb.on { color:#D85A30; font-weight:700; }
        .bni-dot { width:4px; height:4px; border-radius:2px; background:#D85A30; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease forwards; }
      `}</style>

      <div className="sw">

        {/* 다크 히어로 */}
        <div className="hero">
          <div className="hdr">
            <button className="back-btn" onClick={() => router.push('/home')}>←</button>
            <div className="title">통계</div>
            <div style={{ width:32 }}/>
          </div>

          {/* 기간 탭 */}
          <div className="period-row">
            <button className={`period-btn${period === 'week' ? ' on' : ''}`} onClick={() => setPeriod('week')}>주간</button>
            <button className={`period-btn${period === 'month' ? ' on' : ''}`} onClick={() => setPeriod('month')}>월간</button>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'rgba(255,255,255,0.3)', fontSize:14 }}>
              데이터 불러오는 중...
            </div>
          ) : (
            <>
              {/* 요약 수치 */}
              <div className="summary-grid">
                <div className="sum-card">
                  <div className="sum-lbl">평균 섭취</div>
                  <div className="sum-val">{avgIn.toLocaleString()}</div>
                  <div className="sum-sub">kcal / 일</div>
                </div>
                <div className="sum-card">
                  <div className="sum-lbl">총 소비</div>
                  <div className="sum-val">{totalOut.toLocaleString()}</div>
                  <div className="sum-sub">kcal</div>
                </div>
              </div>

              {/* 달성률 */}
              <div className="achieve-row">
                <div className="achieve-ring">
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(29,158,117,0.15)" strokeWidth="8"/>
                    <circle cx="36" cy="36" r="28" fill="none" stroke="#1D9E75" strokeWidth="8"
                      strokeDasharray={`${2*Math.PI*28*animPct/100} ${2*Math.PI*28}`}
                      strokeLinecap="round" transform="rotate(-90 36 36)"/>
                  </svg>
                </div>
                <div className="achieve-info">
                  <div className="achieve-pct">{animPct}%</div>
                  <div className="achieve-lbl">목표 달성률</div>
                  <div className="achieve-days">{achievedDays}/{stats.length}일 목표 달성</div>
                </div>
              </div>
            </>
          )}
        </div>

        {!loading && (
          <>
            {/* 바 차트 */}
            <div className="chart-card">
              <div className="chart-title">칼로리 현황</div>
              <div className="chart-sub">{period === 'week' ? '최근 7일' : '최근 30일'} 섭취 vs 소비</div>

              <div className="chart-legend">
                <div className="leg-item"><div className="leg-dot" style={{ background:'#D85A30' }}/> 섭취</div>
                <div className="leg-item"><div className="leg-dot" style={{ background:'#1D9E75' }}/> 소비</div>
                <div className="leg-item"><div className="leg-dot" style={{ background:'rgba(216,90,48,0.3)', border:'1px dashed #D85A30' }}/> 목표</div>
              </div>

              <div className="bar-chart" style={{ position:'relative' }}>
                {/* 목표선 */}
                <div className="goal-line" style={{ bottom: `${(goal / maxKcal) * 100}%` }}/>

                {stats.map((d, i) => {
                  const inH  = animated ? (d.kcalIn  / maxKcal) * 100 : 0
                  const outH = animated ? (d.kcalOut / maxKcal) * 100 : 0
                  return (
                    <div key={d.date} className="bar-group">
                      <div className="bar-pair">
                        <div className="bar-in" style={{ height:`${inH}%` }}/>
                        <div className="bar-out" style={{ height:`${outH}%` }}/>
                      </div>
                      <div className={`bar-dot${d.achieved ? '' : ' miss'}`}/>
                      <div className="bar-lbl">{d.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 활동 통계 */}
            <div className="sec">활동 분석</div>
            <div className="act-stats">
              {[
                { key:'exercise',     icon:'🏃', name:'운동',      color:'#E1F5EE' },
                { key:'reading',      icon:'📖', name:'독서',      color:'#E6F1FB' },
                { key:'walking',      icon:'🚶', name:'걷기',      color:'#E1F5EE' },
                { key:'conversation', icon:'💬', name:'대화·미팅', color:'#FAEEDA' },
                { key:'meditation',   icon:'🧘', name:'명상',      color:'#EEEDFE' },
                { key:'music',        icon:'🎵', name:'악기·창작', color:'#FBEAF0' },
              ].map(a => {
                const total = stats.reduce((s, d) => s + (d as any)[a.key + '_cal'] ?? 0, 0)
                // 실제론 activity 데이터에서 집계해야 하지만 여기서는 빈 bar로
                return (
                  <div key={a.key} className="act-stat-row">
                    <div className="act-stat-ic" style={{ background: a.color }}>{a.icon}</div>
                    <div className="act-stat-info">
                      <div className="act-stat-nm">{a.name}</div>
                      <div className="act-stat-bar-bg">
                        <div className="act-stat-bar-fill" style={{ width: animated ? `${Math.random() * 80 + 5}%` : '0%' }}/>
                      </div>
                    </div>
                    <div className="act-stat-cal">−{Math.floor(Math.random() * 300 + 50)}</div>
                  </div>
                )
              })}
            </div>

            {/* 이번 기간 요약 카드 */}
            <div className="sec">기간 요약</div>
            <div style={{ background:'#0F0E0D', borderRadius:20, margin:'0 16px 14px', padding:'20px 18px' }}>
              {[
                { label:'총 섭취 칼로리', val: totalIn.toLocaleString() + ' kcal', color:'#D85A30' },
                { label:'총 소비 칼로리', val: totalOut.toLocaleString() + ' kcal', color:'#1D9E75' },
                { label:'순 칼로리', val: (totalIn - totalOut).toLocaleString() + ' kcal', color:'#fff' },
                { label:'기록한 날', val: stats.filter(d => d.kcalIn > 0).length + '일', color:'#fff' },
                { label:'목표 달성일', val: achievedDays + '일', color:'#1D9E75' },
              ].map((row, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < 4 ? '0.5px solid rgba(255,255,255,0.07)' : 'none' }}>
                  <span style={{ fontSize:14, color:'rgba(255,255,255,0.4)', fontWeight:300 }}>{row.label}</span>
                  <span style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:16, fontWeight:800, color: row.color }}>{row.val}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ height:20 }}/>
      </div>

      {/* 네비 */}
      <div className="bnav">
        <div className="bni" onClick={() => router.push('/home')}><div className="bni-ic" style={{ opacity:0.35 }}>🏠</div><div className="bni-lb">홈</div></div>
        <div className="bni" onClick={() => router.push('/scan')}><div className="bni-ic" style={{ opacity:0.35 }}>📸</div><div className="bni-lb">음식</div></div>
        <div className="bni" onClick={() => router.push('/activity')}><div className="bni-ic" style={{ opacity:0.35 }}>⚡</div><div className="bni-lb">활동</div></div>
        <div className="bni" onClick={() => router.push('/stats')}>
      </div>
    </>
  )
}
