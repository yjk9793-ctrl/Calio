'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import InAppNotification from '@/components/InAppNotification'

interface AiComment { today: string; tomorrow: string }

interface Earning {
  id: string
  icon: string
  label: string
  amount: number
  achieved: boolean
  desc: string
}

export default function HomePage() {
  const router = useRouter()
  const [user, setUser]               = useState<any>(null)
  const [meals, setMeals]             = useState<any[]>([])
  const [activities, setActivities]   = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [aiComment, setAiComment]     = useState<AiComment | null>(null)
  const [aiLoading, setAiLoading]     = useState(false)
  const [monthlyTotal, setMonthlyTotal] = useState(0)
  const [todayTotal, setTodayTotal]   = useState(0)
  const [animPctIn, setAnimPctIn]     = useState(0)
  const [animPctOut, setAnimPctOut]   = useState(0)
  const [displayNum, setDisplayNum]   = useState(0)
  const [displayToday, setDisplayToday] = useState(0)
  const [displayMonthly, setDisplayMonthly] = useState(0)
  const [showBank, setShowBank]       = useState(true)

  const totalIn   = meals.reduce((s, m) => s + m.calories, 0)
  const totalOut  = activities.reduce((s, a) => s + a.calories_burned, 0)
  const goal      = user?.daily_kcal_goal ?? 2000
  const remaining = goal - totalIn + totalOut
  const pctIn     = Math.min((totalIn / goal) * 100, 100)

  // 수익 계산
  const calcEarnings = (): Earning[] => {
    const pctOfGoal = totalIn > 0 ? (totalIn / goal) * 100 : 0
    const isBalanced = pctOfGoal >= 90 && pctOfGoal <= 110
    const hasVeggieProtein = meals.some(m =>
      m.meal_name?.match(/채소|샐러드|닭|두부|달걀|생선|단백질|브로콜리|시금치|콩|계란|연어|참치|소고기/))
    const hasActivity = activities.some(a => ['exercise','walking','running'].includes(a.activity_type))
    const hasLifestyle = activities.some(a => ['reading','conversation','meditation','music'].includes(a.activity_type))

    const items: Earning[] = [
      {
        id: 'balanced',
        icon: '⚖️',
        label: '균형 식사',
        amount: 10000,
        achieved: isBalanced,
        desc: `목표 칼로리 ±10% 이내 (현재 ${Math.round(pctOfGoal)}%)`,
      },
      {
        id: 'healthy',
        icon: '🥗',
        label: '건강한 식사',
        amount: 10000,
        achieved: hasVeggieProtein,
        desc: '채소·단백질이 포함된 식사',
      },
      {
        id: 'activity',
        icon: '🏃',
        label: '운동·러닝',
        amount: 10000,
        achieved: hasActivity,
        desc: '운동, 걷기, 러닝 기록',
      },
      {
        id: 'lifestyle',
        icon: '📖',
        label: '일상 활동',
        amount: 10000,
        achieved: hasLifestyle,
        desc: '독서, 대화, 명상 등 기록',
      },
    ]

    const allAchieved = items.every(i => i.achieved)
    if (allAchieved) {
      items.push({
        id: 'perfect',
        icon: '🏆',
        label: '완벽한 하루 보너스',
        amount: 20000,
        achieved: true,
        desc: '4가지 모두 달성!',
      })
    }

    return items
  }

  const earnings = calcEarnings()
  const todayEarned = earnings.reduce((s, e) => s + (e.achieved ? e.amount : 0), 0)
  const achievedCount = earnings.filter(e => e.achieved && e.id !== 'perfect').length

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth'); return }

      const today = new Date().toISOString().split('T')[0]
      const monthStart = today.slice(0, 7) + '-01'

      const [{ data: ud }, { data: md }, { data: ad }] = await Promise.all([
        supabase.from('users').select('*').eq('id', authUser.id).single(),
        supabase.from('meals').select('*').eq('user_id', authUser.id).gte('logged_at', today + 'T00:00:00').order('logged_at', { ascending: false }),
        supabase.from('activities').select('*').eq('user_id', authUser.id).gte('logged_at', today + 'T00:00:00').order('logged_at', { ascending: false }),
      ])

      setUser(ud); setMeals(md ?? []); setActivities(ad ?? [])

      // 이번 달 누적 (간단히 streak_days로 추정)
      const streakDays = (ud as any)?.streak_days ?? 0
      setMonthlyTotal(streakDays * 30000)
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    if (loading) return
    const tIn  = Math.min((totalIn / goal) * 100, 100)
    const tOut = Math.min((totalOut / goal) * 100, 100)
    const steps = 80; let step = 0
    const t = setInterval(() => {
      step++
      const ease = 1 - Math.pow(1 - step / steps, 3)
      setAnimPctIn(tIn * ease)
      setAnimPctOut(tOut * ease)
      setDisplayNum(Math.round(Math.abs(remaining) * ease))
      setDisplayToday(Math.round(todayEarned * ease))
      setDisplayMonthly(Math.round(monthlyTotal * ease))
      if (step >= steps) {
        clearInterval(t)
        setAnimPctIn(tIn); setAnimPctOut(tOut)
        setDisplayNum(Math.abs(remaining))
        setDisplayToday(todayEarned)
        setDisplayMonthly(monthlyTotal)
      }
    }, 16)
    return () => clearInterval(t)
  }, [loading, todayEarned])

  useEffect(() => {
    if (!loading && meals.length > 0) {
      setAiLoading(true)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return
        fetch('/api/comment', { method: 'POST', headers: { 'Authorization': `Bearer ${session.access_token}` } })
          .then(r => r.json())
          .then(d => {
            if (d.comment) {
              if (typeof d.comment === 'object' && d.comment.today) setAiComment(d.comment)
              else { try { setAiComment(JSON.parse(d.comment)) } catch { setAiComment({ today: d.comment, tomorrow: '' }) } }
            }
          }).catch(() => {}).finally(() => setAiLoading(false))
      })
    }
  }, [loading])

  const R1 = 82, R2 = 60
  const C1 = 2 * Math.PI * R1, C2 = 2 * Math.PI * R2
  const dot1X = 100 + R1 * Math.cos(((animPctIn/100)*360-90)*Math.PI/180)
  const dot1Y = 100 + R1 * Math.sin(((animPctIn/100)*360-90)*Math.PI/180)
  const dot2X = 100 + R2 * Math.cos(((animPctOut/100)*360-90)*Math.PI/180)
  const dot2Y = 100 + R2 * Math.sin(((animPctOut/100)*360-90)*Math.PI/180)

  const actIcons: Record<string,string> = { exercise:'🏃', reading:'📖', conversation:'💬', walking:'🚶', meditation:'🧘', music:'🎵', running:'🏅', other:'⚡' }
  const actColors: Record<string,string> = { exercise:'#E1F5EE', reading:'#E6F1FB', conversation:'#FAEEDA', walking:'#E1F5EE', meditation:'#EEEDFE', music:'#FBEAF0', running:'#E1F5EE', other:'#F1EFE8' }
  const mealLabel: Record<string,string> = { breakfast:'아침', lunch:'점심', dinner:'저녁', snack:'간식' }

  if (loading) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0F0E0D' }}>
      <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:18, color:'rgba(255,255,255,0.4)' }}>불러오는 중...</div>
    </div>
  )

  return (
    <>
      <style>{`
        * { -webkit-tap-highlight-color:transparent; }
        .hw { min-height:100dvh; background:#F2F1EE; font-family:'Plus Jakarta Sans',sans-serif; max-width:430px; margin:0 auto; padding-bottom:calc(76px + env(safe-area-inset-bottom,0px)); }

        /* 히어로 */
        .hero { background:#0F0E0D; border-radius:0 0 36px 36px; padding:0 20px 28px; margin-bottom:16px; }
        .hdr { display:flex; justify-content:space-between; align-items:center; padding:28px 0 20px; }
        .logo-txt { font-family:'Bricolage Grotesque',sans-serif; font-size:28px; font-weight:800; color:#fff; letter-spacing:-0.03em; line-height:1; }
        .date-lbl { font-size:12px; color:rgba(255,255,255,0.35); font-weight:300; margin-top:3px; }
        .av { width:36px; height:36px; border-radius:18px; background:rgba(216,90,48,0.15); display:flex; align-items:center; justify-content:center; font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:700; color:#D85A30; cursor:pointer; border:1px solid rgba(216,90,48,0.25); }

        /* 탭 스위처 */
        .tab-row { display:flex; background:rgba(255,255,255,0.07); border-radius:14px; padding:4px; margin-bottom:20px; }
        .tab-btn { flex:1; padding:10px; border-radius:11px; border:none; background:transparent; font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:rgba(255,255,255,0.4); cursor:pointer; transition:all 0.2s; }
        .tab-btn.on { background:#D85A30; color:#fff; }

        /* 칼로리 링 */
        .ring-wrap { display:flex; flex-direction:column; align-items:center; }
        .ring-legend { display:flex; gap:20px; margin-top:14px; }
        .leg { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:500; }
        .pct-badge { background:rgba(216,90,48,0.12); border:1px solid rgba(216,90,48,0.25); border-radius:20px; padding:5px 14px; font-size:12px; font-weight:600; color:#D85A30; margin-top:10px; }

        /* 💰 칼로리 통장 */
        .bank-hero { padding:4px 0 0; }
        .bank-monthly { margin-bottom:16px; }
        .bank-monthly-lbl { font-size:11px; font-weight:600; letter-spacing:0.12em; color:rgba(255,255,255,0.35); text-transform:uppercase; margin-bottom:6px; }
        .bank-monthly-amt { font-family:'Bricolage Grotesque',sans-serif; font-size:42px; font-weight:800; color:#fff; line-height:1; letter-spacing:-1px; }
        .bank-monthly-sub { font-size:13px; color:rgba(255,255,255,0.3); font-weight:300; margin-top:4px; }
        .bank-today-row { display:flex; gap:10px; }
        .bank-today-card { flex:1; background:rgba(255,255,255,0.06); border-radius:14px; padding:13px 14px; }
        .bank-today-lbl { font-size:11px; color:rgba(255,255,255,0.35); font-weight:300; margin-bottom:5px; }
        .bank-today-amt { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; }
        .bank-today-sub { font-size:11px; font-weight:300; margin-top:3px; }

        /* 수익 카드 */
        .earning-card { background:#fff; border-radius:20px; margin:0 16px 12px; overflow:hidden; }
        .earning-header { padding:16px 18px 12px; border-bottom:0.5px solid rgba(0,0,0,0.05); display:flex; justify-content:space-between; align-items:center; }
        .earning-title { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:800; color:#0F0E0D; }
        .earning-badge { background:#FAECE7; border-radius:20px; padding:5px 12px; font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:800; color:#D85A30; }
        .earning-item { display:flex; align-items:center; gap:12px; padding:13px 18px; border-bottom:0.5px solid rgba(0,0,0,0.04); }
        .earning-item:last-child { border-bottom:none; }
        .earning-ic { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .earning-info { flex:1; }
        .earning-lbl { font-size:14px; font-weight:600; color:#0F0E0D; margin-bottom:2px; }
        .earning-desc { font-size:11px; color:#aaa; font-weight:300; }
        .earning-amt { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:800; }
        .earning-check { width:22px; height:22px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; margin-left:6px; }

        /* 진행 바 */
        .progress-row { padding:14px 18px; background:#F7F5F2; }
        .progress-lbl { display:flex; justify-content:space-between; margin-bottom:8px; }
        .progress-lbl-txt { font-size:12px; color:#aaa; font-weight:300; }
        .progress-lbl-cnt { font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:800; color:#D85A30; }
        .progress-bg { height:8px; background:rgba(0,0,0,0.08); border-radius:4px; overflow:hidden; }
        .progress-fill { height:100%; border-radius:4px; background:linear-gradient(90deg,#D85A30,#FF7A52); transition:width 0.8s cubic-bezier(0.34,1.56,0.64,1); }

        /* 스탯 */
        .stat-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0 16px 12px; }
        .stat-card { background:#fff; border-radius:18px; padding:16px 18px; }
        .stat-lbl { font-size:13px; color:#aaa; margin-bottom:6px; }
        .stat-val { font-family:'Bricolage Grotesque',sans-serif; font-size:30px; font-weight:800; line-height:1; }
        .stat-sub { font-size:12px; color:#aaa; font-weight:300; margin-top:4px; }

        /* AI 카드 */
        .ai-card { background:#0F0E0D; border-radius:20px; margin:0 16px 12px; overflow:hidden; }
        .ai-header { display:flex; align-items:center; gap:10px; padding:16px 18px 12px; border-bottom:0.5px solid rgba(255,255,255,0.07); }
        .ai-header-ic { width:32px; height:32px; border-radius:10px; background:rgba(216,90,48,0.2); display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:700; color:#D85A30; flex-shrink:0; }
        .ai-header-title { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:800; color:#fff; }
        .ai-header-sub { font-size:11px; color:rgba(255,255,255,0.3); font-weight:300; margin-top:1px; }
        .ai-section { padding:14px 18px; }
        .ai-section-label { display:flex; align-items:center; gap:6px; font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; margin-bottom:7px; }
        .ai-section-dot { width:6px; height:6px; border-radius:3px; }
        .ai-section-txt { font-size:14px; color:rgba(255,255,255,0.75); line-height:1.7; font-weight:300; }
        .ai-divider { height:0.5px; background:rgba(255,255,255,0.07); margin:0 18px; }
        .ai-loading { padding:20px 18px; display:flex; align-items:center; gap:10px; }
        .ai-loading-dot { width:6px; height:6px; border-radius:3px; background:#D85A30; animation:pulse 1.2s ease-in-out infinite; }
        .ai-loading-dot:nth-child(2) { animation-delay:0.2s; }
        .ai-loading-dot:nth-child(3) { animation-delay:0.4s; }
        @keyframes pulse { 0%,100%{opacity:0.3;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }

        /* 기록 */
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
        .fab { position:fixed; bottom:calc(80px + env(safe-area-inset-bottom,0px)); right:20px; width:56px; height:56px; border-radius:28px; background:#D85A30; color:#fff; font-size:28px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; line-height:1; z-index:10; box-shadow:0 4px 20px rgba(216,90,48,0.4); }

        @keyframes slideUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .slide-up { animation:slideUp 0.4s ease forwards; }

        @keyframes coinDrop { 0%{transform:translateY(-20px);opacity:0} 60%{transform:translateY(4px)} 100%{transform:translateY(0);opacity:1} }
        .coin-drop { animation:coinDrop 0.5s ease forwards; }
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
              <div className="date-lbl">{new Date().toLocaleDateString('ko-KR', { month:'long', day:'numeric', weekday:'long' })}</div>
            </div>
            <div className="av" onClick={() => router.push('/mypage')}>
              {user?.nickname?.[0] ?? '나'}
            </div>
          </div>

          {/* 탭 */}
          <div className="tab-row">
            <button className={`tab-btn${showBank ? '' : ' on'}`} onClick={() => setShowBank(false)}>칼로리 링</button>
            <button className={`tab-btn${showBank ? ' on' : ''}`} onClick={() => setShowBank(true)}>💰 칼로리 통장</button>
          </div>

          {/* 칼로리 링 뷰 */}
          {!showBank && (
            <div className="ring-wrap slide-up">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="98" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                <circle cx="100" cy="100" r={R1} fill="none" stroke="rgba(216,90,48,0.15)" strokeWidth="16"/>
                <circle cx="100" cy="100" r={R1} fill="none" stroke="#D85A30" strokeWidth="16"
                  strokeDasharray={`${C1*animPctIn/100} ${C1}`} strokeLinecap="round" transform="rotate(-90 100 100)"/>
                {animPctIn > 2 && <circle cx={dot1X} cy={dot1Y} r="8" fill="#FF7A52"/>}
                <circle cx="100" cy="100" r={R2} fill="none" stroke="rgba(29,158,117,0.15)" strokeWidth="12"/>
                <circle cx="100" cy="100" r={R2} fill="none" stroke="#1D9E75" strokeWidth="12"
                  strokeDasharray={`${C2*animPctOut/100} ${C2}`} strokeLinecap="round" transform="rotate(-90 100 100)"/>
                {animPctOut > 2 && <circle cx={dot2X} cy={dot2Y} r="6" fill="#2DC98A"/>}
                <text x="100" y="86" textAnchor="middle" style={{ fontFamily:'Bricolage Grotesque,sans-serif', fontSize:11, fontWeight:600, fill:'rgba(255,255,255,0.35)', letterSpacing:'0.12em' }}>
                  {remaining >= 0 ? 'REMAINING' : 'EXCEEDED'}
                </text>
                <text x="100" y="120" textAnchor="middle" style={{ fontFamily:'Bricolage Grotesque,sans-serif', fontSize:44, fontWeight:800, fill: remaining >= 0 ? '#fff' : '#FF6B6B' }}>
                  {displayNum.toLocaleString()}
                </text>
                <text x="100" y="138" textAnchor="middle" style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:13, fontWeight:300, fill:'rgba(255,255,255,0.4)' }}>kcal</text>
              </svg>
              <div className="ring-legend">
                <div className="leg"><div style={{ width:8, height:8, borderRadius:4, background:'#D85A30' }}/><span style={{ color:'rgba(255,255,255,0.55)' }}>섭취 {totalIn.toLocaleString()}</span></div>
                <div className="leg"><div style={{ width:8, height:8, borderRadius:4, background:'#1D9E75' }}/><span style={{ color:'rgba(255,255,255,0.55)' }}>소비 {totalOut.toLocaleString()}</span></div>
              </div>
              <div className="pct-badge">목표 {goal.toLocaleString()} kcal · {Math.round(pctIn)}% 섭취</div>
            </div>
          )}

          {/* 💰 칼로리 통장 뷰 */}
          {showBank && (
            <div className="bank-hero slide-up">
              <div className="bank-monthly">
                <div className="bank-monthly-lbl">이번 달 누적 수익</div>
                <div className="bank-monthly-amt">
                  ₩ {(displayMonthly + displayToday).toLocaleString()}
                  <span style={{ fontSize:22, color:'rgba(255,255,255,0.4)', marginLeft:6 }}>원</span>
                </div>
                <div className="bank-monthly-sub">건강한 하루가 쌓이는 통장이에요</div>
              </div>

              <div className="bank-today-row">
                <div className="bank-today-card">
                  <div className="bank-today-lbl">오늘 수익</div>
                  <div className="bank-today-amt" style={{ color: todayEarned > 0 ? '#1D9E75' : 'rgba(255,255,255,0.4)' }}>
                    +{displayToday.toLocaleString()}원
                  </div>
                  <div className="bank-today-sub" style={{ color:'rgba(255,255,255,0.3)' }}>
                    {achievedCount}/4 달성
                  </div>
                </div>
                <div className="bank-today-card">
                  <div className="bank-today-lbl">오늘 최대</div>
                  <div className="bank-today-amt" style={{ color:'rgba(255,255,255,0.5)' }}>
                    +60,000원
                  </div>
                  <div className="bank-today-sub" style={{ color:'rgba(255,255,255,0.3)' }}>
                    완벽한 하루 달성 시
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 수익 카드 */}
        {showBank && (
          <div className="earning-card">
            <div className="earning-header">
              <div>
                <div className="earning-title">오늘의 수익 현황</div>
                <div style={{ fontSize:12, color:'#aaa', fontWeight:300, marginTop:2 }}>건강한 행동이 돈이 돼요</div>
              </div>
              <div className="earning-badge">+{todayEarned.toLocaleString()}원</div>
            </div>

            {/* 진행 바 */}
            <div className="progress-row">
              <div className="progress-lbl">
                <span className="progress-lbl-txt">오늘 목표 달성도</span>
                <span className="progress-lbl-cnt">{achievedCount}/4 완료</span>
              </div>
              <div className="progress-bg">
                <div className="progress-fill" style={{ width:`${(achievedCount/4)*100}%` }}/>
              </div>
            </div>

            {/* 수익 항목 */}
            {earnings.map((e, i) => (
              <div key={e.id} className="earning-item" style={{ animationDelay:`${i*0.08}s` }}>
                <div className="earning-ic" style={{ background: e.achieved ? (e.id==='perfect'?'#FAEEDA':'#E1F5EE') : '#F7F5F2' }}>
                  {e.icon}
                </div>
                <div className="earning-info">
                  <div className="earning-lbl" style={{ color: e.achieved ? '#0F0E0D' : '#aaa' }}>{e.label}</div>
                  <div className="earning-desc">{e.desc}</div>
                </div>
                <div className="earning-amt" style={{ color: e.achieved ? '#1D9E75' : '#ccc' }}>
                  {e.achieved ? '+' : ''}{e.amount.toLocaleString()}원
                </div>
                <div className="earning-check" style={{ background: e.achieved ? '#1D9E75' : 'rgba(0,0,0,0.06)' }}>
                  {e.achieved ? '✓' : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 스탯 카드 (링 탭일 때) */}
        {!showBank && (
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
        )}

        {/* 인앱 알림 */}
        <InAppNotification />

        {/* AI 코멘트 */}
        {(aiLoading || aiComment) && (
          <div className="ai-card">
            <div className="ai-header">
              <div className="ai-header-ic">✦</div>
              <div>
                <div className="ai-header-title">calio AI 코치</div>
                <div className="ai-header-sub">오늘의 분석 · 내일을 위한 제안</div>
              </div>
            </div>
            {aiLoading && !aiComment ? (
              <div className="ai-loading">
                <div className="ai-loading-dot"/><div className="ai-loading-dot"/><div className="ai-loading-dot"/>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.3)', fontWeight:300 }}>AI가 분석하고 있어요...</div>
              </div>
            ) : aiComment && (
              <>
                <div className="ai-section">
                  <div className="ai-section-label">
                    <div className="ai-section-dot" style={{ background:'#D85A30' }}/>
                    <span style={{ color:'#D85A30' }}>오늘 잘했어요</span>
                  </div>
                  <div className="ai-section-txt">{aiComment.today}</div>
                </div>
                {aiComment.tomorrow && (
                  <>
                    <div className="ai-divider"/>
                    <div className="ai-section">
                      <div className="ai-section-label">
                        <div className="ai-section-dot" style={{ background:'#1D9E75' }}/>
                        <span style={{ color:'#1D9E75' }}>내일을 위한 제안</span>
                      </div>
                      <div className="ai-section-txt">{aiComment.tomorrow}</div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* 오늘 기록 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'0 16px 10px' }}>
          <div className="sec" style={{ margin:0 }}>오늘의 기록</div>
          <div onClick={() => router.push('/history')} style={{ fontSize:13, color:'#D85A30', fontWeight:600, cursor:'pointer' }}>전체 보기 →</div>
        </div>

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
                  <div className="log-tm">{mealLabel[m.meal_type??'snack']} · {new Date(m.logged_at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <div className="log-cal" style={{ color:'#D85A30' }}>+{m.calories}</div>
              </div>
            ))}
            {activities.map(a => (
              <div key={a.id} className="log-row">
                <div className="log-ic" style={{ background: actColors[a.activity_type]??'#F1EFE8' }}>
                  {actIcons[a.activity_type]??'⚡'}
                </div>
                <div style={{ flex:1 }}>
                  <div className="log-nm">{a.activity_type} {a.duration_min}분</div>
                  <div className="log-tm">{new Date(a.logged_at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</div>
                </div>
                <div className="log-cal" style={{ color:'#1D9E75' }}>−{a.calories_burned}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ height:20 }}/>
      </div>

      <button className="fab" onClick={() => router.push('/scan')}>+</button>
    </>
  )
}