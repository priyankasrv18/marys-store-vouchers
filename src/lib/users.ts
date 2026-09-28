import { supabase } from "@/integrations/supabase/client";

export type StaffMember = {
  id: string;
  full_name: string;
  department: string | null;
  designation: string | null;
  email: string | null;
  phone: string | null;
  college: string | null;
  created_at: string;
};

export const staffMembersQuery = {
  queryKey: ["staff-members"],
  queryFn: async (): Promise<StaffMember[]> => {
    const { data, error } = await supabase.from("staff_members").select("*").order("full_name");
    if (error) throw error;
    return (data ?? []) as StaffMember[];
  },
};
