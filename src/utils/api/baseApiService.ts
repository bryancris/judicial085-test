
import { supabase } from "@/integrations/supabase/client";

// Base function to invoke Supabase edge functions with error handling
export const invokeFunction = async <T>(
  functionName: string,
  body: any
): Promise<{ data: T | null; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body,
    });

    if (error) {
      console.error(`Error calling ${functionName}:`, error);
      return { data: null, error: error.message };
    }

    return { data };
  } catch (err: any) {
    console.error(`Error invoking ${functionName}:`, err);
    return { data: null, error: err.message };
  }
};
