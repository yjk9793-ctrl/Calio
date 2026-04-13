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
      })
      router.push('/home')
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const s = styles

  return (
    <div style={s.wrap}>
      <div style={s.inner}>

        {/* 진행 바 */}
        {step > 0 && (
          <div style={s.progressRow}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{
                ...s.progressPip,
                background: i < step ? '#1D9E75' : i === step ? '#D85A30' : 'rgba(0,0,0,0.1)',
                width: i === step ? 20 : 6,
              }}/>
            ))}
          </div>
        )}

        {/* STEP 0: 목표 선택 */}
        {step === 0 && (
          <div>
            <div style={s.stepLabel}>1 / 4 — 목표 설정</div>
            <div style={s.heading}>어떤 목표로<br/>시작할까요?</div>
            <div style={s.sub}>목표에 맞게 칼로리와 활동 목표를 설정해 드려요.</div>
            <div style={s.goalGrid}>
              {goals.map(g => (
                <div key={g.key}
                  onClick={() => setGoal(g.key as GoalType)}
                  style={{
                    ...s.goalCard,
                    borderColor: goal === g.key ? '#D85A30' : 'rgba(0,0,0,0.1)',
                    background: goal === g.key ? '#FAECE7' : '#fff',
                  }}>
                  <div style={{ fontSize: 20 }}>{g.icon}</div>
                  <div style={s.goalName}>{g.name}</div>
                  <div style={s.goalDesc}>{g.desc}</div>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)} style={s.btn}>다음</button>
          </div>
        )}

        {/* STEP 1: 신체 정보 */}
        {step === 1 && (
          <div>
            <div style={s.stepLabel}>2 / 4 — 내 정보</div>
            <div style={s.heading}>나에 대해<br/>알려주세요</div>
            <div style={s.sub}>정확한 칼로리 계산을 위해 필요해요.</div>

            <div style={s.field}>
              <div style={s.label}>나이</div>
              <input style={s.input} type="number" placeholder="예: 34"
                value={age} onChange={e => setAge(e.target.value)}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
              <div>
                <div style={s.label}>키 (cm)</div>
                <input style={s.input} type="number" placeholder="178"
                  value={height} onChange={e => setHeight(e.target.value)}/>
              </div>
              <div>
                <div style={s.label}>몸무게 (kg)</div>
                <input style={s.input} type="number" placeholder="74"
                  value={weight} onChange={e => setWeight(e.target.value)}/>
              </div>
            </div>
            <div style={s.field}>
              <div style={s.label}>성별</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['male', 'female'] as Gender[]).map(g => (
                  <button key={g} onClick={() => setGender(g)} style={{
                    ...s.genderBtn,
                    borderColor: gender === g ? '#D85A30' : 'rgba(0,0,0,0.1)',
                    background: gender === g ? '#FAECE7' : '#F7F5F2',
                    color: gender === g ? '#993C1D' : '#7A7570',
                    fontWeight: gender === g ? 600 : 400,
                  }}>
                    {g === 'male' ? '남성' : '여성'}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} style={s.btn}>다음</button>
            <button onClick={() => setStep(0)} style={s.ghostBtn}>← 이전</button>
          </div>
        )}

        {/* STEP 2: 활동 소개 */}
        {step === 2 && (
          <div>
            <div style={s.stepLabel}>3 / 4 — 일상 칼로리</div>
            <div style={s.heading}>일상도<br/><span style={{ color: '#D85A30' }}>칼로리</span>예요</div>
            <div style={s.sub}>운동 말고도 이런 것들이 칼로리를 태워요.</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {activities.map(a => (
                <div key={a.name} style={{ ...s.actItem, background: a.bg }}>
                  <div style={s.actIcon}>{a.icon}</div>
                  <div>
                    <div style={s.actName}>{a.name}</div>
                    <div style={s.actCal}>{a.cal}</div>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setStep(3)} style={s.btn}>다음</button>
            <button onClick={() => setStep(1)} style={s.ghostBtn}>← 이전</button>
          </div>
        )}

        {/* STEP 3: 완료 */}
        {step === 3 && (
          <div>
            <div style={s.stepLabel}>4 / 4 — 준비 완료</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={s.readyIcon}>🎉</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#7A7570', marginBottom: 4 }}>준비 완료</div>
                <div style={s.heading2}>당신의 calio가<br/>준비됐어요</div>
              </div>
            </div>

            <div style={s.summaryCard}>
              <div style={s.summaryLabel}>맞춤 분석 결과</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
                <span style={s.kcalNum}>{kcalGoal.toLocaleString()}</span>
                <span style={s.kcalUnit}>kcal / 일</span>
              </div>
              <div style={s.kcalSub}>
                {height}cm · {weight}kg · {age}세 기준
              </div>
              <div style={s.divLine}/>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { val: '−500', lbl: '목표 적자' },
                  { val: '1kg',  lbl: '월 감량 예상' },
                  { val: '12주', lbl: '목표 달성' },
                ].map(item => (
                  <div key={item.lbl} style={s.statBox}>
                    <div style={s.statVal}>{item.val}</div>
                    <div style={s.statLbl}>{item.lbl}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleFinish} disabled={loading} style={s.btn}>
              {loading ? '저장 중...' : 'calio 시작하기 →'}
            </button>
            <button onClick={() => setStep(2)} style={s.ghostBtn}>← 이전</button>
          </div>
        )}

      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    background: '#F7F5F2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  inner: {
    width: '100%',
    maxWidth: 400,
    background: '#fff',
    borderRadius: 24,
    padding: '36px 28px',
    border: '0.5px solid rgba(0,0,0,0.08)',
  },
  progressRow: {
    display: 'flex',
    gap: 6,
    marginBottom: 24,
    alignItems: 'center',
  },
  progressPip: {
    height: 3,
    borderRadius: 2,
    transition: 'all 0.3s',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: '#7A7570',
    marginBottom: 8,
  },
  heading: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 24,
    fontWeight: 800,
    color: '#0F0E0D',
    letterSpacing: '-0.4px',
    lineHeight: 1.2,
    marginBottom: 6,
  },
  heading2: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 20,
    fontWeight: 800,
    color: '#0F0E0D',
    letterSpacing: '-0.3px',
    lineHeight: 1.2,
  },
  sub: {
    fontSize: 13,
    color: '#7A7570',
    fontWeight: 300,
    lineHeight: 1.6,
    marginBottom: 20,
  },
  goalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
    marginBottom: 20,
  },
  goalCard: {
    border: '1.5px solid',
    borderRadius: 14,
    padding: '14px 12px',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  goalName: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: '#0F0E0D',
    marginTop: 6,
  },
  goalDesc: {
    fontSize: 11,
    color: '#7A7570',
    fontWeight: 300,
    marginTop: 2,
  },
  field: { marginBottom: 14 },
  label: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.07em',
    textTransform: 'uppercase' as const,
    color: '#7A7570',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 12,
    border: '1.5px solid rgba(0,0,0,0.12)',
    background: '#F7F5F2',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 15,
    fontWeight: 500,
    color: '#0F0E0D',
    outline: 'none',
  },
  genderBtn: {
    width: '100%',
    padding: '12px',
    borderRadius: 12,
    border: '1.5px solid',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13,
    cursor: 'pointer',
  },
  actItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px',
    borderRadius: 13,
  },
  actIcon: { fontSize: 20, flexShrink: 0 },
  actName: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 13,
    fontWeight: 700,
    color: '#0F0E0D',
  },
  actCal: { fontSize: 11, color: '#7A7570', fontWeight: 300, marginTop: 2 },
  readyIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    background: '#FAECE7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    flexShrink: 0,
  },
  summaryCard: {
    background: '#F7F5F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#7A7570',
    marginBottom: 10,
  },
  kcalNum: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 36,
    fontWeight: 800,
    color: '#D85A30',
    lineHeight: 1,
  },
  kcalUnit: { fontSize: 13, color: '#993C1D', fontWeight: 500 },
  kcalSub: { fontSize: 11, color: '#7A7570', fontWeight: 300, marginBottom: 12 },
  divLine: { height: 0.5, background: 'rgba(0,0,0,0.08)', margin: '12px 0' },
  statBox: {
    background: '#fff',
    borderRadius: 10,
    padding: '10px 8px',
    textAlign: 'center' as const,
  },
  statVal: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 16,
    fontWeight: 800,
    color: '#0F0E0D',
  },
  statLbl: { fontSize: 10, color: '#7A7570', fontWeight: 300, marginTop: 2 },
  btn: {
    width: '100%',
    padding: 15,
    borderRadius: 14,
    background: '#D85A30',
    color: '#fff',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    marginBottom: 8,
  },
  ghostBtn: {
    width: '100%',
    padding: 10,
    borderRadius: 14,
    background: 'transparent',
    color: '#7A7570',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13,
    border: 'none',
    cursor: 'pointer',
  },
}
