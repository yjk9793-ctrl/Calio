'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  const handleGoogle = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleEmail = async () => {
    setLoading(true)
    setError('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/onboarding` }
        })
        if (error) throw error
        setError('이메일을 확인해주세요! 인증 링크를 보냈어요.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/home')
      }
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const s = styles

  return (
    <div style={s.wrap}>
      <div style={s.inner}>

        {/* 로고 */}
        <div style={s.logoRow}>
          <span style={s.logoTxt}>cali</span>
          <svg width="26" height="36" viewBox="0 0 26 36" style={{ overflow: 'visible' }}>
            <circle cx="13" cy="22" r="9.2" fill="none" stroke="rgba(216,90,48,0.2)" strokeWidth="6"/>
            <circle cx="13" cy="22" r="9.2" fill="none" stroke="#D85A30" strokeWidth="6"
              strokeDasharray="48 10" strokeLinecap="butt" transform="rotate(-90 13 22)"/>
            <circle cx="13" cy="12.8" r="3" fill="#D85A30"/>
          </svg>
        </div>

        {/* 헤딩 */}
        <div style={s.heading}>
          {mode === 'login' ? '다시 돌아오셨군요' : '같이 시작해봐요'}
        </div>
        <div style={s.subheading}>
          {mode === 'login' ? '오늘도 잘 먹고, 잘 움직여봐요.' : '구글 계정으로 빠르게 시작할 수 있어요.'}
        </div>

        {/* Google 버튼 */}
        <button onClick={handleGoogle} disabled={loading} style={s.googleBtn}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Google로 {mode === 'login' ? '로그인' : '가입'}하기
        </button>

        {/* 구분선 */}
        <div style={s.divider}>
          <div style={s.dividerLine}/>
          <span style={s.dividerTxt}>또는 이메일로</span>
          <div style={s.dividerLine}/>
        </div>

        {/* 이메일 */}
        <div style={s.field}>
          <div style={s.label}>이메일</div>
          <input
            style={s.input}
            type="email"
            placeholder="hello@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        {/* 비밀번호 */}
        <div style={s.field}>
          <div style={s.label}>비밀번호</div>
          <div style={{ position: 'relative' }}>
            <input
              style={s.input}
              type={showPw ? 'text' : 'password'}
              placeholder="8자 이상"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleEmail()}
            />
            <button
              onClick={() => setShowPw(!showPw)}
              style={s.eyeBtn}>
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {/* 에러 */}
        {error && (
          <div style={{
            ...s.errorBox,
            background: error.includes('이메일을 확인') ? '#E1F5EE' : '#FFF0F0',
            color: error.includes('이메일을 확인') ? '#085041' : '#8B0000',
            borderColor: error.includes('이메일을 확인') ? '#9FE1CB' : '#FFCCCC',
          }}>
            {error}
          </div>
        )}

        {/* 제출 버튼 */}
        <button onClick={handleEmail} disabled={loading} style={s.submitBtn}>
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>

        {/* 전환 */}
        <div style={s.switchRow}>
          {mode === 'login' ? (
            <>처음 오셨나요? <span style={s.switchLink} onClick={() => setMode('signup')}>회원가입</span></>
          ) : (
            <>이미 계정이 있어요 <span style={s.switchLink} onClick={() => setMode('login')}>로그인</span></>
          )}
        </div>

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
    padding: '40px 32px',
    border: '0.5px solid rgba(0,0,0,0.08)',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  logoTxt: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 32,
    fontWeight: 800,
    color: '#0F0E0D',
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  heading: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 22,
    fontWeight: 800,
    color: '#0F0E0D',
    letterSpacing: '-0.3px',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 13,
    color: '#7A7570',
    fontWeight: 300,
    marginBottom: 24,
  },
  googleBtn: {
    width: '100%',
    padding: '13px 16px',
    borderRadius: 13,
    border: '1px solid rgba(0,0,0,0.12)',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    color: '#0F0E0D',
    cursor: 'pointer',
    marginBottom: 20,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 0.5,
    background: 'rgba(0,0,0,0.1)',
  },
  dividerTxt: {
    fontSize: 11,
    color: '#7A7570',
    fontWeight: 300,
    whiteSpace: 'nowrap',
  },
  field: {
    marginBottom: 14,
  },
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
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 14,
    color: '#0F0E0D',
    outline: 'none',
  },
  eyeBtn: {
    position: 'absolute' as const,
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
  },
  errorBox: {
    padding: '12px 14px',
    borderRadius: 10,
    border: '1px solid',
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 14,
  },
  submitBtn: {
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
    marginBottom: 16,
  },
  switchRow: {
    textAlign: 'center' as const,
    fontSize: 12,
    color: '#7A7570',
    fontWeight: 300,
  },
  switchLink: {
    color: '#D85A30',
    fontWeight: 600,
    cursor: 'pointer',
  },
}
