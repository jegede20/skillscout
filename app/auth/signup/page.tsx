import type { Metadata } from 'next';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignUpForm } from '@/components/auth/SignUpForm';

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Create a free SkillScout account to save roadmaps and track your learning.',
};

export default function SignUpPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <AuthShell title="Start" accent="scouting." footnote="Free account. Takes 30 seconds. Your first roadmap is on us.">
      <SignUpForm next={searchParams.next} />
    </AuthShell>
  );
}
