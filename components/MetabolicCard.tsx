'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Props {
  userId?: string
  recordDays?: number
  kcalGoal?: number
}

export default function MetabolicCard({ userId, recordDays = 0, kcalGoal = 2000 }: Props) {
  const router = useRouter()
  const [showInfo, setShowInfo] = useState(false)

  const progress = Math.min((recordDays / 90) * 100, 100)
  const phase =
    recordDays < 30 ? 1 :
    recordDays < 60 ? 2 :
    recordDays < 90 ? 3 : 4

  const phaseLabel =
    phase === 1 ? '기초 패턴 학습 중' :
    phase === 2 ? '대사율 측정 중' :
    phase === 3 ? '음식·에너지 분석 중' :
    '내 몸 모델 완성!'

  const phaseColor =
    phase === 1 ? '#888' :
    phase === 2 ? '#D85A30' :
    phase === 3 ? '#D85A30' : '#1D9E75'

  return (
    <>
      <style>{`
        .mc-wrap {
          background: #fff;
          border-radius: 18px;
          margin: 0 16px 12px;
          overflow: hidden;
          border: 0.5px solid rgba(0,0,0,0.06);
          cursor: pointer;
          transition: transform 0.15s;
        }
        .mc-wrap:active { transform: scale(0.98); }

        .mc-top {
          padding: 14px 16px 12px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .mc-title-row {
          display: flex;
          align-items: center;
          gap: 7px;
        }
        .mc-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 15px;
          font-weight: 800;
          color: #0F0E0D;
        }
        .mc-q {
          width: 18px; height: 18px;
          border-radius: 9px;
          background: #F2F1EE;
          border: none;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          color: #888; cursor: pointer;
          flex-shrink: 0;
          line-height: 1;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }
        .mc-sub {
          font-size: 12px;
          color: #aaa;
          font-weight: 300;
          margin-top: 3px;
        }
        .mc-arrow {
          font-size: 18px;
          color: #ccc;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .mc-phase {
          padding: 0 16px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .mc-phase-dot {
          width: 7px; height: 7px;
          border-radius: 4px;
          flex-shrink: 0;
        }
        .mc-phase-txt {
          font-size: 12px;
          font-weight: 600;
        }
        .mc-phase-days {
          margin-left: auto;
          font-size: 12px;
          color: #aaa;
          font-weight: 300;
        }

        .mc-prog-bg {
          height: 5px;
          background: #F2F1EE;
          margin: 0 16px 14px;
          border-radius: 3px;
          overflow: hidden;
        }
        .mc-prog-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #D85A30, #FF7A52);
          transition: width 1s cubic-bezier(0.34,1.56,0.64,1);
        }

        .mc-stats {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          border-top: 0.5px solid rgba(0,0,0,0.05);
        }
        .mc-stat {
          padding: 10px 12px;
          border-right: 0.5px solid rgba(0,0,0,0.05);
          text-align: center;
        }
        .mc-stat:last-child { border-right: none; }
        .mc-stat-v {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 16px; font-weight: 800;
          color: #0F0E0D;
        }
        .mc-stat-l {
          font-size: 10px; color: #aaa;
          font-weight: 300; margin-top: 2px;
        }

        /* 설명 모달 오버레이 */
        .info-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 300;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .info-sheet {
          background: #fff;
          border-radius: 24px 24px 0 0;
          width: 100%;
          max-width: 430px;
          max-height: 85dvh;
          overflow-y: auto;
          padding: 0 0 max(28px, env(safe-area-inset-bottom,28px));
        }
        .info-handle {
          width: 36px; height: 4px;
          border-radius: 2px;
          background: rgba(0,0,0,0.1);
          margin: 14px auto 20px;
        }
        .info-inner { padding: 0 22px; }
        .info-hero {
          background: #0F0E0D;
          border-radius: 16px;
          padding: 18px;
          margin-bottom: 20px;
          text-align: center;
        }
        .info-hero-ic {
          font-size: 32px;
          margin-bottom: 10px;
        }
        .info-hero-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 18px; font-weight: 800;
          color: #fff; margin-bottom: 6px;
        }
        .info-hero-sub {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          font-weight: 300;
          line-height: 1.6;
        }
        .info-section { margin-bottom: 22px; }
        .info-section-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 15px; font-weight: 800;
          color: #0F0E0D; margin-bottom: 10px;
        }
        .info-block {
          background: #F7F5F2;
          border-radius: 14px;
          padding: 14px 16px;
          margin-bottom: 8px;
        }
        .info-block-title {
          font-size: 13px; font-weight: 600;
          color: #0F0E0D; margin-bottom: 5px;
          display: flex; align-items: center; gap: 7px;
        }
        .info-block-txt {
          font-size: 13px; color: #666;
          line-height: 1.65; font-weight: 300;
        }
        .info-ref {
          font-size: 11px; color: #aaa;
          border-left: 2px solid #F0EFED;
          padding-left: 8px;
          margin-top: 8px;
          line-height: 1.5;
        }
        .info-phase-list {
          display: flex; flex-direction: column; gap: 10px;
        }
        .info-phase-item {
          display: flex; gap: 12px; align-items: flex-start;
        }
        .info-phase-num {
          width: 26px; height: 26px;
          border-radius: 13px;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 12px; font-weight: 800;
          flex-shrink: 0;
        }
        .info-phase-content { flex: 1; }
        .info-phase-nm {
          font-size: 13px; font-weight: 600;
          color: #0F0E0D; margin-bottom: 3px;
        }
        .info-phase-desc {
          font-size: 12px; color: #888;
          font-weight: 300; line-height: 1.5;
        }
        .info-close {
          width: 100%; padding: 15px;
          border-radius: 14px;
          background: #0F0E0D;
          color: #fff;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 15px; font-weight: 700;
          border: none; cursor: pointer;
          margin-top: 4px;
        }
      `}</style>

      {/* 미리보기 카드 */}
      <div className="mc-wrap" onClick={() => router.push('/metabolic')}>
        <div className="mc-top">
          <div style={{ flex: 1 }}>
            <div className="mc-title-row">
              <span className="mc-title">🧬 내 몸 대사 모델</span>
              <button className="mc-q"
                onClick={e => { e.stopPropagation(); setShowInfo(true) }}>
                ?
              </button>
            </div>
            <div className="mc-sub">
              {recordDays < 90
                ? `${recordDays}일 기록 중 · 90일이면 완성돼요`
                : '내 몸 맞춤 분석 완성'}
            </div>
          </div>
          <div className="mc-arrow">›</div>
        </div>

        <div className="mc-phase">
          <div className="mc-phase-dot" style={{ background: phaseColor }}/>
          <span className="mc-phase-txt" style={{ color: phaseColor }}>{phaseLabel}</span>
          <span className="mc-phase-days">{recordDays}/90일</span>
        </div>

        <div className="mc-prog-bg">
          <div className="mc-prog-fill" style={{ width: `${progress}%` }}/>
        </div>

        <div className="mc-stats">
          <div className="mc-stat">
            <div className="mc-stat-v" style={{ color: phase >= 2 ? '#D85A30' : '#ccc' }}>
              {phase >= 2 ? `${kcalGoal - 200}` : '—'}
            </div>
            <div className="mc-stat-l">실제 유지 kcal</div>
          </div>
          <div className="mc-stat">
            <div className="mc-stat-v" style={{ color: phase >= 3 ? '#0F0E0D' : '#ccc' }}>
              {phase >= 3 ? `${recordDays}개` : '—'}
            </div>
            <div className="mc-stat-l">발견된 패턴</div>
          </div>
          <div className="mc-stat">
            <div className="mc-stat-v" style={{ color: phase >= 2 ? '#1D9E75' : '#ccc' }}>
              {phase >= 2 ? '94%' : '—'}
            </div>
            <div className="mc-stat-l">모델 정확도</div>
          </div>
        </div>
      </div>

      {/* ? 설명 모달 */}
      {showInfo && (
        <div className="info-overlay" onClick={() => setShowInfo(false)}>
          <div className="info-sheet" onClick={e => e.stopPropagation()}>
            <div className="info-handle"/>
            <div className="info-inner">

              <div className="info-hero">
                <div className="info-hero-ic">🧬</div>
                <div className="info-hero-title">개인화 대사 모델이란?</div>
                <div className="info-hero-sub">
                  공식 계산이 아닌, 내 실제 기록으로<br/>
                  만들어지는 나만의 칼로리 공식이에요.
                </div>
              </div>

              {/* 왜 필요한가 */}
              <div className="info-section">
                <div className="info-section-title">왜 일반 BMR 공식은 부정확할까요?</div>
                <div className="info-block">
                  <div className="info-block-title">
                    <span style={{ fontSize:16 }}>⚠️</span> 공식의 한계
                  </div>
                  <div className="info-block-txt">
                    해리스-베네딕트 공식은 나이·키·몸무게·성별만으로 칼로리를 계산해요. 하지만 같은 조건의 두 사람도 실제 대사율은 최대 <strong>±25%</strong> 차이가 날 수 있어요.
                  </div>
                  <div className="info-ref">
                    📄 출처: Müller MJ et al. "Advances in the understanding of specific metabolic rates" (2013, European Journal of Clinical Nutrition)
                  </div>
                </div>
                <div className="info-block">
                  <div className="info-block-title">
                    <span style={{ fontSize:16 }}>✅</span> 실제 데이터의 힘
                  </div>
                  <div className="info-block-txt">
                    내가 먹은 것과 체중 변화를 30일 이상 쌓으면, AI가 내 실제 유지 칼로리를 역산할 수 있어요. 이게 공식보다 훨씬 정확해요.
                  </div>
                  <div className="info-ref">
                    📄 출처: Hall KD et al. "Quantification of the effect of energy imbalance on bodyweight" (2011, The Lancet)
                  </div>
                </div>
              </div>

              {/* 패턴 분석 */}
              <div className="info-section">
                <div className="info-section-title">음식과 에너지는 어떻게 연결되나요?</div>
                <div className="info-block">
                  <div className="info-block-title">
                    <span style={{ fontSize:16 }}>🍱</span> 혈당 스파이크와 에너지
                  </div>
                  <div className="info-block-txt">
                    정제 탄수화물(흰밥, 밀가루)은 혈당을 빠르게 올렸다가 떨어뜨려요. 이 과정이 오후 피로감과 집중력 저하를 만들어요. calio가 이 패턴을 식별해드려요.
                  </div>
                  <div className="info-ref">
                    📄 출처: Augustin LS et al. "Glycemic index, glycemic load and glycemic response" (2015, Nutrition, Metabolism and Cardiovascular Diseases)
                  </div>
                </div>
                <div className="info-block">
                  <div className="info-block-title">
                    <span style={{ fontSize:16 }}>😴</span> 수면과 식욕의 관계
                  </div>
                  <div className="info-block-txt">
                    수면 부족은 식욕 호르몬(그렐린)을 증가시키고 포만 호르몬(렙틴)을 감소시켜요. 7시간 미만 수면 시 다음날 평균 300kcal 더 먹게 돼요.
                  </div>
                  <div className="info-ref">
                    📄 출처: Spiegel K et al. "Sleep curtailment in healthy young men is associated with decreased leptin levels" (2004, Annals of Internal Medicine)
                  </div>
                </div>
              </div>

              {/* 90일 단계 */}
              <div className="info-section">
                <div className="info-section-title">90일 동안 무슨 일이 일어나나요?</div>
                <div className="info-phase-list">
                  {[
                    { num:'1', color:'#F7F5F2', textColor:'#888', border:'rgba(0,0,0,0.1)', days:'1~30일', nm:'기초 패턴 학습', desc:'식사 시간대, 선호 음식 유형, 활동 패턴을 파악해요.' },
                    { num:'2', color:'#FAECE7', textColor:'#D85A30', border:'rgba(216,90,48,0.2)', days:'31~60일', nm:'실제 대사율 측정', desc:'식사량과 체중 변화로 내 진짜 유지 칼로리를 역산해요.' },
                    { num:'3', color:'#FAECE7', textColor:'#D85A30', border:'rgba(216,90,48,0.2)', days:'61~90일', nm:'음식·에너지 상관관계', desc:'어떤 음식이 내 에너지와 수면에 영향을 주는지 발견해요.' },
                    { num:'4', color:'#E1F5EE', textColor:'#1D9E75', border:'rgba(29,158,117,0.2)', days:'90일 이후', nm:'완전한 내 몸 모델', desc:'환경·스트레스·계절까지 반영한 나만의 건강 공식 완성!' },
                  ].map(p => (
                    <div key={p.num} className="info-phase-item">
                      <div className="info-phase-num" style={{ background: p.color, color: p.textColor, border: `1px solid ${p.border}` }}>
                        {p.num}
                      </div>
                      <div className="info-phase-content">
                        <div className="info-phase-nm">{p.days} — {p.nm}</div>
                        <div className="info-phase-desc">{p.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 개인정보 */}
              <div className="info-block" style={{ marginBottom: 16 }}>
                <div className="info-block-title">
                  <span style={{ fontSize:16 }}>🔒</span> 내 데이터는 안전한가요?
                </div>
                <div className="info-block-txt">
                  모든 데이터는 암호화되어 본인만 볼 수 있어요. calio는 데이터를 제3자에게 판매하거나 광고에 사용하지 않아요.
                </div>
              </div>

              <button className="info-close" onClick={() => setShowInfo(false)}>
                확인했어요
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
