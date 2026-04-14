'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calcActivityCalories } from '@/lib/calories'

const ACTIVITIES = [
  { key: 'exercise',     icon: '🏃', name: '운동',      desc: '조깅·헬스·자전거',  color: '#E1F5EE', accent: '#1D9E75' },
  { key: 'walking',      icon: '🚶', name: '걷기',      desc: '산책·출퇴근',       color: '#E1F5EE', accent: '#1D9E75' },
  { key: 'reading',      icon: '📖', name: '독서',      desc: '책·논문·아티클',    color: '#E6F1FB', accent: '#378ADD' },
  { key: 'conversation', icon: '💬', name: '대화·미팅', desc: '회의·통화·수업',    color: '#FAEEDA', accent: '#BA7517' },
  { key: 'meditation',   icon: '🧘', name: '명상',      desc: '마음챙김·호흡',     color: '#EEEDFE', accent: '#534AB7' },
  { key: 'music',        icon: '🎵', name: '악기·창작', desc: '피아노·기타·그림',  color: '#FBEAF0', accent: '#993556' },
]

export default function ActivityPage() {
  const router = useRouter()
  const [selected, setSelected]   = useState<string | null>(null)
  const [duration, setDuration]   = useState(30)
  const [weight, setWeight]       = useState(70)
  const [logs, setLogs]           = useState<any[]>([])
  const [loading, setLoading]     = useState(false)
  const [saved, setSaved]         = useState(false)
  const [totalBurned, setTotalBurned] = useState(0)
  const [customMin, setCustomMin] = useState('')
  const [useCustom, setUseCustom] = useState(false)
  const [animBurned, setAnimBurned] = useState(0)

  const finalDuration = useCustom && customMin ? parseInt(customMin) || 0 : duration
  const selectedAct   = ACTIVITIES.find(a => a.key === selected)
  const estimatedCal  = selected ? calcActivityCalories(selected, finalDuration, weight) : 0

  useEffect(() => { loadLogs() }, [])

  useEffect(() => {
    if (totalBurned === 0) { setAnimBurned(0); return }
    let start = 0
    const target = totalBurned
    const steps = 60
    let step = 0
    const t = setInterval(() => {
      step++
      const ease = 1 - Math.pow(1 - step / steps, 3)
      setAnimBurned(Math.round(target * ease))
      if (step >= steps) { clearInterval(t); setAnimBurned(target) }
    }, 16)
    return () => clearInterval(t)
  }, [totalBurned])

  const loadLogs = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const { data: ud } = await supabase.from('users').select('weight_kg').eq('id', user.id).single()
    if ((ud as any)?.weight_kg) setWeight(Number((ud as any).weight_kg))

    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('activities').select('*').eq('user_id', user.id)
      .gte('logged_at', today + 'T00:00:00').order('logged_at', { ascending: false })

    const actData = (data ?? []) as any[]
    setLogs(actData)
    setTotalBurned(actData.reduce((s: number, a: any) => s + a.calories_burned, 0))
  }

  const handleSave = async () => {
    if (!selected || finalDuration <= 0) return
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      await supabase.from('activities').insert({
        user_id: user.id, activity_type: selected,
        duration_min: finalDuration, calories_burned: estimatedCal,
        logged_at: new Date().toISOString(),
      } as any)

      setSaved(true)
      await loadLogs()
      setTimeout(() => {
        setSaved(false); setSelected(null)
        setDuration(30); setCustomMin(''); setUseCustom(false)
      }, 1500)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const actNameMap: Record<string,string> = {
    exercise:'운동', walking:'걷기', reading:'독서',
    conversation:'대화·미팅', meditation:'명상', music:'악기·창작', other:'기타'
  }

  const pct = Math.min((totalBurned / 500) * 100, 100)

  return (
    <>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        .aw { min-height:100dvh; background:#F2F1EE; font-family:'Plus Jakarta Sans',sans-serif; max-width:430px; margin:0 auto; padding-bottom:40px; }

        /* 다크 히어로 */
        .a-hero { background:#0F0E0D; border-radius:0 0 32px 32px; padding:0 20px 24px; margin-bottom:20px; }
        .a-hdr { display:flex; justify-content:space-between; align-items:center; padding:28px 0 20px; }
        .back-btn { background:none; border:none; font-size:24px; cursor:pointer; color:rgba(255,255,255,0.5); padding:0; }
        .a-title { font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:#fff; }

        /* 소비 링 */
        .burn-wrap { display:flex; align-items:center; gap:20px; }
        .burn-ring { flex-shrink:0; }
        .burn-info { flex:1; }
        .burn-num { font-family:'Bricolage Grotesque',sans-serif; font-size:48px; font-weight:800; color:#1D9E75; line-height:1; }
        .burn-lbl { font-size:13px; color:rgba(255,255,255,0.4); font-weight:300; margin-top:4px; margin-bottom:10px; }
        .burn-bar-bg { height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden; }
        .burn-bar-fill { height:100%; border-radius:3px; background:#1D9E75; transition:width 0.4s ease; }
        .burn-goal { font-size:11px; color:rgba(255,255,255,0.3); margin-top:5px; }

        /* 섹션 */
        .sec { font-family:'Bricolage Grotesque',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#aaa; margin:0 16px 10px; }

        /* 활동 그리드 */
        .act-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0 16px 16px; }
        .act-card { background:#fff; border-radius:18px; padding:16px 14px; cursor:pointer; transition:all 0.15s; border:2px solid transparent; }
        .act-card.on { border-color:#D85A30; background:#FAECE7; transform:scale(0.97); }
        .act-card-ic { font-size:26px; margin-bottom:8px; }
        .act-card-nm { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:800; color:#0F0E0D; margin-bottom:3px; }
        .act-card-ds { font-size:12px; color:#aaa; font-weight:300; }
        .act-card-cal { font-size:11px; color:#D85A30; font-weight:600; margin-top:6px; }

        /* 시간 설정 패널 */
        .dur-panel { background:#0F0E0D; border-radius:22px; margin:0 16px 16px; padding:20px; }
        .dur-top { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
        .dur-ic { width:44px; height:44px; border-radius:14px; background:rgba(216,90,48,0.15); display:flex; align-items:center; justify-content:center; font-size:22px; flex-shrink:0; }
        .dur-nm { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:#fff; }
        .dur-ds { font-size:12px; color:rgba(255,255,255,0.4); font-weight:300; }

        /* 빠른 선택 */
        .quick-row { display:flex; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
        .quick-btn { padding:9px 14px; border-radius:22px; border:1.5px solid rgba(255,255,255,0.1); background:transparent; font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; font-weight:500; color:rgba(255,255,255,0.5); cursor:pointer; transition:all 0.15s; }
        .quick-btn.on { background:#D85A30; border-color:#D85A30; color:#fff; font-weight:700; }

        /* 직접 입력 */
        .custom-row { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
        .custom-toggle { padding:9px 14px; border-radius:22px; border:1.5px solid rgba(255,255,255,0.1); background:transparent; font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; color:rgba(255,255,255,0.5); cursor:pointer; transition:all 0.15s; }
        .custom-toggle.on { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.2); color:#fff; }
        .custom-input { flex:1; background:rgba(255,255,255,0.07); border:1.5px solid rgba(255,255,255,0.12); border-radius:13px; padding:10px 14px; font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:700; color:#fff; outline:none; text-align:center; }
        .custom-unit { font-size:13px; color:rgba(255,255,255,0.4); }

        /* 칼로리 미리보기 */
        .cal-preview { background:rgba(255,255,255,0.05); border-radius:14px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; }
        .cal-preview-left { font-size:13px; color:rgba(255,255,255,0.5); }
        .cal-preview-right { font-family:'Bricolage Grotesque',sans-serif; font-size:30px; font-weight:800; color:#1D9E75; }
        .cal-preview-unit { font-size:13px; color:rgba(29,158,117,0.6); }

        /* 저장 버튼 */
        .save-btn { width:100%; padding:15px; border-radius:14px; background:#D85A30; color:#fff; font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:700; border:none; cursor:pointer; }
        .save-btn:disabled { opacity:0.5; }
        .saved-banner { width:100%; padding:15px; border-radius:14px; background:#1D9E75; color:#fff; font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:700; text-align:center; }

        /* 기록 카드 */
        .log-card { background:#fff; border-radius:18px; margin:0 16px; padding:4px 16px; }
        .log-row { display:flex; align-items:center; gap:12px; padding:13px 0; border-bottom:0.5px solid rgba(0,0,0,0.05); }
        .log-row:last-child { border-bottom:none; }
        .log-ic { width:44px; height:44px; border-radius:13px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .log-nm { font-size:15px; font-weight:600; color:#0F0E0D; }
        .log-tm { font-size:12px; color:#aaa; margin-top:2px; }
        .log-cal { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:#1D9E75; }
        .log-bar { height:3px; background:rgba(0,0,0,0.06); border-radius:2px; overflow:hidden; margin-top:5px; }
        .log-bar-fill { height:100%; border-radius:2px; background:#1D9E75; }
      `}</style>

      <div className="aw">

        {/* 다크 히어로 */}
        <div className="a-hero">
          <div className="a-hdr">
            <button className="back-btn" onClick={() => router.push('/home')}>←</button>
            <div className="a-title">활동 기록</div>
            <div style={{ width:32 }}/>
          </div>

          <div className="burn-wrap">
            <div className="burn-ring">
              <svg width="90" height="90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r="38" fill="none" stroke="rgba(29,158,117,0.12)" strokeWidth="10"/>
                <circle cx="45" cy="45" r="38" fill="none" stroke="#1D9E75" strokeWidth="10"
                  strokeDasharray={`${2*Math.PI*38*pct/100} ${2*Math.PI*38}`}
                  strokeLinecap="round" transform="rotate(-90 45 45)"/>
                <text x="45" y="49" textAnchor="middle"
                  style={{ fontFamily:'Bricolage Grotesque,sans-serif', fontSize:13, fontWeight:800, fill:'#1D9E75' }}>
                  {Math.round(pct)}%
                </text>
              </svg>
            </div>
            <div className="burn-info">
              <div className="burn-num">{animBurned.toLocaleString()}</div>
              <div className="burn-lbl">오늘 소비 kcal</div>
              <div className="burn-bar-bg">
                <div className="burn-bar-fill" style={{ width:`${pct}%` }}/>
              </div>
              <div className="burn-goal">목표 500 kcal · {Math.max(0, 500 - totalBurned)} kcal 남음</div>
            </div>
          </div>
        </div>

        {/* 활동 선택 */}
        <div className="sec">활동 선택</div>
        <div className="act-grid">
          {ACTIVITIES.map(a => (
            <div key={a.key}
              className={`act-card${selected === a.key ? ' on' : ''}`}
              onClick={() => { setSelected(a.key); setSaved(false) }}>
              <div className="act-card-ic">{a.icon}</div>
              <div className="act-card-nm">{a.name}</div>
              <div className="act-card-ds">{a.desc}</div>
              {selected === a.key && (
                <div className="act-card-cal">✦ 선택됨</div>
              )}
            </div>
          ))}
        </div>

        {/* 시간 설정 */}
        {selected && (
          <div className="dur-panel">
            <div className="dur-top">
              <div className="dur-ic">{selectedAct?.icon}</div>
              <div>
                <div className="dur-nm">{selectedAct?.name}</div>
                <div className="dur-ds">시간을 설정해주세요</div>
              </div>
            </div>

            {/* 빠른 선택 */}
            <div className="quick-row">
              {[10, 20, 30, 45, 60, 90].map(min => (
                <button key={min}
                  className={`quick-btn${!useCustom && duration === min ? ' on' : ''}`}
                  onClick={() => { setDuration(min); setUseCustom(false) }}>
                  {min}분
                </button>
              ))}
            </div>

            {/* 직접 입력 */}
            <div className="custom-row">
              <button
                className={`custom-toggle${useCustom ? ' on' : ''}`}
                onClick={() => setUseCustom(!useCustom)}>
                직접 입력
              </button>
              {useCustom && (
                <>
                  <input
                    className="custom-input"
                    type="number"
                    placeholder="0"
                    value={customMin}
                    onChange={e => setCustomMin(e.target.value)}
                    inputMode="numeric"
                  />
                  <span className="custom-unit">분</span>
                </>
              )}
            </div>

            {/* 칼로리 미리보기 */}
            <div className="cal-preview">
              <div className="cal-preview-left">
                {finalDuration}분 · 체중 {weight}kg 기준<br/>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.25)' }}>예상 소비 칼로리</span>
              </div>
              <div style={{ textAlign:'right' }}>
                <div className="cal-preview-right">{estimatedCal}</div>
                <div className="cal-preview-unit">kcal</div>
              </div>
            </div>

            {saved ? (
              <div className="saved-banner">✓ 기록됐어요!</div>
            ) : (
              <button className="save-btn" onClick={handleSave} disabled={loading || finalDuration <= 0}>
                {loading ? '저장 중...' : '활동 기록 저장하기'}
              </button>
            )}
          </div>
        )}

        {/* 오늘 기록 */}
        {logs.length > 0 && (
          <>
            <div className="sec">오늘 활동 기록</div>
            <div className="log-card">
              {logs.map((log: any) => {
                const act = ACTIVITIES.find(a => a.key === log.activity_type)
                const barW = Math.min((log.calories_burned / 300) * 100, 100)
                return (
                  <div key={log.id} className="log-row">
                    <div className="log-ic" style={{ background: act?.color ?? '#F1EFE8' }}>
                      {act?.icon ?? '⚡'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div className="log-nm">{actNameMap[log.activity_type] ?? log.activity_type}</div>
                      <div className="log-tm">{log.duration_min}분 · {new Date(log.logged_at).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })}</div>
                      <div className="log-bar"><div className="log-bar-fill" style={{ width:`${barW}%` }}/></div>
                    </div>
                    <div className="log-cal">−{log.calories_burned}</div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <div style={{ height:24 }}/>
        <div style={{ padding:'0 16px' }}>
          <button onClick={() => router.push('/home')}
            style={{ width:'100%', padding:15, borderRadius:14, background:'#0F0E0D', color:'#fff', fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:15, fontWeight:700, border:'none', cursor:'pointer' }}>
            홈으로 돌아가기
          </button>
        </div>
        <div style={{ height:20 }}/>
      </div>
    </>
  )
}