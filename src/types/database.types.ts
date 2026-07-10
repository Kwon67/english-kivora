export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      billing_checkout_sessions: {
        Row: {
          created_at: string
          metadata: Json
          provider: string
          provider_checkout_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          metadata?: Json
          provider: string
          provider_checkout_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          metadata?: Json
          provider?: string
          provider_checkout_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_events: {
        Row: {
          event_id: string
          event_type: string
          metadata: Json
          payload_hash: string
          processed_at: string
          processing_status: string
          provider: string
          provider_checkout_id: string | null
          provider_subscription_id: string | null
          received_at: string
          user_id: string | null
        }
        Insert: {
          event_id: string
          event_type: string
          metadata?: Json
          payload_hash: string
          processed_at?: string
          processing_status: string
          provider: string
          provider_checkout_id?: string | null
          provider_subscription_id?: string | null
          received_at?: string
          user_id?: string | null
        }
        Update: {
          event_id?: string
          event_type?: string
          metadata?: Json
          payload_hash?: string
          processed_at?: string
          processing_status?: string
          provider?: string
          provider_checkout_id?: string | null
          provider_subscription_id?: string | null
          received_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      billing_provider_links: {
        Row: {
          created_at: string
          metadata: Json
          provider: string
          provider_checkout_id: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          metadata?: Json
          provider: string
          provider_checkout_id?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          metadata?: Json
          provider?: string
          provider_checkout_id?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blitz_runs: {
        Row: {
          cards_answered: number
          created_at: string
          duration_ms: number
          id: string
          max_combo: number
          score: number
          user_id: string
        }
        Insert: {
          cards_answered?: number
          created_at?: string
          duration_ms?: number
          id?: string
          max_combo?: number
          score: number
          user_id: string
        }
        Update: {
          cards_answered?: number
          created_at?: string
          duration_ms?: number
          id?: string
          max_combo?: number
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blitz_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_templates: {
        Row: {
          created_at: string
          description: string | null
          game_mode: string
          id: string
          name: string
          pack_id: string
          reward_badge_id: string | null
          time_limit_minutes: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          game_mode: string
          id?: string
          name: string
          pack_id: string
          reward_badge_id?: string | null
          time_limit_minutes?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          game_mode?: string
          id?: string
          name?: string
          pack_id?: string
          reward_badge_id?: string | null
          time_limit_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_templates_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_templates_reward_badge_id_fkey"
            columns: ["reward_badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assigned_by: string
          assigned_date: string
          created_at: string
          game_mode: string
          id: string
          pack_id: string | null
          reward_badge_id: string | null
          reward_evaluated: boolean
          status: string
          user_id: string | null
        }
        Insert: {
          assigned_by?: string
          assigned_date?: string
          created_at?: string
          game_mode?: string
          id?: string
          pack_id?: string | null
          reward_badge_id?: string | null
          reward_evaluated?: boolean
          status?: string
          user_id?: string | null
        }
        Update: {
          assigned_by?: string
          assigned_date?: string
          created_at?: string
          game_mode?: string
          id?: string
          pack_id?: string | null
          reward_badge_id?: string | null
          reward_evaluated?: boolean
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_reward_badge_id_fkey"
            columns: ["reward_badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          condition_type: string
          created_at: string
          description: string
          icon_name: string
          id: string
          name: string
          target_value: number
        }
        Insert: {
          condition_type: string
          created_at?: string
          description: string
          icon_name: string
          id?: string
          name: string
          target_value: number
        }
        Update: {
          condition_type?: string
          created_at?: string
          description?: string
          icon_name?: string
          id?: string
          name?: string
          target_value?: number
        }
        Relationships: []
      }
      card_reviews: {
        Row: {
          card_id: string
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          next_review_date: string
          pack_id: string
          quality: number
          repetitions: number
          review_date: string
          total_reviews: number
          updated_at: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          next_review_date: string
          pack_id: string
          quality?: number
          repetitions?: number
          review_date?: string
          total_reviews?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          next_review_date?: string
          pack_id?: string
          quality?: number
          repetitions?: number
          review_date?: string
          total_reviews?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_reviews_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_reviews_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cards: {
        Row: {
          accepted_translations: string[]
          audio_url: string | null
          created_at: string
          english_phrase: string
          id: string
          pack_id: string | null
          portuguese_translation: string
        }
        Insert: {
          accepted_translations?: string[]
          audio_url?: string | null
          created_at?: string
          english_phrase: string
          id?: string
          pack_id?: string | null
          portuguese_translation: string
        }
        Update: {
          accepted_translations?: string[]
          audio_url?: string | null
          created_at?: string
          english_phrase?: string
          id?: string
          pack_id?: string | null
          portuguese_translation?: string
        }
        Relationships: [
          {
            foreignKeyName: "cards_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          assignment_id: string | null
          completed_at: string
          correct_answers: number
          id: string
          max_streak: number
          user_id: string | null
          wrong_answers: number
        }
        Insert: {
          assignment_id?: string | null
          completed_at?: string
          correct_answers?: number
          id?: string
          max_streak?: number
          user_id?: string | null
          wrong_answers?: number
        }
        Update: {
          assignment_id?: string | null
          completed_at?: string
          correct_answers?: number
          id?: string
          max_streak?: number
          user_id?: string | null
          wrong_answers?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_group_members: {
        Row: {
          created_at: string
          group_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "member_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      member_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      placement_responses: {
        Row: {
          card_id: string
          correct: boolean
          created_at: string
          id: string
          pack_id: string
          pack_level: string
          question_index: number
          response_time_ms: number
          user_id: string
        }
        Insert: {
          card_id: string
          correct: boolean
          created_at?: string
          id?: string
          pack_id: string
          pack_level: string
          question_index: number
          response_time_ms: number
          user_id: string
        }
        Update: {
          card_id?: string
          correct?: boolean
          created_at?: string
          id?: string
          pack_id?: string
          pack_level?: string
          question_index?: number
          response_time_ms?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "placement_responses_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_responses_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "placement_responses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_resource_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          level: string | null
          metadata: Json
          resource_id: string
          resource_kind: string | null
          resource_title: string
          resource_url: string
          stage: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          level?: string | null
          metadata?: Json
          resource_id: string
          resource_kind?: string | null
          resource_title: string
          resource_url: string
          stage: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          level?: string | null
          metadata?: Json
          resource_id?: string
          resource_kind?: string | null
          resource_title?: string
          resource_url?: string
          stage?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_resource_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_plan_history: {
        Row: {
          created_at: string
          headline: string
          id: string
          level: string | null
          metrics: Json
          outcome_notes: string[]
          outcome_status: string
          plan_date: string
          primary_action_href: string
          primary_action_id: string
          resource_ids: string[]
          signals: string[]
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          headline: string
          id?: string
          level?: string | null
          metrics?: Json
          outcome_notes?: string[]
          outcome_status?: string
          plan_date: string
          primary_action_href: string
          primary_action_id: string
          resource_ids?: string[]
          signals?: string[]
          stage: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          headline?: string
          id?: string
          level?: string | null
          metrics?: Json
          outcome_notes?: string[]
          outcome_status?: string
          plan_date?: string
          primary_action_href?: string
          primary_action_id?: string
          resource_ids?: string[]
          signals?: string[]
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_plan_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      packs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean | null
          cover_url: string | null
          category: string | null
          owner_id: string | null
          level: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          cover_url?: string | null
          category?: string | null
          owner_id?: string | null
          level?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          cover_url?: string | null
          category?: string | null
          owner_id?: string | null
          level?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          email: string
          id: string
          last_seen_at: string | null
          role: string
          updated_at: string
          weekly_report_enabled: boolean | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email: string
          id: string
          last_seen_at?: string | null
          role?: string
          updated_at?: string
          weekly_report_enabled?: boolean | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          last_seen_at?: string | null
          role?: string
          updated_at?: string
          weekly_report_enabled?: boolean | null
          username?: string
        }
        Relationships: []
      }
      pro_entitlements: {
        Row: {
          created_at: string
          current_period_end: string | null
          downgraded_at: string | null
          grace_period_ends_at: string | null
          metadata: Json
          payment_failure_notified_at: string | null
          revoked_at: string | null
          renewal_reminder_sent_at: string | null
          source: string
          source_reference_hash: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          downgraded_at?: string | null
          grace_period_ends_at?: string | null
          metadata?: Json
          payment_failure_notified_at?: string | null
          revoked_at?: string | null
          renewal_reminder_sent_at?: string | null
          source: string
          source_reference_hash: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          downgraded_at?: string | null
          grace_period_ends_at?: string | null
          metadata?: Json
          payment_failure_notified_at?: string | null
          revoked_at?: string | null
          renewal_reminder_sent_at?: string | null
          source?: string
          source_reference_hash?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          enabled: boolean
          endpoint: string
          expiration_time: string | null
          id: string
          last_notified_at: string | null
          last_notified_due_count: number
          last_notified_for_date: string | null
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          enabled?: boolean
          endpoint: string
          expiration_time?: string | null
          id?: string
          last_notified_at?: string | null
          last_notified_due_count?: number
          last_notified_for_date?: string | null
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          enabled?: boolean
          endpoint?: string
          expiration_time?: string | null
          id?: string
          last_notified_at?: string | null
          last_notified_due_count?: number
          last_notified_for_date?: string | null
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cefr_assessments: {
        Row: {
          assessed_at: string | null
          confidence: number
          created_at: string
          estimated_level: string | null
          level_changed_at: string | null
          level_scores: Json
          level_source: string
          previous_level: string | null
          total_interactions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assessed_at?: string | null
          confidence?: number
          created_at?: string
          estimated_level?: string | null
          level_changed_at?: string | null
          level_scores?: Json
          level_source?: string
          previous_level?: string | null
          total_interactions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assessed_at?: string | null
          confidence?: number
          created_at?: string
          estimated_level?: string | null
          level_changed_at?: string | null
          level_scores?: Json
          level_source?: string
          previous_level?: string | null
          total_interactions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cefr_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding: {
        Row: {
          created_at: string
          daily_goal_minutes: number | null
          interests: string[]
          level_source: string | null
          onboarding_completed_at: string | null
          placement_confidence: number | null
          starter_pack_id: string | null
          study_experience: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_goal_minutes?: number | null
          interests?: string[]
          level_source?: string | null
          onboarding_completed_at?: string | null
          placement_confidence?: number | null
          starter_pack_id?: string | null
          study_experience?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_goal_minutes?: number | null
          interests?: string[]
          level_source?: string | null
          onboarding_completed_at?: string | null
          placement_confidence?: number | null
          starter_pack_id?: string | null
          study_experience?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_onboarding_starter_pack_id_fkey"
            columns: ["starter_pack_id"]
            isOneToOne: false
            referencedRelation: "packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_onboarding_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          streak_frozen_until: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_frozen_until?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          streak_frozen_until?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      session_errors: {
        Row: {
          card_id: string
          created_at: string | null
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string | null
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string | null
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_errors_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_errors_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "game_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_errors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_blocks: {
        Row: {
          created_at: string
          expires_at: string
          identifier_hash: string
          kind: string
          metadata: Json
          reason: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          identifier_hash: string
          kind: string
          metadata?: Json
          reason: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          identifier_hash?: string
          kind?: string
          metadata?: Json
          reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quests: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          progress: number
          quest_type: string
          status: string
          target: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          progress?: number
          quest_type: string
          status?: string
          target: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          progress?: number
          quest_type?: string
          status?: string
          target?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_verifications: {
        Row: {
          id: string
          email: string
          email_hash: string
          username: string
          password_ciphertext: string
          code_hash: string
          attempt_count: number
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          email_hash: string
          username: string
          password_ciphertext: string
          code_hash: string
          attempt_count?: number
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          email_hash?: string
          username?: string
          password_ciphertext?: string
          code_hash?: string
          attempt_count?: number
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_abacatepay_subscription_event: {
        Args: {
          p_current_period_end: string | null
          p_entitlement_status: string | null
          p_event_id: string
          p_event_type: string
          p_grace_period_ends_at: string | null
          p_metadata?: Json
          p_payload_hash: string
          p_provider_checkout_id: string | null
          p_provider_customer_id: string | null
          p_provider_subscription_id: string | null
          p_source_reference_hash: string | null
          p_user_id: string | null
        }
        Returns: Json
      }
      get_weekly_leaderboard: {
        Args: { window_start?: string }
        Returns: {
          accuracy: number
          avatar_url: string
          best_streak: number
          rank: number
          score: number
          sessions: number
          user_id: string
          username: string
        }[]
      }
      get_weekly_blitz_leaderboard: {
        Args: { p_window_start: string; p_limit?: number }
        Returns: {
          rank: number
          user_id: string
          username: string
          score: number
          max_combo: number
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      has_active_pro_entitlement: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

export type Profile = Tables<'profiles'> & { avatar_emoji?: string }
export type Pack = Tables<'packs'>
export type Card = Tables<'cards'> & { en?: string; pt?: string; order_index?: number }
export type Assignment = Tables<'assignments'>
export type GameSession = Tables<'game_sessions'>
export type SessionError = Tables<'session_errors'>
export type CardReview = Tables<'card_reviews'>
export type MemberGroup = Tables<'member_groups'>
export type AssignmentTemplate = Tables<'assignment_templates'>
export type GameMode = 'multiple_choice' | 'typing' | 'flashcard' | 'matching' | 'listening' | 'speaking'
