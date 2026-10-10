'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { OAuthButton } from './OAuthButton';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/browser';
import { useSkillStore } from '@/lib/store';
import { signUpSchema } from '@/lib/schemas';
import { track } from '@/lib/analytics';

type FormValues = z.infer<typeof signUpSchema>;

export function SignUpForm({ next }: { next?: string }) {
  const router = useRouter();
  const signInDemo = useSkillStore((s) => s.signInDemo);
  const updateProfile = useSkillStore((s) => s.updateProfile);
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(signUpSchema), defaultValues: { fullName: '', email: '', password: '' } });

  const onboardingPath = next && next.startsWith('/') ? next : '/onboarding';

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    if (!isSupabaseConfigured) {
      signInDemo({ fullName: values.fullName, email: values.email });
      updateProfile({ fullName: values.fullName, email: values.email });
      track('sign_up', { mode: 'demo' });
      router.push(onboardingPath);
      return;
    }
    const origin = window.location.origin;
    const { data, error } = await getSupabase().auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.fullName },
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(onboardingPath)}`,
      },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    track('sign_up', { mode: 'supabase' });
    // If email confirmation is on, there is no session yet.
    if (!data.session) {
      setConfirmSent(true);
      return;
    }
    router.push(onboardingPath);
    router.refresh();
  };

  if (confirmSent) {
    return (
      <div role="status" className="space-y-3 text-center">
        <p className="font-display text-2xl font-bold">Check your inbox</p>
        <p className="text-muted">We sent a confirmation link to your email. Open it on this device to finish setting up.</p>
        <Link href="/auth/signin" className="font-semibold text-accent hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {!isSupabaseConfigured && (
        <p className="rounded-xl bg-cyan/15 p-3 text-sm">
          <strong>Demo mode.</strong> Connect Supabase (see README) to store accounts on the server.
        </p>
      )}

      <div>
        <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium">
          Full name
        </label>
        <input
          id="fullName"
          autoComplete="name"
          className="input-base"
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? 'fullName-error' : undefined}
          {...register('fullName')}
        />
        {errors.fullName && (
          <p id="fullName-error" role="alert" className="mt-1.5 text-sm text-advanced">
            {errors.fullName.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="signup-email"
          type="email"
          autoComplete="email"
          className="input-base"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'signup-email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="signup-email-error" role="alert" className="mt-1.5 text-sm text-advanced">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <input
          id="signup-password"
          type="password"
          autoComplete="new-password"
          className="input-base"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'signup-password-hint signup-password-error' : 'signup-password-hint'}
          {...register('password')}
        />
        <p id="signup-password-hint" className="mt-1.5 text-xs text-muted">
          At least 8 characters.
        </p>
        {errors.password && (
          <p id="signup-password-error" role="alert" className="mt-1.5 text-sm text-advanced">
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="text-sm text-advanced">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3">
        {isSubmitting ? 'Creating account…' : 'Create free account'}
      </button>

      <div className="relative py-2 text-center text-xs uppercase tracking-wider text-muted">
        <span className="relative z-10 bg-surface px-3">or</span>
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-line" />
      </div>

      <OAuthButton next={onboardingPath} label="Sign up with Google" />

      <p className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/auth/signin" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
