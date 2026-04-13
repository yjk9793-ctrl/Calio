export type GoalType = 'lose_weight' | 'maintain' | 'healthy_habit' | 'brain_activity'
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type ActivityType = 'exercise' | 'reading' | 'conversation' | 'walking' | 'meditation' | 'music' | 'other'
export type ChallengeType = 'intake' | 'burn' | 'balance' | 'diet'
export type ChallengeStatus = 'active' | 'completed' | 'failed'
export type BadgeCategory = 'meal' | 'activity' | 'streak' | 'challenge'
export type PlanType = 'monthly' | 'yearly'
export type SubStatus = 'active' | 'cancelled' | 'expired' | 'trialing'

export interface User {
  id: string
  email?: string
  nickname?: string
  avatar_url?: string
  gender?: 'male' | 'female'
  birth_date?: string
  height_cm?: number
  weight_kg?: number
  goal_type: GoalType
  daily_kcal_goal: number
  is_premium: boolean
  premium_expires_at?: string
  streak_days: number
  last_logged_date?: string
  god_score: number
  total_xp: number
  created_at: string
  updated_at: string
}

export interface Meal {
  id: string
  user_id: string
  meal_name: string
  meal_type: MealType
  calories: number
  carbs_g?: number
  protein_g?: number
  fat_g?: number
  sodium_mg?: number
  sugar_g?: number
  fiber_g?: number
  image_url?: string
  ai_confidence?: number
  ai_comment?: string
  logged_at: string
  created_at: string
}

export interface Activity {
  id: string
  user_id: string
  activity_type: ActivityType
  duration_min: number
  calories_burned: number
  memo?: string
  logged_at: string
  created_at: string
}

export interface Challenge {
  id: string
  user_id: string
  challenge_type: ChallengeType
  title?: string
  daily_kcal_goal: number
  duration_days: number
  start_date: string
  end_date: string
  status: ChallengeStatus
  completed_days: number
  share_image_url?: string
  created_at: string
}

export interface ChallengeLog {
  id: string
  challenge_id: string
  user_id: string
  log_date: string
  daily_kcal: number
  is_achieved: boolean
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description?: string
  category: BadgeCategory
  icon?: string
  condition_type?: string
  condition_value?: number
  xp_reward: number
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  xp_earned?: number
  badge?: Badge
}

export interface Subscription {
  id: string
  user_id: string
  plan_type: PlanType
  status: SubStatus
  trial_ends_at?: string
  started_at: string
  expires_at?: string
  stripe_sub_id?: string
  created_at: string
}

// DB 타입 (Supabase 자동생성 대체용)
export interface Database {
  public: {
    Tables: {
      users:          { Row: User;          Insert: Partial<User>;          Update: Partial<User> }
      meals:          { Row: Meal;          Insert: Partial<Meal>;          Update: Partial<Meal> }
      activities:     { Row: Activity;      Insert: Partial<Activity>;      Update: Partial<Activity> }
      challenges:     { Row: Challenge;     Insert: Partial<Challenge>;     Update: Partial<Challenge> }
      challenge_logs: { Row: ChallengeLog;  Insert: Partial<ChallengeLog>;  Update: Partial<ChallengeLog> }
      badges:         { Row: Badge;         Insert: Partial<Badge>;         Update: Partial<Badge> }
      user_badges:    { Row: UserBadge;     Insert: Partial<UserBadge>;     Update: Partial<UserBadge> }
      subscriptions:  { Row: Subscription;  Insert: Partial<Subscription>;  Update: Partial<Subscription> }
    }
  }
}
