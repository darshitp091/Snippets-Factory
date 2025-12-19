import { supabase } from './supabase';
import { Snippet, SearchFilters, PaginationParams, ApiResponse } from '@/types';
import { sanitizeCode } from '@/utils/security';
import { PLAN_FEATURES, PlanType } from './plans';

export class SnippetService {
  /**
   * Check if user can create more snippets based on their plan
   */
  static async canUserCreateSnippet(userId: string): Promise<{ allowed: boolean; message?: string; plan?: PlanType; current?: number; max?: number }> {
    try {
      // Fetch user data with plan and snippet count
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('plan, snippet_count, max_snippets')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return { allowed: false, message: 'User not found' };
      }

      const plan = userData.plan as PlanType;
      const currentCount = userData.snippet_count || 0;
      const maxSnippets = PLAN_FEATURES[plan].maxSnippets;

      // -1 means unlimited
      if (maxSnippets === -1) {
        return { allowed: true, plan, current: currentCount, max: -1 };
      }

      // Check if user has reached the limit
      if (currentCount >= maxSnippets) {
        return {
          allowed: false,
          message: `You've reached your ${plan} plan limit of ${maxSnippets} snippets. Upgrade to Pro for unlimited snippets.`,
          plan,
          current: currentCount,
          max: maxSnippets
        };
      }

      return { allowed: true, plan, current: currentCount, max: maxSnippets };
    } catch (error) {
      console.error('Error checking snippet limit:', error);
      return { allowed: false, message: 'Failed to check snippet limit' };
    }
  }

  /**
   * Create a new snippet
   */
  static async createSnippet(
    snippet: Omit<Snippet, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'popularity_score'>
  ): Promise<ApiResponse<Snippet>> {
    try {
      // Check if user can create more snippets
      const canCreate = await this.canUserCreateSnippet(snippet.created_by);

      if (!canCreate.allowed) {
        return {
          success: false,
          error: canCreate.message || 'Cannot create snippet',
          data: {
            limitReached: true,
            plan: canCreate.plan,
            current: canCreate.current,
            max: canCreate.max
          } as any
        };
      }

      const sanitizedCode = sanitizeCode(snippet.code);

      const { data, error } = await supabase
        .from('snippets')
        .insert({
          ...snippet,
          code: sanitizedCode,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await this.logSnippetAction(data.id, snippet.created_by, snippet.team_id, 'create');

      return { success: true, data };
    } catch (error) {
      console.error('Error creating snippet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create snippet'
      };
    }
  }

  /**
   * Get snippet by ID
   */
  static async getSnippet(id: string): Promise<ApiResponse<Snippet>> {
    try {
      const { data, error } = await supabase
        .from('snippets')
        .select(`
          *,
          categories(id, name, color),
          users!created_by(id, full_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return { success: true, data };
    } catch (error) {
      console.error('Error fetching snippet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch snippet'
      };
    }
  }

  /**
   * Update snippet
   */
  static async updateSnippet(
    id: string,
    updates: Partial<Snippet>
  ): Promise<ApiResponse<Snippet>> {
    try {
      const sanitizedUpdates = {
        ...updates,
        code: updates.code ? sanitizeCode(updates.code) : undefined,
      };

      const { data, error } = await supabase
        .from('snippets')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log the action
      if (data) {
        await this.logSnippetAction(id, data.created_by, data.team_id, 'edit');
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error updating snippet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update snippet'
      };
    }
  }

  /**
   * Delete snippet
   */
  static async deleteSnippet(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('snippets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true, message: 'Snippet deleted successfully' };
    } catch (error) {
      console.error('Error deleting snippet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete snippet'
      };
    }
  }

  /**
   * Search snippets with filters and pagination
   */
  static async searchSnippets(
    teamId: string,
    filters: SearchFilters = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<ApiResponse<{ snippets: Snippet[]; total: number }>> {
    try {
      let query = supabase
        .from('snippets')
        .select('*, categories(id, name, color)', { count: 'exact' })
        .eq('team_id', teamId);

      // Apply filters
      if (filters.query) {
        query = query.or(`title.ilike.%${filters.query}%,description.ilike.%${filters.query}%,code.ilike.%${filters.query}%`);
      }

      if (filters.language) {
        query = query.eq('language', filters.language);
      }

      if (filters.category) {
        query = query.eq('category_id', filters.category);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      if (filters.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Apply sorting
      const sortBy = pagination.sort_by || 'created_at';
      const sortOrder = pagination.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const start = (pagination.page - 1) * pagination.limit;
      query = query.range(start, start + pagination.limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        success: true,
        data: {
          snippets: data || [],
          total: count || 0
        }
      };
    } catch (error) {
      console.error('Error searching snippets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search snippets'
      };
    }
  }

  /**
   * Log snippet action
   */
  static async logSnippetAction(
    snippetId: string,
    userId: string,
    teamId: string,
    action: 'view' | 'copy' | 'edit' | 'create'
  ): Promise<void> {
    try {
      await supabase.from('snippet_usage').insert({
        snippet_id: snippetId,
        user_id: userId,
        team_id: teamId,
        action,
      });

      // Update usage count and popularity score
      if (action === 'copy') {
        await supabase.rpc('increment_snippet_usage', { snippet_id: snippetId });
      }
    } catch (error) {
      console.error('Error logging snippet action:', error);
    }
  }

  /**
   * Get popular snippets
   */
  static async getPopularSnippets(
    teamId: string,
    limit: number = 10
  ): Promise<ApiResponse<Snippet[]>> {
    try {
      const { data, error } = await supabase
        .from('snippets')
        .select('*, categories(id, name, color)')
        .eq('team_id', teamId)
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Error fetching popular snippets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch popular snippets'
      };
    }
  }

  /**
   * Get snippets by category
   */
  static async getSnippetsByCategory(
    categoryId: string,
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<ApiResponse<{ snippets: Snippet[]; total: number }>> {
    try {
      const start = (pagination.page - 1) * pagination.limit;

      const { data, error, count } = await supabase
        .from('snippets')
        .select('*, categories(id, name, color)', { count: 'exact' })
        .eq('category_id', categoryId)
        .order('created_at', { ascending: false })
        .range(start, start + pagination.limit - 1);

      if (error) throw error;

      return {
        success: true,
        data: {
          snippets: data || [],
          total: count || 0
        }
      };
    } catch (error) {
      console.error('Error fetching snippets by category:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch snippets'
      };
    }
  }
}
