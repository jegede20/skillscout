'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { CATEGORIES } from '@/lib/categories';
import { track } from '@/lib/analytics';
import { persistRoadmap } from '@/lib/remote';
import { useAuthState } from '@/lib/auth-state';
import { useSkillStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';
import type { CategoryId, Roadmap } from '@/lib/types';

const GOAL_EXAMPLES = ['I want to get a job in tech', 'I want to learn guitar for fun', 'I want to make my own YouTube videos', 'I want to speak Spanish for travel'];

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const auth = useAuthState();
  const interests = useSkillStore((s) => s.interests);
  const setInterests = useSkillStore((s) => s.setInterests);
  const goalStored = useSkillStore((s) => s.goal);
  const setGoal = useSkillStore((s) => s.setGoal);
  const completeOnboarding = useSkillStore((s) => s.completeOnboarding);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goal, setLocalGoal] = useState(goalStored);
  const [goalError, setGoalError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Protect the page in demo mode (Supabase mode is handled by middleware).
  useEffect(() => {
    if (hydrated && auth.status === 'anon') router.replace('/auth/signin?next=/onboarding');
  }, [hydrated, auth.status, router]);

  const toggleInterest = (id: CategoryId) =>
    setInterests(interests.includes(id) ? interests.filter((i) => i !== id) : [...interests, id]);

  const goNext = () => {
    if (step === 1) {
      setStep(2);
      return;
    }
    if (step === 2) {
      if (goal.trim().length < 3) {
        setGoalError('Tell us a little about your goal (3+ characters).');
        return;
      }
      setGoal(goal.trim());
      setGoalError(null);
      setStep(3);
      generate(goal.trim());
    }
  };

  const generate = async (query: string) => {
    setLoading(true);
    setErr(null);
    setRoadmap(null);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query || CATEGORIES.find((c) => c.id === interests[0])?.name || 'programming', level: 'beginner' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not build your starter roadmap.');
      setRoadmap(json.roadmap as Roadmap);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    if (roadmap) await persistRoadmap({ query: goal, roadmap, remote: auth.mode === 'supabase' && auth.status === 'authed' });
    completeOnboarding();
    track('onboarding_completed', { interests: interests.length });
    router.push('/dashboard');
  };

  if (!hydrated || auth.status !== 'authed') {
    return (
      <main className="mx-auto max-w-content px-4 py-20 text-center text-muted" role="status">
        Loading your onboarding…
      </main>
    );
  }

  const firstName = auth.user?.name.split(' ')[0] ?? 'there';

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <ol className="mb-10 flex items-center gap-3" aria-label="Onboarding progress">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex flex-1 items-center gap-3">
            <span
              aria-current={step === n ? 'step' : undefined}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                step >= n ? 'bg-orange text-black' : 'bg-fill text-muted'
              }`}
            >
              {step > n ? <Check aria-hidden="true" className="h-4 w-4" /> : n}
              <span className="sr-only">{step > n ? 'completed' : step === n ? 'current step' : 'upcoming'}</span>
            </span>
            {n < 3 && <span aria-hidden="true" className={`h-1 flex-1 rounded-full ${step > n ? 'bg-orange' : 'bg-line'}`} />}
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.section key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} aria-labelledby="s1-title">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">Step 1 of 3</p>
            <h1 id="s1-title" className="mt-2 font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
              Hi {firstName}. What are you <span className="text-accent">into?</span>
            </h1>
            <p className="mt-4 text-muted">Pick any that catch your eye. You can change these later.</p>
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
              {CATEGORIES.map((c) => {
                const on = interests.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleInterest(c.id)}
                    className={`card-surface flex items-center gap-3 p-4 text-left transition ${on ? '!border-orange bg-orange/10' : ''}`}
                  >
                    <CategoryIcon name={c.icon} className={`h-5 w-5 ${on ? 'text-accent' : 'text-muted'}`} />
                    <span className="font-medium leading-tight">{c.name}</span>
                    {on && <Check aria-hidden="true" className="ml-auto h-4 w-4 text-accent" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-10 flex items-center justify-between">
              <span className="text-sm text-muted">{interests.length} selected</span>
              <button type="button" className="btn-primary" disabled={interests.length === 0} onClick={goNext}>
                Continue <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </motion.section>
        )}

        {step === 2 && (
          <motion.section key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} aria-labelledby="s2-title">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">Step 2 of 3</p>
            <h1 id="s2-title" className="mt-2 font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
              What’s your <span className="italic text-accent">goal?</span>
            </h1>
            <div className="mt-8">
              <label htmlFor="goal" className="mb-2 block text-sm font-medium">
                In your own words
              </label>
              <input
                id="goal"
                value={goal}
                onChange={(e) => setLocalGoal(e.target.value)}
                placeholder="I want to get a job in tech"
                className="input-base text-lg"
                aria-invalid={!!goalError}
                aria-describedby={goalError ? 'goal-error' : 'goal-hint'}
              />
              <p id="goal-hint" className="mt-2 text-xs text-muted">
                Examples are below. Or type anything.
              </p>
              {goalError && (
                <p id="goal-error" role="alert" className="mt-2 text-sm text-advanced">
                  {goalError}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {GOAL_EXAMPLES.map((g) => (
                  <button key={g} type="button" onClick={() => setLocalGoal(g)} className="rounded-full border border-line px-3 py-1.5 text-sm text-muted hover:border-cyan hover:text-fg">
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-10 flex items-center justify-between">
              <button type="button" className="btn-ghost" onClick={() => setStep(1)}>
                <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back
              </button>
              <button type="button" className="btn-primary" onClick={goNext}>
                Build my starter path <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </motion.section>
        )}

        {step === 3 && (
          <motion.section key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} aria-labelledby="s3-title">
            <p className="font-mono text-xs uppercase tracking-wider text-muted">Step 3 of 3</p>
            <h1 id="s3-title" className="mt-2 font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">
              Let’s <span className="text-accent">go!</span>
            </h1>
            <p className="mt-4 text-muted">Here’s a starter path for “{goal}”.</p>

            <div className="mt-8" aria-live="polite">
              {loading && (
                <div className="card-surface flex items-center gap-3 p-6 text-muted" role="status">
                  <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> Drafting your first three weeks…
                </div>
              )}
              {err && (
                <div role="alert" className="card-surface p-6">
                  <p className="text-advanced">{err}</p>
                  <button type="button" className="btn-ghost mt-4 !py-2 text-sm" onClick={() => generate(goal)}>
                    Try again
                  </button>
                </div>
              )}
              {roadmap && !loading && (
                <ol className="space-y-3">
                  {roadmap.weeklyRoadmap.slice(0, 3).map((w) => (
                    <li key={w.week} className="card-surface p-5">
                      <p className="font-mono text-xs text-muted">Week {w.week}</p>
                      <p className="font-display text-xl font-bold">{w.title}</p>
                      <p className="mt-1 text-sm text-muted">{w.milestone}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
              <button type="button" className="btn-ghost" onClick={() => setStep(2)}>
                <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Change goal
              </button>
              <button type="button" className="btn-primary" disabled={loading} onClick={finish}>
                Open my dashboard <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
