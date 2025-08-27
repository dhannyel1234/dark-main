import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ isAuthenticated: false, user: null, profile: null });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('admin_level')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      isAuthenticated: true,
      user,
      profile
    });
  } catch (error) {
    console.error("Erro ao verificar sessão:", error);
    return NextResponse.json(
      { error: "Erro ao verificar sessão" },
      { status: 500 }
    );
  }
}