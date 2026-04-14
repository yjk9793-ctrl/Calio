'use client'

import { useRouter, usePathname } from 'next/navigation'

export default function BottomNav() {
  const router = useRouter()
  const path = usePathname()
  const hideOn = ['/', '/auth', '/onboarding']
  if (hideOn.some(p => path === p || path.startsWith(p))) return null

  const items = [
    { label: '홈',  icon: '🏠', href: '/home' },
    { label: '음식', icon: '📸', href: '/scan' },
    { label: '활동', icon: '⚡', href: '/activity' },
    { label: '통계', icon: '📊', href: '/stats' },
  ]

  return (
    <>
      <style>{`
        .bnav-global {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 430px;
          background: #fff;
          border-top: 1px solid rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          z-index: 100;
        }
        .bnav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 12px 0;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
          border: none;
          background: none;
        }
        .bnav-dot {
          width: 4px;
          height: 4px;
          border-radius: 2px;
          background: #D85A30;
        }
        .bnav-ic {
          font-size: 26px;
          line-height: 1;
        }
        .bnav-ic.off {
          opacity: 0.3;
          filter: grayscale(1);
        }
        .bnav-lb {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          color: #bbb;
        }
        .bnav-lb.on {
          color: #D85A30;
          font-weight: 700;
        }
      `}</style>

      <nav className="bnav-global">
        {items.map(item => {
          const isOn = path === item.href || (item.href === '/home' && path === '/')
          return (
            <button
              key={item.href}
              className="bnav-item"
              onClick={() => router.push(item.href)}>
              {isOn && <div className="bnav-dot"/>}
              <div className={`bnav-ic${isOn ? '' : ' off'}`}>{item.icon}</div>
              <div className={`bnav-lb${isOn ? ' on' : ''}`}>{item.label}</div>
            </button>
          )
        })}
      </nav>
    </>
  )
}
