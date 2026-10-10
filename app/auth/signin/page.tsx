import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignInForm } from '@/components/auth/SignInForm';

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to SkillScout to open your learning roadmaps and progress.',
};

export default function SignInPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return (
    <AuthShell title="Welcome" accent="back." footnote="Pick up exactly where you left off.">
      {searchParams.error && (
        <p role="alert" className="mb-5 rounded-xl bg-advanced/10 p-3 text-sm text-advanced">
          Sign-in didn’t complete: {searchParams.error}
        </p>
      )}
      <SignInForm next={searchParams.next} />
    </AuthShell>
  );
}
