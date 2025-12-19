// Core Types for Snippet Factory

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  plan: 'free' | 'pro' | 'enterprise';
}

export interface Team {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  plan: 'free' | 'pro' | 'enterprise';
  member_count: number;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Snippet {
  id: string;
  title: string;
  description?: string;
  code: string;
  language: string;
  category: string;
  tags: string[];
  team_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  placeholders?: Placeholder[];
  usage_count: number;
  popularity_score: number;
}

export interface Placeholder {
  id: string;
  name: string;
  type: 'text' | 'email' | 'url' | 'number' | 'date' | 'id';
  default_value?: string;
  validation_regex?: string;
  required: boolean;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  team_id: string;
  color: string;
  icon?: string;
  snippet_count: number;
}

export interface SnippetUsage {
  id: string;
  snippet_id: string;
  user_id: string;
  team_id: string;
  action: 'view' | 'copy' | 'edit' | 'create';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  user_id: string;
  team_id: string;
  action: string;
  resource_type: 'snippet' | 'team' | 'user' | 'category';
  resource_id: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface Analytics {
  total_snippets: number;
  total_usage: number;
  top_snippets: Array<{
    snippet_id: string;
    title: string;
    usage_count: number;
  }>;
  usage_by_category: Record<string, number>;
  team_activity: Array<{
    date: string;
    count: number;
  }>;
}

export interface SearchFilters {
  query?: string;
  language?: string;
  category?: string;
  tags?: string[];
  created_by?: string;
  date_from?: string;
  date_to?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
