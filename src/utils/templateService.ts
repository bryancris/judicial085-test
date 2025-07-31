
import { supabase } from "@/integrations/supabase/client";

// Temporary service to handle template operations with type assertions
// until the Supabase types are fully regenerated

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  file_path: string;
  file_name: string;
  file_size?: number;
  user_id: string;
  firm_id?: string;
  created_at: string;
  updated_at: string;
}

export const templateService = {
  async getTemplates(userId: string, firmId?: string) {
    try {
      const { data, error } = await (supabase as any)
        .from('templates')
        .select('*')
        .or(`user_id.eq.${userId}${firmId ? `,firm_id.eq.${firmId}` : ''}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error fetching templates:', err);
      return { data: null, error: err.message };
    }
  },

  async deleteTemplate(templateId: string) {
    try {
      const { error } = await (supabase as any)
        .from('templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (err: any) {
      console.error('Error deleting template:', err);
      return { success: false, error: err.message };
    }
  },

  async insertTemplate(template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await (supabase as any)
        .from('templates')
        .insert(template)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (err: any) {
      console.error('Error inserting template:', err);
      return { data: null, error: err.message };
    }
  }
};
