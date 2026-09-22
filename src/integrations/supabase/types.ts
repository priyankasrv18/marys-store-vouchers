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
      main_heads: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      issue_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          issue_id: string
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          issue_id: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          issue_id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issue_attachments_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          authorised_by: string | null
          balance_stock: number
          created_at: string
          created_by: string | null
          department: string | null
          id: string
          issue_date: string
          issued_by: string | null
          issued_to: string
          item_id: string
          qty_issued: number
          using_area: string | null
          voucher_no: string
        }
        Insert: {
          authorised_by?: string | null
          balance_stock?: number
          created_at?: string
          created_by?: string | null
          department?: string | null
          id?: string
          issue_date?: string
          issued_by?: string | null
          issued_to: string
          item_id: string
          qty_issued?: number
          using_area?: string | null
          voucher_no: string
        }
        Update: {
          authorised_by?: string | null
          balance_stock?: number
          created_at?: string
          created_by?: string | null
          department?: string | null
          id?: string
          issue_date?: string
          issued_by?: string | null
          issued_to?: string
          item_id?: string
          qty_issued?: number
          using_area?: string | null
          voucher_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          available_stock: number
          created_at: string
          id: string
          main_head: string
          name: string
          reorder_level: number
          sub_head: string
          unit: string
          unit_price: number
        }
        Insert: {
          available_stock?: number
          created_at?: string
          id?: string
          main_head: string
          name: string
          reorder_level?: number
          sub_head: string
          unit?: string
          unit_price?: number
        }
        Update: {
          available_stock?: number
          created_at?: string
          id?: string
          main_head?: string
          name?: string
          reorder_level?: number
          sub_head?: string
          unit?: string
          unit_price?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      receipts: {
        Row: {
          approved_by: string | null
          bill_no: string | null
          created_at: string
          created_by: string | null
          expiry_date: string | null
          id: string
          item_id: string
          mfg_date: string | null
          purchase_date: string
          quantity: number
          total_amount: number
          unit_price: number
          vendor_address: string | null
          vendor_name: string
          vendor_phone: string | null
          voucher_no: string
        }
        Insert: {
          approved_by?: string | null
          bill_no?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          item_id: string
          mfg_date?: string | null
          purchase_date?: string
          quantity?: number
          total_amount?: number
          unit_price?: number
          vendor_address?: string | null
          vendor_name: string
          vendor_phone?: string | null
          voucher_no: string
        }
        Update: {
          approved_by?: string | null
          bill_no?: string | null
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          item_id?: string
          mfg_date?: string | null
          purchase_date?: string
          quantity?: number
          total_amount?: number
          unit_price?: number
          vendor_address?: string | null
          vendor_name?: string
          vendor_phone?: string | null
          voucher_no?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
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
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff"
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
    Enums: {
      app_role: ["admin", "staff"],
    },
  },
} as const
