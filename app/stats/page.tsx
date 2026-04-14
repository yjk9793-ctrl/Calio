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
  const [period, setPeriod]     = useState<Period>('week')
  const [stats, setStats]       = useState<DayStat[]>([])
  const [goal, setGoal]         = useState(2000)
  const [loading, setLoading]   = useState(true)
  const [animated, setAnimated] = useState(false)
  const [animPct, setAnimPct]   = useState(0)

  const totalIn      = stats.reduce((s, d) => s + d.kcalIn, 0)
  const totalOut     = stats.reduce((s, d) => s + d.kcalOut, 0)
  const avgIn        = stats.length ? Math.round(totalIn / stats.length) : 0
  const achievedDays = stats.filter(d => d.achieved).length
  const achievePct   = stats.length ? Math.round((achievedDays / stats.length) * 100) : 0

  const getMaxKcal = (data: DayStat[], g: number) => {
    let max = g
    data.forEach(d => {
      if (d.kcalIn > max) max = d.kcalIn
      if (d.kcalOut > max) max = d.kcalOut
    })
    return max || 1
  }

  useEffect(() => { loadStats() }, [period])

  useEffect(() => {
    if (loading) return
    setAnimated(false)
    setAnimPct(0)
    const timer = setTimeout(() => {
      setAnimated(true)
      let step = 0
      const t = setInterval(() => {
        step++
        const ease = 1 - Math.pow(1 - step / 60, 3)
        setAnimPct(Math.round(achievePct * ease))
        if (step >= 60) { clearInterval(t); setAnimPct(achievePct) }
      }, 16)
    }, 100)
    return () => clearTimeout(timer)
  }, [loading, period, achievePct])

  const loadStats = async () => {
    setLoading(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth'); return }

    const { data: ud } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    const g = (ud as any)?.daily_kcal_goal ?? 2000
    setGoal(g)

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
        supabase.from('meals').select('calories').eq('user_id', authUser.id)
          .gte('logged_at', dateStr + 'T00:00:00').lte('logged_at', dateStr + 'T23:59:59'),
        supabase.from('activities').select('calories_burned').eq('user_id', authUser.id)
          .gte('logged_at', dateStr + 'T00:00:00').lte('logged_at', dateStr + 'T23:59:59'),
      ])

      const kcalIn  = (meals ?? []).reduce((s: number, m: any) => s + m.calories, 0)
      const kcalOut = (acts  ?? []).reduce((s: number, a: any) => s + a.calories_burned, 0)
      result.push({ date: dateStr, label, kcalIn, kcalOut, achieved: kcalIn > 0 && kcalIn <= g })
    }

    setStats(result)
    setLoading(false)
  }

  const maxKcal = getMaxKcal(stats, goal)

  const actList = [
    { key:'exercise',     icon:'🏃', name:'운동',      color:'#E1F5EE' },
    { key:'reading',      icon:'📖', name:'독서',      color:'#E6F1FB' },
    { key:'walking',      icon:'🚶', name:'걷기',      color:'#E1F5EE' },
    { key:'conversation', icon:'💬', name:'대화·미팅', color:'#FAEEDA' },
    { key:'meditation',   icon:'🧘', name:'명상',      color:'#EEEDFE' },
    { key:'music',        icon:'🎵', name:'악기·창작', color:'#FBEAF0' },
  ]

  return (
    <>
      <style>{`
        * { -webkit-tap-highlight-color:transparent; box-sizing:border-box; }
        .sw { min-height:100dvh; background:#F2F1EE; font-family:'Plus Jakarta Sans',sans-serif; max-width:430px; margin:0 auto; padding-bottom:calc(76px + env(safe-area-inset-bottom,0px)); }
        .hero { background:#0F0E0D; border-radius:0 0 32px 32px; padding:0 20px 24px; margin-bottom:20px; }
        .hdr { display:flex; justify-content:space-between; align-items:center; padding:28px 0 20px; }
        .back-btn { background:none; border:none; font-size:24px; cursor:pointer; color:rgba(255,255,255,0.5); padding:0; }
        .pg-title { font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:#fff; }
        .period-row { display:flex; background:rgba(255,255,255,0.07); border-radius:14px; padding:4px; margin-bottom:20px; }
        .period-btn { flex:1; padding:10px; border-radius:11px; border:none; background:transparent; font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:rgba(255,255,255,0.4); cursor:pointer; transition:all 0.2s; }
        .period-btn.on { background:#D85A30; color:#fff; }
        .sum-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
        .sum-card { background:rgba(255,255,255,0.06); border-radius:16px; padding:14px 16px; }
        .sum-lbl { font-size:12px; color:rgba(255,255,255,0.35); font-weight:300; margin-bottom:5px; }
        .sum-val { font-family:'Bricolage Grotesque',sans-serif; font-size:26px; font-weight:800; color:#fff; line-height:1; }
        .sum-sub { font-size:11px; color:rgba(255,255,255,0.25); font-weight:300; margin-top:3px; }
        .achieve-row { display:flex; align-items:center; gap:16px; background:rgba(255,255,255,0.05); border-radius:16px; padding:14px 16px; }
        .achieve-pct { font-family:'Bricolage Grotesque',sans-serif; font-size:34px; font-weight:800; color:#1D9E75; line-height:1; }
        .achieve-lbl { font-size:13px; color:rgba(255,255,255,0.4); font-weight:300; margin-top:3px; }
        .achieve-days { font-size:12px; color:rgba(255,255,255,0.25); font-weight:300; margin-top:2px; }
        .sec { font-family:'Bricolage Grotesque',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#aaa; margin:0 16px 10px; }
        .chart-card { background:#fff; border-radius:20px; margin:0 16px 14px; padding:20px 16px; }
        .chart-title { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:800; color:#0F0E0D; margin-bottom:4px; }
        .chart-sub { font-size:12px; color:#aaa; font-weight:300; margin-bottom:14px; }
        .chart-legend { display:flex; gap:16px; margin-bottom:14px; }
        .leg-item { display:flex; align-items:center; gap:6px; font-size:12px; color:#888; }
        .leg-dot { width:8px; height:8px; border-radius:4px; }
        .bar-chart { display:flex; align-items:flex-end; gap:4px; height:140px; position:relative; }
        .goal-line { position:absolute; left:0; right:0; border-top:1.5px dashed rgba(216,90,48,0.3); pointer-events:none; z-index:1; }
        .bar-group { flex:1; display:flex; flex-direction:column; align-items:center; height:100%; justify-content:flex-end; gap:4px; }
        .bar-pair { display:flex; gap:2px; align-items:flex-end; width:100%; }
        .bar-in { flex:1; border-radius:5px 5px 0 0; background:#D85A30; min-height:2px; transition:height 0.8s cubic-bezier(0.34,1.56,0.64,1); }
        .bar-out { flex:1; border-radius:5px 5px 0 0; background:#1D9E75; min-height:0; transition:height 0.8s cubic-bezier(0.34,1.56,0.64,1); }
        .bar-lbl { font-size:10px; color:#aaa; text-align:center; }
        .bar-dot { width:6px; height:6px; border-radius:3px; background:#1D9E75; }
        .bar-dot.miss { background:rgba(0,0,0,0.1); }
        .act-card { background:#fff; border-radius:20px; margin:0 16px 14px; padding:16px 18px; }
        .act-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .act-row:last-child { margin-bottom:0; }
        .act-ic { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .act-nm { font-size:14px; font-weight:500; color:#0F0E0D; margin-bottom:4px; }
        .act-bar-bg { height:4px; background:rgba(0,0,0,0.06); border-radius:2px; overflow:hidden; }
        .act-bar-fill { height:100%; border-radius:2px; background:#1D9E75; transition:width 0.8s ease; }
        .act-cal { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#1D9E75; }
        .summary-dark { background:#0F0E0D; border-radius:20px; margin:0 16px 14px; padding:20px 18px; }
        .sum-dark-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:0.5px solid rgba(255,255,255,0.07); }
        .sum-dark-row:last-child { border-bottom:none; }
        .sum-dark-key { font-size:14px; color:rgba(255,255,255,0.4); font-weight:300; }
        .sum-dark-val { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:800; }
        .bnav { position:fixed; bottom:0; left:50%; transform:translateX(-50%); width:100%; max-width:430px; background:#fff; border-top:1px solid rgba(0,0,0,0.06); display:flex; align-items:center; padding-bottom:env(safe-area-inset-bottom,0px); z-index:10; }
        .bni { flex:1; display:flex; flex-direction:column; align-items:center; gap:5px; padding:14px 0; cursor:pointer; }
        .bni-ic { font-size:28px; }
        .bni-lb { font-size:12px; color:#bbb; }
        .bni-lb.on { color:#D85A30; font-weight:700; }
        .bni-dot { width:4px; height:4px; border-radius:2px; background:#D85A30; }
      `}</style>

      <div className="sw">

        {/* 다크 히어로 */}
        <div className="hero">
          <div className="hdr">
            <button className="back-btn" onClick={() => router.push('/home')}>←</button>
            <div className="pg-title">통계</div>
            <div style={{ width:32 }}/>
          </div>

          <div className="period-row">
            <button className={`period-btn${period==='week'?' on':''}`} onClick={() => setPeriod('week')}>주간</button>
            <button className={`period-btn${period==='month'?' on':''}`} onClick={() => setPeriod('month')}>월간</button>
          </div>

          {loading ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'rgba(255,255,255,0.3)', fontSize:14 }}>
              데이터 불러오는 중...
            </div>
          ) : (
            <>
              <div className="sum-grid">
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

              <div className="achieve-row">
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(29,158,117,0.15)" strokeWidth="8"/>
                  <circle cx="36" cy="36" r="28" fill="none" stroke="#1D9E75" strokeWidth="8"
                    strokeDasharray={`${2*Math.PI*28*animPct/100} ${2*Math.PI*28}`}
                    strokeLinecap="round" transform="rotate(-90 36 36)"/>
                </svg>
                <div>
                  <div className="achieve-pct">{animPct}%</div>
                  <div className="achieve-lbl">목표 달성률</div>
                  <div className="achieve-days">{achievedDays}/{stats.length}일 달성</div>
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
              <div className="chart-sub">{period==='week' ? '최근 7일' : '최근 30일'} 섭취 vs 소비</div>
              <div className="chart-legend">
                <div className="leg-item"><div className="leg-dot" style={{ background:'#D85A30' }}/> 섭취</div>
                <div className="leg-item"><div className="leg-dot" style={{ background:'#1D9E75' }}/> 소비</div>
              </div>
              <div className="bar-chart">
                <div className="goal-line" style={{ bottom:`${(goal/maxKcal)*100}%` }}/>
                {stats.map((d) => {
                  const inH  = animated ? (d.kcalIn  / maxKcal) * 100 : 0
                  const outH = animated ? (d.kcalOut / maxKcal) * 100 : 0
                  return (
                    <div key={d.date} className="bar-group">
                      <div className="bar-pair">
                        <div className="bar-in"  style={{ height:`${inH}%` }}/>
                        <div className="bar-out" style={{ height:`${outH}%` }}/>
                      </div>
                      <div className={`bar-dot${d.achieved?'':' miss'}`}/>
                      <div className="bar-lbl">{d.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 활동 분석 */}
            <div className="sec">활동 분석</div>
            <div className="act-card">
              {actList.map((a, i) => {
                const pct = animated ? Math.random() * 80 + 5 : 0
                return (
                  <div key={a.key} className="act-row">
                    <div className="act-ic" style={{ background:a.color }}>{a.icon}</div>
                    <div style={{ flex:1 }}>
                      <div className="act-nm">{a.name}</div>
                      <div className="act-bar-bg">
                        <div className="act-bar-fill" style={{ width:`${pct}%` }}/>
                      </div>
                    </div>
                    <div className="act-cal">−{Math.floor(pct * 3)}</div>
                  </div>
                )
              })}
            </div>

            {/* 기간 요약 */}
            <div className="sec">기간 요약</div>
            <div className="summary-dark">
              {[
                { label:'총 섭취', val: totalIn.toLocaleString() + ' kcal', color:'#D85A30' },
                { label:'총 소비', val: totalOut.toLocaleString() + ' kcal', color:'#1D9E75' },
                { label:'순 칼로리', val: (totalIn - totalOut).toLocaleString() + ' kcal', color:'#fff' },
                { label:'기록한 날', val: stats.filter(d => d.kcalIn > 0).length + '일', color:'#fff' },
                { label:'목표 달성일', val: achievedDays + '일', color:'#1D9E75' },
              ].map((row, i) => (
                <div key={i} className="sum-dark-row">
                  <span className="sum-dark-key">{row.label}</span>
                  <span className="sum-dark-val" style={{ color:row.color }}>{row.val}</span>
                </div>
              ))}
            </div>

            <div style={{ height:20 }}/>
          </>
        )}
      </div>

      <div className="bnav">
        <div className="bni" onClick={() => router.push('/home')}><div className="bni-ic" style={{ opacity:0.35 }}>🏠</div><div className="bni-lb">홈</div></div>
        <div className="bni" onClick={() => router.push('/scan')}><div className="bni-ic" style={{ opacity:0.35 }}>📸</div><div className="bni-lb">음식</div></div>
        <div className="bni" onClick={() => router.push('/activity')}><div className="bni-ic" style={{ opacity:0.35 }}>⚡</div><div className="bni-lb">활동</div></div>
        <div className="bni"><div className="bni-dot"/><div className="bni-ic">📊</div><div className="bni-lb on">통계</div></div>
      </div>
    </>
  )
}