'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { calcBMR, calcGoalCalories } from '@/lib/calories'

type GoalType = 'lose_weight' | 'maintain' | 'healthy_habit' | 'brain_activity'
type Gender = 'male' | 'female'

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState<GoalType>('lose_weight')
  const [gender, setGender] = useState<Gender>('male')
  const [age, setAge] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)

  const goals = [
    { key: 'lose_weight',    icon: '⚖️', name: '체중 감량',   desc: '적자 칼로리 유지' },
    { key: 'maintain',       icon: '💪', name: '체형 유지',   desc: '균형 잡힌 일상' },
    { key: 'healthy_habit',  icon: '🌱', name: '건강한 습관', desc: '먹고 움직이기' },
    { key: 'brain_activity', icon: '🧠', name: '두뇌 활동',   desc: '독서·대화로 소비' },
  ]

  const activities = [
    { icon: '📖', name: '독서',      cal: '약 80–100 kcal/hr', bg: '#FAECE7' },
    { icon: '💬', name: '대화·미팅', cal: '약 50–70 kcal/hr',  bg: '#E1F5EE' },
    { icon: '🎵', name: '악기·창작', cal: '약 70–100 kcal/hr', bg: '#E6F1FB' },
    { icon: '🧘', name: '명상',      cal: '약 40–60 kcal/hr',  bg: '#FAEEDA' },
  ]

  const bmr = age && height && weight
    ? calcBMR(Number(weight), Number(height), Number(age), gender)
    : 0
  const kcalGoal = bmr ? calcGoalCalories(bmr, goal) : 2000

  const handleFinish = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        goal_type: goal,
        gender,
        height_cm: Number(height),
        weight_kg: Number(weight),
        daily_kcal_goal: kcalGoal,
      } as any)
      router.push('/home')
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  return (
    <>
      <style>{`
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        .ob-wrap {
          min-height:100dvh;
          background:#fff;
          font-family:'Plus Jakarta Sans',sans-serif;
          max-width:430px;
          margin:0 auto;
          padding:0 24px max(40px, env(safe-area-inset-bottom,40px));
          display:flex;
          flex-direction:column;
        }

        /* 진행 바 */
        .prog-bar {
          display:flex; gap:6px;
          padding:28px 0 32px;
          flex-shrink:0;
        }
        .prog-pip {
          height:4px; border-radius:2px;
          transition:all 0.3s;
        }

        .step-label {
          font-size:13px; font-weight:600;
          letter-spacing:0.1em; text-transform:uppercase;
          color:#aaa; margin-bottom:10px;
        }
        .heading {
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:32px; font-weight:800;
          color:#0F0E0D; letter-spacing:-0.5px;
          line-height:1.15; margin-bottom:8px;
        }
        .sub {
          font-size:16px; color:#aaa;
          font-weight:300; line-height:1.6;
          margin-bottom:28px;
        }

        /* 목표 카드 */
        .goal-grid {
          display:grid; grid-template-columns:1fr 1fr;
          gap:10px; margin-bottom:28px;
        }
        .goal-card {
          background:#F7F5F2;
          border-radius:18px;
          padding:18px 14px;
          cursor:pointer;
          transition:all 0.15s;
          border:2px solid transparent;
        }
        .goal-card.on {
          background:#FAECE7;
          border-color:#D85A30;
          transform:scale(0.97);
        }
        .goal-ic { font-size:26px; margin-bottom:10px; }
        .goal-nm {
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:15px; font-weight:800; color:#0F0E0D;
          margin-bottom:4px;
        }
        .goal-ds { font-size:13px; color:#aaa; font-weight:300; }

        /* 필드 */
        .field { margin-bottom:18px; }
        .field-label {
          font-size:13px; font-weight:600;
          letter-spacing:0.07em; text-transform:uppercase;
          color:#aaa; margin-bottom:8px;
        }
        .field-input {
          width:100%; padding:16px 18px;
          border-radius:14px; border:none;
          background:#F7F5F2;
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:18px; font-weight:700;
          color:#0F0E0D; outline:none;
          -webkit-appearance:none;
        }

        /* 성별 */
        .gender-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .gender-btn {
          padding:16px; border-radius:14px;
          border:none; background:#F7F5F2;
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:16px; font-weight:700;
          color:#aaa; cursor:pointer; transition:all 0.15s;
        }
        .gender-btn.on {
          background:#FAECE7; color:#D85A30;
        }

        /* 활동 카드 */
        .act-list { display:flex; flex-direction:column; gap:10px; margin-bottom:28px; }
        .act-item {
          display:flex; align-items:center; gap:14px;
          padding:16px; border-radius:16px;
        }
        .act-ic { font-size:24px; flex-shrink:0; }
        .act-nm {
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:16px; font-weight:800; color:#0F0E0D;
        }
        .act-cal { font-size:13px; color:#aaa; font-weight:300; margin-top:3px; }

        /* 완료 요약 */
        .summary-card {
          background:#F7F5F2; border-radius:20px;
          padding:20px; margin-bottom:24px;
        }
        .summary-lbl {
          font-size:13px; font-weight:600;
          letter-spacing:0.08em; text-transform:uppercase;
          color:#aaa; margin-bottom:14px;
        }
        .kcal-big {
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:52px; font-weight:800;
          color:#D85A30; line-height:1; margin-bottom:4px;
        }
        .kcal-unit { font-size:16px; color:#993C1D; font-weight:500; margin-bottom:6px; }
        .kcal-sub { font-size:13px; color:#aaa; font-weight:300; margin-bottom:16px; }
        .stat-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
        .stat-box {
          background:#fff; border-radius:12px;
          padding:12px 8px; text-align:center;
        }
        .stat-v {
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:18px; font-weight:800; color:#0F0E0D;
        }
        .stat-l { font-size:11px; color:#aaa; font-weight:300; margin-top:3px; }

        /* 버튼 */
        .btn {
          width:100%; padding:18px;
          border-radius:16px; background:#D85A30;
          color:#fff; font-family:'Bricolage Grotesque',sans-serif;
          font-size:17px; font-weight:700;
          border:none; cursor:pointer; margin-bottom:10px;
        }
        .ghost-btn {
          width:100%; padding:12px;
          border-radius:16px; background:transparent;
          color:#aaa; font-family:'Plus Jakarta Sans',sans-serif;
          font-size:15px; border:none; cursor:pointer;
        }

        .flex1 { flex:1; }
      `}</style>

      <div className="ob-wrap">

        {/* 진행 바 */}
        <div className="prog-bar">
          {[0,1,2,3].map(i => (
            <div key={i} className="prog-pip" style={{
              background: i < step ? '#1D9E75' : i === step ? '#D85A30' : '#F0EFED',
              width: i === step ? 28 : 8,
            }}/>
          ))}
        </div>

        {/* STEP 0: 목표 */}
        {step === 0 && (
          <>
            <div className="step-label">1 / 4 — 목표 설정</div>
            <div className="heading">어떤 목표로<br/>시작할까요?</div>
            <div className="sub">목표에 맞게 칼로리와 활동 목표를 설정해 드려요.</div>
            <div className="goal-grid">
              {goals.map(g => (
                <div key={g.key}
                  className={`goal-card${goal === g.key ? ' on' : ''}`}
                  onClick={() => setGoal(g.key as GoalType)}>
                  <div className="goal-ic">{g.icon}</div>
                  <div className="goal-nm">{g.name}</div>
                  <div className="goal-ds">{g.desc}</div>
                </div>
              ))}
            </div>
            <div className="flex1"/>
            <button className="btn" onClick={() => setStep(1)}>다음</button>
          </>
        )}

        {/* STEP 1: 신체 정보 */}
        {step === 1 && (
          <>
            <div className="step-label">2 / 4 — 내 정보</div>
            <div className="heading">나에 대해<br/>알려주세요</div>
            <div className="sub">정확한 칼로리 계산을 위해 필요해요.</div>

            <div className="field">
              <div className="field-label">나이</div>
              <input className="field-input" type="number" placeholder="예: 34"
                value={age} onChange={e => setAge(e.target.value)} inputMode="numeric"/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:18 }}>
              <div>
                <div className="field-label">키 (cm)</div>
                <input className="field-input" type="number" placeholder="178"
                  value={height} onChange={e => setHeight(e.target.value)} inputMode="numeric"/>
              </div>
              <div>
                <div className="field-label">몸무게 (kg)</div>
                <input className="field-input" type="number" placeholder="74"
                  value={weight} onChange={e => setWeight(e.target.value)} inputMode="numeric"/>
              </div>
            </div>

            <div className="field">
              <div className="field-label">성별</div>
              <div className="gender-row">
                {(['male','female'] as Gender[]).map(g => (
                  <button key={g}
                    className={`gender-btn${gender === g ? ' on' : ''}`}
                    onClick={() => setGender(g)}>
                    {g === 'male' ? '남성' : '여성'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex1"/>
            <button className="btn" onClick={() => setStep(2)}>다음</button>
            <button className="ghost-btn" onClick={() => setStep(0)}>← 이전</button>
          </>
        )}

        {/* STEP 2: 활동 소개 */}
        {step === 2 && (
          <>
            <div className="step-label">3 / 4 — 일상 칼로리</div>
            <div className="heading">일상도<br/><span style={{ color:'#D85A30' }}>칼로리</span>예요</div>
            <div className="sub">운동 말고도 이런 것들이 칼로리를 태워요.</div>
            <div className="act-list">
              {activities.map(a => (
                <div key={a.name} className="act-item" style={{ background: a.bg }}>
                  <div className="act-ic">{a.icon}</div>
                  <div>
                    <div className="act-nm">{a.name}</div>
                    <div className="act-cal">{a.cal}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex1"/>
            <button className="btn" onClick={() => setStep(3)}>다음</button>
            <button className="ghost-btn" onClick={() => setStep(1)}>← 이전</button>
          </>
        )}

        {/* STEP 3: 완료 */}
        {step === 3 && (
          <>
            <div className="step-label">4 / 4 — 준비 완료</div>
            <div className="heading">당신의 calio가<br/>준비됐어요 🎉</div>
            <div className="sub">입력한 정보를 바탕으로 맞춤 목표를 설정했어요.</div>

            <div className="summary-card">
              <div className="summary-lbl">맞춤 분석 결과</div>
              <div className="kcal-big">{kcalGoal.toLocaleString()}</div>
              <div className="kcal-unit">kcal / 일</div>
              <div className="kcal-sub">{height}cm · {weight}kg · {age}세 기준</div>
              <div style={{ height:0.5, background:'rgba(0,0,0,0.08)', margin:'0 0 16px' }}/>
              <div className="stat-row">
                {[
                  { val:'−500', lbl:'목표 적자' },
                  { val:'1kg',  lbl:'월 감량 예상' },
                  { val:'12주', lbl:'목표 달성' },
                ].map(s => (
                  <div key={s.lbl} className="stat-box">
                    <div className="stat-v">{s.val}</div>
                    <div className="stat-l">{s.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex1"/>
            <button className="btn" onClick={handleFinish} disabled={loading}>
              {loading ? '저장 중...' : 'calio 시작하기 →'}
            </button>
            <button className="ghost-btn" onClick={() => setStep(2)}>← 이전</button>
          </>
        )}

      </div>
    </>
  )
}
