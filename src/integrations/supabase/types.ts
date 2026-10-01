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
  public: {
    Tables: {
      listings: {
        Row: {
          author_id: string | null
          country_code: string
          created_at: string
          detail: string | null
          id: string
          kind: string
          location: string | null
          price_text: string | null
          title: string
        }
        Insert: {
          author_id?: string | null
          country_code?: string
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          location?: string | null
          price_text?: string | null
          title: string
        }
        Update: {
          author_id?: string | null
          country_code?: string
          created_at?: string
          detail?: string | null
          id?: string
          kind?: string
          location?: string | null
          price_text?: string | null
          title?: string
        }
        Relationships: []
      }
      match_events: {
        Row: {
          id: string
          kind: string
          match_id: string
          minute: number
          player: string
          team: string
        }
        Insert: {
          id?: string
          kind?: string
          match_id: string
          minute: number
          player: string
          team: string
        }
        Update: {
          id?: string
          kind?: string
          match_id?: string
          minute?: number
          player?: string
          team?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_code: string
          away_score: number
          away_team: string
          competition: string
          country_code: string
          home_code: string
          home_score: number
          home_team: string
          id: string
          kickoff_at: string
          minute: number
          status: string
        }
        Insert: {
          away_code: string
          away_score?: number
          away_team: string
          competition: string
          country_code: string
          home_code: string
          home_score?: number
          home_team: string
          id?: string
          kickoff_at?: string
          minute?: number
          status?: string
        }
        Update: {
          away_code?: string
          away_score?: number
          away_team?: string
          competition?: string
          country_code?: string
          home_code?: string
          home_score?: number
          home_team?: string
          id?: string
          kickoff_at?: string
          minute?: number
          status?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          author_id: string
          author_name: string | null
          body: string
          channel: string
          created_at: string
          id: string
        }
        Insert: {
          author_id: string
          author_name?: string | null
          body: string
          channel?: string
          created_at?: string
          id?: string
        }
        Update: {
          author_id?: string
          author_name?: string | null
          body?: string
          channel?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          category: string
          country_code: string
          id: string
          published_at: string
          source: string | null
          summary: string
          title: string
        }
        Insert: {
          category: string
          country_code: string
          id?: string
          published_at?: string
          source?: string | null
          summary: string
          title: string
        }
        Update: {
          category?: string
          country_code?: string
          id?: string
          published_at?: string
          source?: string | null
          summary?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country_code: string
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string
          display_name?: string | null
          id: string
          phone?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      relative_posts: {
        Row: {
          author_id: string | null
          contact_phone: string | null
          country_code: string
          created_at: string
          details: string | null
          full_name: string
          id: string
          last_seen: string | null
          relation: string | null
        }
        Insert: {
          author_id?: string | null
          contact_phone?: string | null
          country_code?: string
          created_at?: string
          details?: string | null
          full_name: string
          id?: string
          last_seen?: string | null
          relation?: string | null
        }
        Update: {
          author_id?: string | null
          contact_phone?: string | null
          country_code?: string
          created_at?: string
          details?: string | null
          full_name?: string
          id?: string
          last_seen?: string | null
          relation?: string | null
        }
        Relationships: []
      }
      room_reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reported_id: string
          reported_name: string | null
          reporter_id: string
          room: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reported_id: string
          reported_name?: string | null
          reporter_id?: string
          room: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reported_id?: string
          reported_name?: string | null
          reporter_id?: string
          room?: string
        }
        Relationships: []
      }
      soulmate_posts: {
        Row: {
          about: string | null
          age: number | null
          author_id: string | null
          country_code: string
          created_at: string
          display_name: string
          gender: string | null
          id: string
          seeking: string | null
        }
        Insert: {
          about?: string | null
          age?: number | null
          author_id?: string | null
          country_code?: string
          created_at?: string
          display_name: string
          gender?: string | null
          id?: string
          seeking?: string | null
        }
        Update: {
          about?: string | null
          age?: number | null
          author_id?: string | null
          country_code?: string
          created_at?: string
          display_name?: string
          gender?: string | null
          id?: string
          seeking?: string | null
        }
        Relationships: []
      }
      soulmate_profiles: {
        Row: {
          about: string | null
          age: number | null
          country_code: string
          created_at: string
          display_name: string
          gender: string | null
          interests: string | null
          partner_preferences: string | null
          personal_values: string | null
          seeking: string | null
          show_about: boolean
          show_age: boolean
          show_gender: boolean
          show_interests: boolean
          show_preferences: boolean
          show_values: boolean
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          about?: string | null
          age?: number | null
          country_code?: string
          created_at?: string
          display_name: string
          gender?: string | null
          interests?: string | null
          partner_preferences?: string | null
          personal_values?: string | null
          seeking?: string | null
          show_about?: boolean
          show_age?: boolean
          show_gender?: boolean
          show_interests?: boolean
          show_preferences?: boolean
          show_values?: boolean
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          about?: string | null
          age?: number | null
          country_code?: string
          created_at?: string
          display_name?: string
          gender?: string | null
          interests?: string | null
          partner_preferences?: string | null
          personal_values?: string | null
          seeking?: string | null
          show_about?: boolean
          show_age?: boolean
          show_gender?: boolean
          show_interests?: boolean
          show_preferences?: boolean
          show_values?: boolean
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_soulmate_directory: {
        Args: { _country: string }
        Returns: {
          about: string
          age: number
          display_name: string
          gender: string
          interests: string
          partner_preferences: string
          personal_values: string
          seeking: string
          user_id: string
        }[]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
