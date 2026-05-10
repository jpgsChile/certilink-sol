import { supabase } from "@/lib/supabase";
import type { Otec } from "@/lib/database.types";

export interface SignUpPayload {
  email: string;
  password: string;
  institucion: string;
}

export interface SignInPayload {
  email: string;
  password: string;
}

export const authService = {
  /** Sign up a new user and create their OTEC record */
  async signUp({ email, password, institucion }: SignUpPayload) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("No se pudo crear el usuario");

    // Create the OTEC record
    const { error: otecError } = await supabase.from("otecs").insert({
      user_id: authData.user.id,
      nombre: institucion,
    });

    if (otecError) throw otecError;

    return authData;
  },

  /** Sign in with email and password */
  async signIn({ email, password }: SignInPayload) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  /** Sign out */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /** Get current session */
  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /** Get current user's OTEC record */
  async getOtec(): Promise<Otec | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("otecs")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) return null;
    return data;
  },
};