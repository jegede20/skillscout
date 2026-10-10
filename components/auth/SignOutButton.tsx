'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/browser';
import { useSkillStore } from '@/lib/store';

export function SignOutButton({ className = 'btn-ghost' }: { className?: string }) {
  const router = useRouter();
  const signOutDemo = useSkillStore((s) => s.signOutDemo);

  const signOut = async () => {
    if (isSupabaseConfigured) await getSupabase().auth.signOut();
    else signOutDemo();
    router.push('/');
    router.refresh();
  };

  return (
    <button type="button" onClick={signOut} className={className}>
      <LogOut aria-hidden="true" className="h-4 w-4" /> Sign out
    </button>
  );
}
