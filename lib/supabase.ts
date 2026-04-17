import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://fahyxpezllsabcnefaim.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHl4cGV6bGxzYWJjbmVmYWltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTE4NzQsImV4cCI6MjA4OTM4Nzg3NH0.gE_JpXzEZrEOONxiK55fCsWeQ5LAh7qSGFYF-4k4qAk'
);

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fahyxpezllsabcnefaim.supabase.co';
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';