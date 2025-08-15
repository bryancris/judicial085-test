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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      additional_case_law: {
        Row: {
          case_name: string
          citation: string | null
          client_id: string
          court: string | null
          courtlistener_case_id: string | null
          created_at: string
          date_decided: string | null
          id: string
          legal_analysis_id: string | null
          outcome: string | null
          perplexity_research_id: string | null
          relevant_facts: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          case_name: string
          citation?: string | null
          client_id: string
          court?: string | null
          courtlistener_case_id?: string | null
          created_at?: string
          date_decided?: string | null
          id?: string
          legal_analysis_id?: string | null
          outcome?: string | null
          perplexity_research_id?: string | null
          relevant_facts?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          case_name?: string
          citation?: string | null
          client_id?: string
          court?: string | null
          courtlistener_case_id?: string | null
          created_at?: string
          date_decided?: string | null
          id?: string
          legal_analysis_id?: string | null
          outcome?: string | null
          perplexity_research_id?: string | null
          relevant_facts?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "additional_case_law_courtlistener_case_id_fkey"
            columns: ["courtlistener_case_id"]
            isOneToOne: false
            referencedRelation: "courtlistener_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      background_job_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_count: number | null
          id: string
          job_name: string
          metadata: Json | null
          processed_count: number | null
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          id?: string
          job_name: string
          metadata?: Json | null
          processed_count?: number | null
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          id?: string
          job_name?: string
          metadata?: Json | null
          processed_count?: number | null
          started_at?: string
          status?: string
        }
        Relationships: []
      }
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
      courtlistener_case_citations: {
        Row: {
          citation_context: string | null
          citation_type: string | null
          cited_case_id: string
          citing_case_id: string
          created_at: string
          id: string
        }
        Insert: {
          citation_context?: string | null
          citation_type?: string | null
          cited_case_id: string
          citing_case_id: string
          created_at?: string
          id?: string
        }
        Update: {
          citation_context?: string | null
          citation_type?: string | null
          cited_case_id?: string
          citing_case_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courtlistener_case_citations_cited_case_id_fkey"
            columns: ["cited_case_id"]
            isOneToOne: false
            referencedRelation: "courtlistener_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "courtlistener_case_citations_citing_case_id_fkey"
            columns: ["citing_case_id"]
            isOneToOne: false
            referencedRelation: "courtlistener_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      courtlistener_case_concepts: {
        Row: {
          case_id: string
          concept_type: string
          concept_value: string
          confidence: number | null
          created_at: string
          extracted_by: string | null
          id: string
        }
        Insert: {
          case_id: string
          concept_type: string
          concept_value: string
          confidence?: number | null
          created_at?: string
          extracted_by?: string | null
          id?: string
        }
        Update: {
          case_id?: string
          concept_type?: string
          concept_value?: string
          confidence?: number | null
          created_at?: string
          extracted_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courtlistener_case_concepts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "courtlistener_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      courtlistener_case_embeddings: {
        Row: {
          case_id: string
          content: string
          content_type: string
          created_at: string
          embedding: string | null
          id: string
        }
        Insert: {
          case_id: string
          content: string
          content_type: string
          created_at?: string
          embedding?: string | null
          id?: string
        }
        Update: {
          case_id?: string
          content?: string
          content_type?: string
          created_at?: string
          embedding?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courtlistener_case_embeddings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "courtlistener_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      courtlistener_cases: {
        Row: {
          absolute_url: string | null
          api_fetch_count: number | null
          case_name: string
          case_type: string | null
          citation: string | null
          court: string | null
          court_name: string | null
          courtlistener_id: string
          date_decided: string | null
          date_filed: string | null
          first_indexed_at: string
          full_text: string | null
          id: string
          jurisdiction: string | null
          last_updated_at: string
          precedential_status: string | null
          snippet: string | null
        }
        Insert: {
          absolute_url?: string | null
          api_fetch_count?: number | null
          case_name: string
          case_type?: string | null
          citation?: string | null
          court?: string | null
          court_name?: string | null
          courtlistener_id: string
          date_decided?: string | null
          date_filed?: string | null
          first_indexed_at?: string
          full_text?: string | null
          id?: string
          jurisdiction?: string | null
          last_updated_at?: string
          precedential_status?: string | null
          snippet?: string | null
        }
        Update: {
          absolute_url?: string | null
          api_fetch_count?: number | null
          case_name?: string
          case_type?: string | null
          citation?: string | null
          court?: string | null
          court_name?: string | null
          courtlistener_id?: string
          date_decided?: string | null
          date_filed?: string | null
          first_indexed_at?: string
          full_text?: string | null
          id?: string
          jurisdiction?: string | null
          last_updated_at?: string
          precedential_status?: string | null
          snippet?: string | null
        }
        Relationships: []
      }
      courtlistener_search_cache: {
        Row: {
          cached_at: string
          expires_at: string
          hit_count: number | null
          id: string
          original_query: string
          query_hash: string
          result_case_ids: string[] | null
          search_parameters: Json | null
          total_results: number | null
        }
        Insert: {
          cached_at?: string
          expires_at?: string
          hit_count?: number | null
          id?: string
          original_query: string
          query_hash: string
          result_case_ids?: string[] | null
          search_parameters?: Json | null
          total_results?: number | null
        }
        Update: {
          cached_at?: string
          expires_at?: string
          hit_count?: number | null
          id?: string
          original_query?: string
          query_hash?: string
          result_case_ids?: string[] | null
          search_parameters?: Json | null
          total_results?: number | null
        }
        Relationships: []
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
          client_id: string | null
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
          client_id?: string | null
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
          client_id?: string | null
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
          firm_id: string | null
          id: string
          include_in_analysis: boolean
          processed_at: string | null
          processing_error: string | null
          processing_notes: string | null
          processing_status: string | null
          schema: string | null
          title: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          firm_id?: string | null
          id: string
          include_in_analysis?: boolean
          processed_at?: string | null
          processing_error?: string | null
          processing_notes?: string | null
          processing_status?: string | null
          schema?: string | null
          title?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          firm_id?: string | null
          id?: string
          include_in_analysis?: boolean
          processed_at?: string | null
          processing_error?: string | null
          processing_notes?: string | null
          processing_status?: string | null
          schema?: string | null
          title?: string | null
          url?: string | null
          user_id?: string | null
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
      firm_case_types: {
        Row: {
          created_at: string
          firm_id: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          firm_id: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          firm_id?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          value?: string
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
      perplexity_research: {
        Row: {
          case_discussion_id: string | null
          citations: string[] | null
          client_id: string
          content: string
          created_at: string
          id: string
          legal_analysis_id: string
          metadata: Json | null
          model: string
          query: string
          search_type: string
          updated_at: string
          usage_data: Json | null
        }
        Insert: {
          case_discussion_id?: string | null
          citations?: string[] | null
          client_id: string
          content: string
          created_at?: string
          id?: string
          legal_analysis_id: string
          metadata?: Json | null
          model: string
          query: string
          search_type: string
          updated_at?: string
          usage_data?: Json | null
        }
        Update: {
          case_discussion_id?: string | null
          citations?: string[] | null
          client_id?: string
          content?: string
          created_at?: string
          id?: string
          legal_analysis_id?: string
          metadata?: Json | null
          model?: string
          query?: string
          search_type?: string
          updated_at?: string
          usage_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "perplexity_research_case_discussion_id_fkey"
            columns: ["case_discussion_id"]
            isOneToOne: false
            referencedRelation: "case_discussions"
            referencedColumns: ["id"]
          },
        ]
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
      quick_consult_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_consult_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "quick_consult_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_consult_sessions: {
        Row: {
          created_at: string
          firm_id: string | null
          id: string
          is_archived: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          firm_id?: string | null
          id?: string
          is_archived?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          firm_id?: string | null
          id?: string
          is_archived?: boolean
          title?: string
          updated_at?: string
          user_id?: string
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
          global_case_ids: string[] | null
          id: string
          legal_analysis_id: string
          search_cache_id: string | null
          search_metadata: Json | null
          updated_at: string
        }
        Insert: {
          case_data: Json
          client_id: string
          created_at?: string
          global_case_ids?: string[] | null
          id?: string
          legal_analysis_id: string
          search_cache_id?: string | null
          search_metadata?: Json | null
          updated_at?: string
        }
        Update: {
          case_data?: Json
          client_id?: string
          created_at?: string
          global_case_ids?: string[] | null
          id?: string
          legal_analysis_id?: string
          search_cache_id?: string | null
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
          {
            foreignKeyName: "similar_cases_search_cache_id_fkey"
            columns: ["search_cache_id"]
            isOneToOne: false
            referencedRelation: "courtlistener_search_cache"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          firm_id: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          firm_id?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          firm_id?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
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
      user_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity: string
          revoked_at: string | null
          revoked_by: string | null
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          revoked_at?: string | null
          revoked_by?: string | null
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity?: string
          revoked_at?: string | null
          revoked_by?: string | null
          session_token?: string
          user_agent?: string | null
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
      cleanup_old_job_runs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      delete_client_contract_reviews: {
        Args: { client_id_param: string }
        Returns: undefined
      }
      find_similar_research: {
        Args: {
          client_id_param: string
          query_param: string
          search_type_param: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          created_at: string
          id: string
          query: string
          similarity_score: number
        }[]
      }
      get_case_discussion_research: {
        Args: { discussion_id_param: string }
        Returns: {
          citations: string[]
          content: string
          created_at: string
          id: string
          metadata: Json
          model: string
          query: string
          search_type: string
          usage_data: Json
        }[]
      }
      get_case_documents: {
        Args: { case_id_param: string }
        Returns: {
          case_id: string
          client_id: string
          created_at: string
          id: string
          schema: string
          title: string
          url: string
        }[]
      }
      get_cases_needing_enrichment: {
        Args: { batch_size?: number }
        Returns: {
          api_fetch_count: number
          case_name: string
          courtlistener_id: string
          id: string
          last_updated_at: string
          snippet: string
        }[]
      }
      get_client_documents_with_cases: {
        Args: { case_id_filter?: string; client_id_param: string }
        Returns: {
          case_id: string
          case_title: string
          client_id: string
          created_at: string
          id: string
          schema: string
          title: string
          url: string
        }[]
      }
      get_client_research_for_analysis: {
        Args: { client_id_param: string; legal_analysis_id_param?: string }
        Returns: {
          case_discussion_id: string
          citations: string[]
          content: string
          created_at: string
          id: string
          query: string
          search_type: string
        }[]
      }
      get_client_research_stats: {
        Args: { client_id_param: string }
        Returns: {
          avg_confidence: number
          legal_research_count: number
          recent_research_count: number
          similar_cases_count: number
          total_research_count: number
        }[]
      }
      get_enrichment_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          cases_needing_enrichment: number
          cases_with_concepts: number
          cases_with_embeddings: number
          last_enrichment_run: string
          total_cases: number
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
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
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
      hybrid_search_courtlistener_cases: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding?: string
          query_text: string
          semantic_weight?: number
        }
        Returns: {
          absolute_url: string
          api_fetch_count: number
          case_name: string
          case_type: string
          citation: string
          combined_score: number
          court: string
          court_name: string
          courtlistener_id: string
          date_decided: string
          date_filed: string
          id: string
          jurisdiction: string
          precedential_status: string
          similarity: number
          snippet: string
          text_rank: number
        }[]
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
      link_research_to_analysis: {
        Args: { legal_analysis_id_param: string; research_id_param: string }
        Returns: boolean
      }
      log_background_job_complete: {
        Args: {
          error_count_param?: number
          job_run_id_param: string
          metadata_param?: Json
          processed_count_param?: number
          status_param?: string
        }
        Returns: boolean
      }
      log_background_job_start: {
        Args: { job_name_param: string; metadata_param?: Json }
        Returns: string
      }
      mark_case_processing_status: {
        Args: { case_id_param: string; status?: string }
        Returns: boolean
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      search_case_document_chunks_by_similarity: {
        Args: {
          case_id_param: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_client_and_case_documents_by_similarity: {
        Args: {
          case_id_param?: string
          client_id_param: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          case_id: string
          chunk_index: number
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_document_chunks: {
        Args: {
          client_id_param: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_document_chunks_by_similarity: {
        Args: {
          client_id_param: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_index: number
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
      search_similar_courtlistener_cases: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          absolute_url: string
          api_fetch_count: number
          case_name: string
          case_type: string
          citation: string
          court: string
          court_name: string
          courtlistener_id: string
          date_decided: string
          date_filed: string
          id: string
          jurisdiction: string
          precedential_status: string
          similarity: number
          snippet: string
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
      app_role: ["super_admin", "firm_admin", "attorney", "paralegal"],
    },
  },
} as const
