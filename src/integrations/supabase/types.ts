export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      case_analysis_notes: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          timestamp: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_analysis_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      case_discussions: {
        Row: {
          case_id: string | null
          client_id: string
          content: string
          created_at: string
          id: string
          role: string
          timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          client_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          timestamp: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_discussions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_discussions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          case_description: string | null
          case_notes: string | null
          case_number: string | null
          case_title: string
          case_type: string | null
          client_id: string
          created_at: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          case_description?: string | null
          case_notes?: string | null
          case_number?: string | null
          case_title: string
          case_type?: string | null
          client_id: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          case_description?: string | null
          case_notes?: string | null
          case_number?: string | null
          case_title?: string
          case_type?: string | null
          client_id?: string
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          case_id: string | null
          client_id: string
          content: string
          created_at: string
          id: string
          role: string
          timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          client_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          timestamp: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          case_description: string | null
          case_notes: string | null
          case_number: string | null
          case_types: string[] | null
          city: string | null
          created_at: string
          email: string
          firm_id: string | null
          first_name: string
          id: string
          last_name: string
          phone: string
          referred_by: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          case_description?: string | null
          case_notes?: string | null
          case_number?: string | null
          case_types?: string[] | null
          city?: string | null
          created_at?: string
          email: string
          firm_id?: string | null
          first_name: string
          id?: string
          last_name: string
          phone: string
          referred_by?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          case_description?: string | null
          case_notes?: string | null
          case_number?: string | null
          case_types?: string[] | null
          city?: string | null
          created_at?: string
          email?: string
          firm_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
          referred_by?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_reviews: {
        Row: {
          case_id: string | null
          client_id: string
          content: string
          created_at: string
          id: string
          role: string
          timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          client_id: string
          content: string
          created_at?: string
          id?: string
          role: string
          timestamp: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_reviews_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_documents: {
        Row: {
          created_at: string | null
          description: string | null
          document_id: number | null
          id: string
          name: string
          response_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          document_id?: number | null
          id?: string
          name: string
          response_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          document_id?: number | null
          id?: string
          name?: string
          response_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_documents_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovery_documents_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "discovery_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_requests: {
        Row: {
          client_id: string
          content: string
          created_at: string | null
          date_received: string | null
          id: string
          requesting_party: string | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string | null
          date_received?: string | null
          id?: string
          requesting_party?: string | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string | null
          date_received?: string | null
          id?: string
          requesting_party?: string | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_responses: {
        Row: {
          content: string
          created_at: string | null
          id: string
          request_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          request_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          request_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discovery_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "discovery_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_templates: {
        Row: {
          category: string
          content: string
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_chunks: {
        Row: {
          case_id: string | null
          chunk_index: number
          client_id: string
          content: string | null
          created_at: string | null
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          case_id?: string | null
          chunk_index: number
          client_id: string
          content?: string | null
          created_at?: string | null
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          case_id?: string | null
          chunk_index?: number
          client_id?: string
          content?: string | null
          created_at?: string | null
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      document_metadata: {
        Row: {
          case_id: string | null
          client_id: string | null
          created_at: string | null
          id: string
          include_in_analysis: boolean
          processed_at: string | null
          processing_error: string | null
          processing_notes: string | null
          processing_status: string | null
          schema: string | null
          title: string | null
          url: string | null
        }
        Insert: {
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id: string
          include_in_analysis?: boolean
          processed_at?: string | null
          processing_error?: string | null
          processing_notes?: string | null
          processing_status?: string | null
          schema?: string | null
          title?: string | null
          url?: string | null
        }
        Update: {
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          include_in_analysis?: boolean
          processed_at?: string | null
          processing_error?: string | null
          processing_notes?: string | null
          processing_status?: string | null
          schema?: string | null
          title?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_metadata_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_metadata_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_rows: {
        Row: {
          dataset_id: string | null
          id: number
          row_data: Json | null
        }
        Insert: {
          dataset_id?: string | null
          id?: number
          row_data?: Json | null
        }
        Update: {
          dataset_id?: string | null
          id?: number
          row_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_rows_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "document_metadata"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      firm_users: {
        Row: {
          created_at: string
          firm_id: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          firm_id: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          firm_id?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "firm_users_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      law_firms: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          state: string | null
          updated_at: string
          website: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      legal_analyses: {
        Row: {
          case_id: string | null
          case_type: string | null
          client_id: string
          content: string
          created_at: string
          id: string
          law_references: Json | null
          timestamp: string
          updated_at: string
          user_id: string
        }
        Insert: {
          case_id?: string | null
          case_type?: string | null
          client_id: string
          content: string
          created_at?: string
          id?: string
          law_references?: Json | null
          timestamp: string
          updated_at?: string
          user_id: string
        }
        Update: {
          case_id?: string | null
          case_type?: string | null
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          law_references?: Json | null
          timestamp?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_analyses_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_analyses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scholarly_references: {
        Row: {
          client_id: string
          created_at: string
          id: string
          legal_analysis_id: string
          reference_data: Json
          search_metadata: Json | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          legal_analysis_id: string
          reference_data?: Json
          search_metadata?: Json | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          legal_analysis_id?: string
          reference_data?: Json
          search_metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      similar_cases: {
        Row: {
          case_data: Json
          client_id: string
          created_at: string
          id: string
          legal_analysis_id: string
          search_metadata: Json | null
          updated_at: string
        }
        Insert: {
          case_data: Json
          client_id: string
          created_at?: string
          id?: string
          legal_analysis_id: string
          search_metadata?: Json | null
          updated_at?: string
        }
        Update: {
          case_data?: Json
          client_id?: string
          created_at?: string
          id?: string
          legal_analysis_id?: string
          search_metadata?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "similar_cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "similar_cases_legal_analysis_id_fkey"
            columns: ["legal_analysis_id"]
            isOneToOne: false
            referencedRelation: "legal_analyses"
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
      voice_transcripts: {
        Row: {
          client_id: string
          content: string
          created_at: string
          id: string
          session_id: string
          speaker: string
          timestamp: string
          user_id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          id?: string
          session_id: string
          speaker: string
          timestamp?: string
          user_id: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          session_id?: string
          speaker?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      delete_client_contract_reviews: {
        Args: { client_id_param: string }
        Returns: undefined
      }
      get_case_documents: {
        Args: { case_id_param: string }
        Returns: {
          id: string
          title: string
          url: string
          created_at: string
          schema: string
          client_id: string
          case_id: string
        }[]
      }
      get_client_documents_with_cases: {
        Args: { client_id_param: string; case_id_filter?: string }
        Returns: {
          id: string
          title: string
          url: string
          created_at: string
          schema: string
          client_id: string
          case_id: string
          case_title: string
        }[]
      }
      get_user_firm_id: {
        Args: { _user_id: string }
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      match_documents: {
        Args: { query_embedding: string; match_count?: number; filter?: Json }
        Returns: {
          id: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      search_case_document_chunks_by_similarity: {
        Args: {
          query_embedding: string
          case_id_param: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          document_id: string
          chunk_index: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      search_client_and_case_documents_by_similarity: {
        Args: {
          query_embedding: string
          client_id_param: string
          case_id_param?: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          document_id: string
          chunk_index: number
          content: string
          metadata: Json
          similarity: number
          case_id: string
        }[]
      }
      search_document_chunks: {
        Args: {
          query_embedding: string
          client_id_param: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          document_id: string
          chunk_index: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      search_document_chunks_by_similarity: {
        Args: {
          query_embedding: string
          client_id_param: string
          match_threshold?: number
          match_count?: number
        }
        Returns: {
          id: string
          document_id: string
          chunk_index: number
          content: string
          metadata: Json
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      app_role: "super_admin" | "firm_admin" | "attorney" | "paralegal"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "firm_admin", "attorney", "paralegal"],
    },
  },
} as const
