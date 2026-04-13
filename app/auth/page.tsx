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

  return (
    <>
      <style>{`
        .auth-wrap {
          min-height: 100dvh;
          background: #fff;
          display: flex;
          flex-direction: column;
          padding: 64px 28px max(40px, env(safe-area-inset-bottom, 40px));
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .auth-logo-txt {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 36px;
          font-weight: 800;
          color: #0F0E0D;
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .auth-heading {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #0F0E0D;
          letter-spacing: -0.4px;
          margin-bottom: 6px;
          margin-top: 28px;
        }
        .auth-sub {
          font-size: 16px;
          color: #7A7570;
          font-weight: 300;
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .google-btn {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: 1.5px solid rgba(0,0,0,0.12);
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: #0F0E0D;
          cursor: pointer;
          margin-bottom: 24px;
          -webkit-tap-highlight-color: transparent;
        }
        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }
        .divider-line { flex: 1; height: 1px; background: rgba(0,0,0,0.08); }
        .divider-txt { font-size: 13px; color: #7A7570; font-weight: 300; white-space: nowrap; }
        .field-label {
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #7A7570;
          margin-bottom: 8px;
        }
        .field-input {
          width: 100%;
          padding: 16px;
          border-radius: 14px;
          border: 1.5px solid rgba(0,0,0,0.12);
          background: #F7F5F2;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 16px;
          color: #0F0E0D;
          outline: none;
          margin-bottom: 16px;
          -webkit-appearance: none;
        }
        .pw-wrap { position: relative; }
        .pw-toggle {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-65%);
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          color: #7A7570;
        }
        .forgot {
          text-align: right;
          font-size: 14px;
          color: #D85A30;
          font-weight: 500;
          cursor: pointer;
          margin-top: -8px;
          margin-bottom: 24px;
        }
        .submit-btn {
          width: 100%;
          padding: 18px;
          border-radius: 14px;
          background: #D85A30;
          color: #fff;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 17px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          margin-bottom: 20px;
          -webkit-tap-highlight-color: transparent;
        }
        .error-box {
          padding: 14px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.6;
          margin-bottom: 16px;
        }
        .switch-row {
          text-align: center;
          font-size: 15px;
          color: #7A7570;
          font-weight: 300;
        }
        .switch-link {
          color: #D85A30;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>

      <div className="auth-wrap">

        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span className="auth-logo-txt">cali</span>
          <svg width="26" height="36" viewBox="0 0 26 36" style={{ overflow: 'visible' }}>
            <circle cx="13" cy="22" r="9.2" fill="none" stroke="rgba(216,90,48,0.2)" strokeWidth="6"/>
            <circle cx="13" cy="22" r="9.2" fill="none" stroke="#D85A30" strokeWidth="6"
              strokeDasharray="48 10" strokeLinecap="butt" transform="rotate(-90 13 22)"/>
            <circle cx="13" cy="12.8" r="3" fill="#D85A30"/>
          </svg>
        </div>

        <div className="auth-heading">
          {mode === 'login' ? '다시 돌아오셨군요' : '같이 시작해봐요'}
        </div>
        <div className="auth-sub">
          {mode === 'login' ? '오늘도 잘 먹고, 잘 움직여봐요.' : '구글 계정으로 빠르게 시작할 수 있어요.'}
        </div>

        {/* Google */}
        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Google로 {mode === 'login' ? '로그인' : '가입'}하기
        </button>

        <div className="divider">
          <div className="divider-line"/>
          <span className="divider-txt">또는 이메일로</span>
          <div className="divider-line"/>
        </div>

        {/* 이메일 */}
        <div className="field-label">이메일</div>
        <input
          className="field-input"
          type="email"
          placeholder="hello@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        {/* 비밀번호 */}
        <div className="field-label">비밀번호</div>
        <div className="pw-wrap">
          <input
            className="field-input"
            type={showPw ? 'text' : 'password'}
            placeholder="8자 이상"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleEmail()}
          />
          <button className="pw-toggle" onClick={() => setShowPw(!showPw)}>
            {showPw ? '🙈' : '👁'}
          </button>
        </div>

        {mode === 'login' && (
          <div className="forgot">비밀번호를 잊으셨나요?</div>
        )}

        {error && (
          <div className="error-box" style={{
            background: error.includes('이메일을 확인') ? '#E1F5EE' : '#FFF0F0',
            color: error.includes('이메일을 확인') ? '#085041' : '#8B0000',
          }}>
            {error}
          </div>
        )}

        <button className="submit-btn" onClick={handleEmail} disabled={loading}>
          {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
        </button>

        <div className="switch-row">
          {mode === 'login' ? (
            <>처음 오셨나요? <span className="switch-link" onClick={() => setMode('signup')}>회원가입</span></>
          ) : (
            <>이미 계정이 있어요 <span className="switch-link" onClick={() => setMode('login')}>로그인</span></>
          )}
        </div>

      </div>
    </>
  )
}