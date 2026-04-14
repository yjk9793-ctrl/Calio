'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MyPage() {
  const router = useRouter()
  const [user, setUser]       = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)

  const [nickname, setNickname]   = useState('')
  const [height, setHeight]       = useState('')
  const [weight, setWeight]       = useState('')
  const [goalType, setGoalType]   = useState('')
  const [goalKcal, setGoalKcal]   = useState('')

  const goalOptions = [
    { key:'lose_weight',    label:'체중 감량', icon:'⚖️' },
    { key:'maintain',       label:'체형 유지', icon:'💪' },
    { key:'healthy_habit',  label:'건강한 습관', icon:'🌱' },
    { key:'brain_activity', label:'두뇌 활동', icon:'🧠' },
  ]

  useEffect(() => { loadUser() }, [])

  const loadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) { router.push('/auth'); return }
    const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    setUser(data)
    setNickname((data as any)?.nickname ?? '')
    setHeight(String((data as any)?.height_cm ?? ''))
    setWeight(String((data as any)?.weight_kg ?? ''))
    setGoalType((data as any)?.goal_type ?? 'lose_weight')
    setGoalKcal(String((data as any)?.daily_kcal_goal ?? 2000))
    setLoading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return
    await supabase.from('users').update({
      nickname,
      height_cm: Number(height),
      weight_kg: Number(weight),
      goal_type: goalType,
      daily_kcal_goal: Number(goalKcal),
    } as any).eq('id', authUser.id)
    setSaving(false)
    setSaved(true)
    setEditing(false)
    await loadUser()
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  if (loading) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F2F1EE' }}>
      <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:16, color:'#aaa' }}>불러오는 중...</div>
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        .mp-wrap { min-height:100dvh; background:#F2F1EE; font-family:'Plus Jakarta Sans',sans-serif; max-width:430px; margin:0 auto; padding-bottom:calc(80px + env(safe-area-inset-bottom,0px)); }

        .mp-hero { background:#0F0E0D; border-radius:0 0 32px 32px; padding:0 20px 28px; margin-bottom:20px; }
        .mp-hdr { display:flex; justify-content:space-between; align-items:center; padding:28px 0 20px; }
        .mp-title { font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:#fff; }
        .edit-btn { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); border-radius:20px; padding:7px 16px; font-family:'Plus Jakarta Sans',sans-serif; font-size:13px; font-weight:500; color:rgba(255,255,255,0.6); cursor:pointer; }

        .profile-wrap { display:flex; align-items:center; gap:16px; }
        .avatar-big { width:64px; height:64px; border-radius:32px; background:rgba(216,90,48,0.2); border:2px solid rgba(216,90,48,0.3); display:flex; align-items:center; justify-content:center; font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:#D85A30; flex-shrink:0; }
        .profile-info { flex:1; }
        .profile-name { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:#fff; margin-bottom:4px; }
        .profile-email { font-size:13px; color:rgba(255,255,255,0.35); font-weight:300; }
        .premium-badge { display:inline-flex; align-items:center; gap:5px; background:rgba(216,90,48,0.15); border:1px solid rgba(216,90,48,0.3); border-radius:20px; padding:4px 12px; font-size:11px; font-weight:600; color:#D85A30; margin-top:8px; }

        .stat-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:18px; }
        .stat-item { background:rgba(255,255,255,0.05); border-radius:12px; padding:12px 8px; text-align:center; }
        .stat-val { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; color:#fff; }
        .stat-lbl { font-size:10px; color:rgba(255,255,255,0.3); font-weight:300; margin-top:3px; }

        .sec { font-family:'Bricolage Grotesque',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#aaa; margin:0 16px 10px; }

        .menu-card { background:#fff; border-radius:18px; margin:0 16px 14px; overflow:hidden; }
        .menu-item { display:flex; align-items:center; gap:14px; padding:16px 18px; border-bottom:0.5px solid rgba(0,0,0,0.05); cursor:pointer; }
        .menu-item:last-child { border-bottom:none; }
        .menu-ic { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:17px; flex-shrink:0; }
        .menu-txt { flex:1; }
        .menu-nm { font-size:15px; font-weight:500; color:#0F0E0D; }
        .menu-sub { font-size:12px; color:#aaa; font-weight:300; margin-top:2px; }
        .menu-arr { font-size:16px; color:#ccc; }

        .edit-card { background:#fff; border-radius:18px; margin:0 16px 14px; padding:18px; }
        .field-label { font-size:11px; font-weight:600; letter-spacing:0.07em; text-transform:uppercase; color:#aaa; margin-bottom:6px; }
        .field-input { width:100%; padding:13px 14px; border-radius:13px; border:1.5px solid rgba(0,0,0,0.1); background:#F7F5F2; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; color:#0F0E0D; outline:none; margin-bottom:14px; }
        .goal-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px; }
        .goal-opt { border:1.5px solid rgba(0,0,0,0.08); border-radius:12px; padding:12px; cursor:pointer; text-align:center; }
        .goal-opt.on { border-color:#D85A30; background:#FAECE7; }
        .goal-opt-ic { font-size:18px; margin-bottom:4px; }
        .goal-opt-nm { font-family:'Bricolage Grotesque',sans-serif; font-size:12px; font-weight:700; color:#0F0E0D; }

        .save-btn { width:100%; padding:15px; border-radius:13px; background:#D85A30; color:#fff; font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; border:none; cursor:pointer; margin-top:4px; }
        .cancel-btn { width:100%; padding:12px; border-radius:13px; background:transparent; color:#aaa; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; border:none; cursor:pointer; margin-top:6px; }

        .saved-banner { background:#E1F5EE; border-radius:13px; padding:13px; text-align:center; font-size:14px; font-weight:600; color:#085041; margin-top:8px; }

        .signout-btn { width:calc(100% - 32px); margin:0 16px; padding:14px; border-radius:13px; background:transparent; color:#E24B4A; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:500; border:1.5px solid rgba(226,75,74,0.2); cursor:pointer; }

        .premium-card { background:#0F0E0D; border-radius:18px; margin:0 16px 14px; padding:18px; display:flex; align-items:center; gap:14px; }
        .premium-ic { width:44px; height:44px; border-radius:14px; background:rgba(216,90,48,0.15); display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .premium-title { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:800; color:#fff; margin-bottom:3px; }
        .premium-desc { font-size:12px; color:rgba(255,255,255,0.4); font-weight:300; }
        .premium-btn { padding:10px 18px; border-radius:20px; background:#D85A30; color:#fff; font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:700; border:none; cursor:pointer; white-space:nowrap; flex-shrink:0; }
      `}</style>

      <div className="mp-wrap">

        {/* 다크 히어로 */}
        <div className="mp-hero">
         <div className="mp-hdr">
         <button onClick={() => router.back()} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'rgba(255,255,255,0.5)', padding:0 }}>←</button>
          <div className="mp-title">마이페이지</div>
          <button className="edit-btn" onClick={() => setEditing(!editing)}>
    {editing ? '취소' : '✏ 수정'}
          </button>
          </div>

          <div className="profile-wrap">
            <div className="avatar-big">
              {user?.nickname?.[0] ?? user?.email?.[0]?.toUpperCase() ?? '나'}
            </div>
            <div className="profile-info">
              <div className="profile-name">{user?.nickname ?? '이름 없음'}</div>
              <div className="profile-email">{user?.email ?? ''}</div>
              {user?.is_premium && (
                <div className="premium-badge">✦ 프리미엄</div>
              )}
            </div>
          </div>

          <div className="stat-row">
            <div className="stat-item">
              <div className="stat-val">{user?.streak_days ?? 0}일</div>
              <div className="stat-lbl">연속 기록</div>
            </div>
            <div className="stat-item">
              <div className="stat-val">{user?.daily_kcal_goal?.toLocaleString() ?? 2000}</div>
              <div className="stat-lbl">목표 kcal</div>
            </div>
            <div className="stat-item">
              <div className="stat-val">{user?.weight_kg ?? '-'}kg</div>
              <div className="stat-lbl">현재 체중</div>
            </div>
          </div>
        </div>

        {/* 프로필 수정 */}
        {editing && (
          <>
            <div className="sec">프로필 수정</div>
            <div className="edit-card">
              <div className="field-label">닉네임</div>
              <input className="field-input" value={nickname} onChange={e => setNickname(e.target.value)} placeholder="닉네임"/>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div>
                  <div className="field-label">키 (cm)</div>
                  <input className="field-input" type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="178"/>
                </div>
                <div>
                  <div className="field-label">몸무게 (kg)</div>
                  <input className="field-input" type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="74"/>
                </div>
              </div>

              <div className="field-label">목표 유형</div>
              <div className="goal-grid">
                {goalOptions.map(g => (
                  <div key={g.key} className={`goal-opt${goalType===g.key?' on':''}`} onClick={() => setGoalType(g.key)}>
                    <div className="goal-opt-ic">{g.icon}</div>
                    <div className="goal-opt-nm">{g.label}</div>
                  </div>
                ))}
              </div>

              <div className="field-label">하루 목표 칼로리 (kcal)</div>
              <input className="field-input" type="number" value={goalKcal} onChange={e => setGoalKcal(e.target.value)} placeholder="2000"/>

              {saved ? (
                <div className="saved-banner">✓ 저장됐어요!</div>
              ) : (
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? '저장 중...' : '저장하기'}
                </button>
              )}
              <button className="cancel-btn" onClick={() => setEditing(false)}>취소</button>
            </div>
          </>
        )}

        {/* 프리미엄 카드 */}
        {!user?.is_premium && (
          <>
            <div className="sec">프리미엄</div>
            <div className="premium-card">
              <div className="premium-ic">✦</div>
              <div style={{ flex:1 }}>
                <div className="premium-title">calio 프리미엄</div>
                <div className="premium-desc">AI 분석 무제한 · 일상 칼로리 추적</div>
              </div>
              <button className="premium-btn" onClick={() => router.push('/premium')}>시작하기</button>
            </div>
          </>
        )}

        {/* 내 정보 */}
        <div className="sec">내 정보</div>
        <div className="menu-card">
          <div className="menu-item" onClick={() => setEditing(true)}>
            <div className="menu-ic" style={{ background:'#FAECE7' }}>👤</div>
            <div className="menu-txt">
              <div className="menu-nm">프로필 수정</div>
              <div className="menu-sub">닉네임, 체중, 키 변경</div>
            </div>
            <div className="menu-arr">›</div>
          </div>
          <div className="menu-item" onClick={() => setEditing(true)}>
            <div className="menu-ic" style={{ background:'#E1F5EE' }}>🎯</div>
            <div className="menu-txt">
              <div className="menu-nm">목표 설정</div>
              <div className="menu-sub">하루 칼로리 목표 · 목표 유형</div>
            </div>
            <div className="menu-arr">›</div>
          </div>
        </div>

        {/* 앱 설정 */}
        <div className="sec">앱 설정</div>
        <div className="menu-card">
          <div className="menu-item">
            <div className="menu-ic" style={{ background:'#E6F1FB' }}>🔔</div>
            <div className="menu-txt">
              <div className="menu-nm">알림 설정</div>
              <div className="menu-sub">매일 기록 알림</div>
            </div>
            <div className="menu-arr">›</div>
          </div>
          <div className="menu-item" onClick={() => router.push('/premium')}>
            <div className="menu-ic" style={{ background:'#FAECE7' }}>✦</div>
            <div className="menu-txt">
              <div className="menu-nm">프리미엄 구독</div>
              <div className="menu-sub">월 3,900원 · 연 29,900원</div>
            </div>
            <div className="menu-arr">›</div>
          </div>
        </div>

        {/* 고객센터 */}
        <div className="sec">고객센터</div>
        <div className="menu-card">
          <div className="menu-item">
            <div className="menu-ic" style={{ background:'#F1EFE8' }}>❓</div>
            <div className="menu-txt">
              <div className="menu-nm">자주 묻는 질문</div>
              <div className="menu-sub">FAQ</div>
            </div>
            <div className="menu-arr">›</div>
          </div>
          <div className="menu-item">
            <div className="menu-ic" style={{ background:'#F1EFE8' }}>✉️</div>
            <div className="menu-txt">
              <div className="menu-nm">문의하기</div>
              <div className="menu-sub">hello@calio.app</div>
            </div>
            <div className="menu-arr">›</div>
          </div>
          <div className="menu-item">
            <div className="menu-ic" style={{ background:'#F1EFE8' }}>📄</div>
            <div className="menu-txt">
              <div className="menu-nm">개인정보처리방침</div>
            </div>
            <div className="menu-arr">›</div>
          </div>
          <div className="menu-item">
            <div className="menu-ic" style={{ background:'#F1EFE8' }}>📋</div>
            <div className="menu-txt">
              <div className="menu-nm">이용약관</div>
            </div>
            <div className="menu-arr">›</div>
          </div>
        </div>

        {/* 앱 버전 */}
        <div style={{ textAlign:'center', fontSize:12, color:'#ccc', fontWeight:300, margin:'0 0 16px', fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
          calio v0.1.0 · Beta
        </div>

        {/* 로그아웃 */}
        <button className="signout-btn" onClick={handleSignOut}>로그아웃</button>
        <div style={{ height:20 }}/>
      </div>
    </>
  )
}
