import { supabase } from "../lib/supabase";

export async function listMajors(): Promise<{ id: number; name: string }[]> {
    const { data, error } = await supabase
        .from("majors")
        .select("id, name")
        .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
}