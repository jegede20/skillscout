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
import { signInSchema } from '@/lib/schemas';

type FormValues = z.infer<typeof signInSchema>;

export function SignInForm({ next }: { next?: string }) {
  const router = useRouter();
  const signInDemo = useSkillStore((s) => s.signInDemo);
  const onboarded = useSkillStore((s) => s.onboarded);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(signInSchema), defaultValues: { email: '', password: '' } });

  const destination = next && next.startsWith('/') ? next : onboarded ? '/dashboard' : '/onboarding';

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    if (!isSupabaseConfigured) {
      // Demo mode: a local account in this browser.
      signInDemo({ fullName: values.email.split('@')[0].replace(/[._-]+/g, ' '), email: values.email });
      router.push(destination);
      return;
    }
    const { error } = await getSupabase().auth.signInWithPassword({ email: values.email, password: values.password });
    if (error) {
      setServerError(error.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : error.message);
      return;
    }
    router.push(destination);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5" aria-describedby={serverError ? 'signin-error' : undefined}>
      {!isSupabaseConfigured && (
        <p className="rounded-xl bg-cyan/15 p-3 text-sm">
          <strong>Demo mode.</strong> Supabase isn’t configured, so accounts live in this browser only.
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="input-base"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="mt-1.5 text-sm text-advanced">
            {errors.email.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="input-base"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" role="alert" className="mt-1.5 text-sm text-advanced">
            {errors.password.message}
          </p>
        )}
      </div>

      {serverError && (
        <p id="signin-error" role="alert" className="text-sm text-advanced">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3">
        {isSubmitting ? 'Signing in…' : 'Sign in'}
      </button>

      <div className="relative py-2 text-center text-xs uppercase tracking-wider text-muted">
        <span className="bg-surface px-3 relative z-10">or</span>
        <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-px bg-line" />
      </div>

      <OAuthButton next={destination} label="Sign in with Google" />

      <p className="text-center text-sm text-muted">
        Don’t have an account?{' '}
        <Link href={next ? `/auth/signup?next=${encodeURIComponent(next)}` : '/auth/signup'} className="font-semibold text-accent hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
