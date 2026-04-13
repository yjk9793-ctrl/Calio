// 활동 유형별 칼로리 소비량 (kcal/분 × 체중 70kg 기준)
const ACTIVITY_KCAL_PER_MIN: Record<string, number> = {
  exercise:     7.0,   // 조깅 기준
  walking:      3.5,
  reading:      1.4,
  conversation: 1.1,
  meditation:   1.0,
  music:        1.6,
  other:        2.0,
}

export function calcActivityCalories(
  activityType: string,
  durationMin: number,
  weightKg: number = 70
): number {
  const base = ACTIVITY_KCAL_PER_MIN[activityType] ?? 2.0
  const weightFactor = weightKg / 70
  return Math.round(base * durationMin * weightFactor)
}

// 하루 기초대사량 (Mifflin-St Jeor)
export function calcBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female'
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

// 목표별 권장 칼로리
export function calcGoalCalories(
  bmr: number,
  goalType: string
): number {
  const multipliers: Record<string, number> = {
    lose_weight:    0.85,
    maintain:       1.0,
    healthy_habit:  1.0,
    brain_activity: 1.05,
  }
  return Math.round(bmr * (multipliers[goalType] ?? 1.0))
}

// 오늘 날짜 (한국 기준)
export function todayKST(): string {
  return new Date().toLocaleDateString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/\. /g, '-').replace('.', '')
}

// 연속 기록 업데이트
export function calcStreak(lastLoggedDate: string | null, streakDays: number): number {
  if (!lastLoggedDate) return 1
  const last = new Date(lastLoggedDate)
  const today = new Date()
  const diff = Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
  if (diff === 0) return streakDays       // 오늘 이미 기록함
  if (diff === 1) return streakDays + 1  // 어제 기록 → 연속 유지
  return 1                                // 끊김 → 리셋
}
