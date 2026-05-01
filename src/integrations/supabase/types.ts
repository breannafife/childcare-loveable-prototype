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
      bookings: {
        Row: {
          created_at: string
          ends_at: string
          hourly_rate_snapshot: number
          id: string
          notes: string | null
          parent_id: string
          parent_postal_code: string | null
          sitter_id: string
          starts_at: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          hourly_rate_snapshot?: number
          id?: string
          notes?: string | null
          parent_id: string
          parent_postal_code?: string | null
          sitter_id: string
          starts_at: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          hourly_rate_snapshot?: number
          id?: string
          notes?: string | null
          parent_id?: string
          parent_postal_code?: string | null
          sitter_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitter_stats"
            referencedColumns: ["sitter_id"]
          },
          {
            foreignKeyName: "bookings_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      google_calendar_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          google_email: string
          id: string
          refresh_token: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          google_email: string
          id?: string
          refresh_token: string
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          google_email?: string
          id?: string
          refresh_token?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone: string | null
          postal_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          family_name: string
          id: string
          rating: number
          sitter_id: string
          text: string
        }
        Insert: {
          created_at?: string
          family_name: string
          id?: string
          rating: number
          sitter_id: string
          text: string
        }
        Update: {
          created_at?: string
          family_name?: string
          id?: string
          rating?: number
          sitter_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitter_stats"
            referencedColumns: ["sitter_id"]
          },
          {
            foreignKeyName: "reviews_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_calls: {
        Row: {
          cancelled_at: string | null
          created_at: string
          date_label: string
          duration_minutes: number
          google_event_id_parent: string | null
          google_event_id_sitter: string | null
          google_meet_link: string | null
          id: string
          meet_link: string
          sitter_id: string
          sitter_name: string
          sitter_photo: string
          slot_end_at: string | null
          slot_id: string | null
          slot_label: string
          slot_start_at: string | null
          status: string
          time_label: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          date_label: string
          duration_minutes?: number
          google_event_id_parent?: string | null
          google_event_id_sitter?: string | null
          google_meet_link?: string | null
          id?: string
          meet_link: string
          sitter_id: string
          sitter_name: string
          sitter_photo: string
          slot_end_at?: string | null
          slot_id?: string | null
          slot_label: string
          slot_start_at?: string | null
          status?: string
          time_label: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          date_label?: string
          duration_minutes?: number
          google_event_id_parent?: string | null
          google_event_id_sitter?: string | null
          google_meet_link?: string | null
          id?: string
          meet_link?: string
          sitter_id?: string
          sitter_name?: string
          sitter_photo?: string
          slot_end_at?: string | null
          slot_id?: string | null
          slot_label?: string
          slot_start_at?: string | null
          status?: string
          time_label?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_calls_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitter_stats"
            referencedColumns: ["sitter_id"]
          },
          {
            foreignKeyName: "scheduled_calls_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_calls_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "sitter_availability_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      sitter_availability_slots: {
        Row: {
          bucket: string | null
          created_at: string
          id: string
          is_booked: boolean
          sitter_id: string
          slot_end: string
          slot_start: string
        }
        Insert: {
          bucket?: string | null
          created_at?: string
          id?: string
          is_booked?: boolean
          sitter_id: string
          slot_end: string
          slot_start: string
        }
        Update: {
          bucket?: string | null
          created_at?: string
          id?: string
          is_booked?: boolean
          sitter_id?: string
          slot_end?: string
          slot_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "sitter_availability_slots_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitter_stats"
            referencedColumns: ["sitter_id"]
          },
          {
            foreignKeyName: "sitter_availability_slots_sitter_id_fkey"
            columns: ["sitter_id"]
            isOneToOne: false
            referencedRelation: "sitters"
            referencedColumns: ["id"]
          },
        ]
      }
      sitters: {
        Row: {
          availability: string[]
          bio: string
          certifications: string[]
          created_at: string
          distance_miles: number
          experience_tags: string[]
          hourly_rate: number
          id: string
          is_verified: boolean
          kids_in_area: number
          name: string
          photo_url: string
          postal_code: string
          rating: number
          rebooked_by_families: number
          slug: string
          updated_at: string
          user_id: string | null
          years_experience: number
        }
        Insert: {
          availability?: string[]
          bio?: string
          certifications?: string[]
          created_at?: string
          distance_miles?: number
          experience_tags?: string[]
          hourly_rate?: number
          id?: string
          is_verified?: boolean
          kids_in_area?: number
          name: string
          photo_url: string
          postal_code?: string
          rating?: number
          rebooked_by_families?: number
          slug: string
          updated_at?: string
          user_id?: string | null
          years_experience?: number
        }
        Update: {
          availability?: string[]
          bio?: string
          certifications?: string[]
          created_at?: string
          distance_miles?: number
          experience_tags?: string[]
          hourly_rate?: number
          id?: string
          is_verified?: boolean
          kids_in_area?: number
          name?: string
          photo_url?: string
          postal_code?: string
          rating?: number
          rebooked_by_families?: number
          slug?: string
          updated_at?: string
          user_id?: string | null
          years_experience?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      sitter_stats: {
        Row: {
          avg_rating: number | null
          repeat_families: number | null
          review_count: number | null
          sitter_id: string | null
          total_kids_watched: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      kids_in_area: {
        Args: { _fsa: string; _sitter_id: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "parent" | "sitter"
      booking_status: "requested" | "confirmed" | "completed" | "cancelled"
      call_status: "requested" | "confirmed" | "completed" | "cancelled"
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
  public: {
    Enums: {
      app_role: ["admin", "parent", "sitter"],
      booking_status: ["requested", "confirmed", "completed", "cancelled"],
      call_status: ["requested", "confirmed", "completed", "cancelled"],
    },
  },
} as const
