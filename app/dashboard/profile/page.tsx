'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Pencil, Check, Clock, Map as MapIcon, Eye, Target, Camera, Trash2 } from 'lucide-react';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/browser';
import { blobToDataUrl, resizeAvatar } from '@/lib/avatar';
import { useAuthState } from '@/lib/auth-state';
import { useSkillStore } from '@/lib/store';
import { useHydrated } from '@/lib/use-hydrated';
import { CATEGORY_BY_ID } from '@/lib/categories';
import { DifficultyBadge } from '@/components/ui/Badge';
import { SignOutButton } from '@/components/auth/SignOutButton';

const schema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name.').max(80),
  bio: z.string().max(280, 'Keep it under 280 characters.'),
});
type Values = z.infer<typeof schema>;

export default function ProfilePage() {
  const hydrated = useHydrated();
  const auth = useAuthState();
  const profile = useSkillStore((s) => s.profile);
  const updateProfile = useSkillStore((s) => s.updateProfile);
  const roadmaps = useSkillStore((s) => s.roadmaps);
  const visits = useSkillStore((s) => s.visits);
  const interests = useSkillStore((s) => s.interests);
  const [editing, setEditing] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { fullName: '', bio: '' } });

  useEffect(() => {
    if (hydrated) reset({ fullName: profile.fullName || auth.user?.name || '', bio: profile.bio });
  }, [hydrated, profile.fullName, profile.bio, auth.user?.name, reset]);

  if (!hydrated) return null;

  const totalHours = roadmaps.reduce((s, r) => s + r.estimatedTotalHours, 0);
  const completedWeeks = roadmaps.reduce(
    (s, r) => s + r.roadmap.weeklyRoadmap.filter((w) => w.resources.length && w.resources.every((res) => r.completed[`${w.week}:${res.resourceId}`])).length,
    0,
  );
  const initials = (profile.fullName || auth.user?.name || 'SS')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Signed in with Supabase: the photo is stored by the server and its URL kept in account metadata.
  // Demo mode: the resized photo is kept in the browser store as a data URL.
  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPhotoError('');
    setPhotoBusy(true);
    try {
      const blob = await resizeAvatar(file);
      if (isSupabaseConfigured) {
        const form = new FormData();
        form.append('file', blob, 'avatar.jpg');
        const res = await fetch('/api/avatar', { method: 'POST', body: form });
        const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !body.url) throw new Error(body.error || 'Could not save the photo.');
        const { error } = await getSupabase().auth.updateUser({ data: { avatar_url: body.url } });
        if (error) throw new Error('The photo was saved, but your account could not be updated. Try again.');
      } else {
        updateProfile({ avatarUrl: await blobToDataUrl(blob) });
      }
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not save the photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoError('');
    setPhotoBusy(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await getSupabase().auth.updateUser({ data: { avatar_url: null } });
        if (error) throw new Error('Could not remove the photo. Try again.');
      } else {
        updateProfile({ avatarUrl: null });
      }
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Could not remove the photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const onSave = (v: Values) => {
    updateProfile({ fullName: v.fullName, bio: v.bio });
    setEditing(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8 pb-16 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section aria-labelledby="me-title" className="card-surface h-fit space-y-5 p-6">
        <div className="flex items-center gap-4">
          {auth.user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- user photo from Supabase Storage or a local data URL
            <img src={auth.user.avatarUrl} alt="Your profile photo" className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
          ) : (
            <div aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange via-yellow to-cyan font-display text-2xl font-bold text-black">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h1 id="me-title" className="truncate font-display text-3xl font-bold">{profile.fullName || auth.user?.name}</h1>
            <p className="truncate text-sm text-muted">{auth.user?.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="btn-ghost !py-1.5 cursor-pointer text-sm has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-orange">
            <Camera aria-hidden="true" className="h-3.5 w-3.5" />
            {photoBusy ? 'Saving photo…' : auth.user?.avatarUrl ? 'Change photo' : 'Add photo'}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={photoBusy}
              onChange={onPickPhoto}
              aria-label="Choose a profile photo"
            />
          </label>
          {auth.user?.avatarUrl && (
            <button type="button" className="btn-ghost !py-1.5 text-sm" disabled={photoBusy} onClick={removePhoto}>
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" /> Remove photo
            </button>
          )}
        </div>
        {photoError && <p role="alert" className="text-sm text-advanced">{photoError}</p>}

        {!editing ? (
          <>
            <p className="text-sm text-muted">{profile.bio || 'Add a short bio so people know what you’re working toward.'}</p>
            <button type="button" className="btn-ghost !py-1.5 text-sm" onClick={() => setEditing(true)}>
              <Pencil aria-hidden="true" className="h-3.5 w-3.5" /> Edit profile
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSave)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="pf-name" className="mb-1.5 block text-sm font-medium">Full name</label>
              <input id="pf-name" className="input-base" aria-invalid={!!errors.fullName} aria-describedby={errors.fullName ? 'pf-name-error' : undefined} {...register('fullName')} />
              {errors.fullName && <p id="pf-name-error" role="alert" className="mt-1 text-sm text-advanced">{errors.fullName.message}</p>}
            </div>
            <div>
              <label htmlFor="pf-bio" className="mb-1.5 block text-sm font-medium">Bio</label>
              <textarea id="pf-bio" rows={3} className="input-base" aria-invalid={!!errors.bio} aria-describedby={errors.bio ? 'pf-bio-error' : undefined} {...register('bio')} />
              {errors.bio && <p id="pf-bio-error" role="alert" className="mt-1 text-sm text-advanced">{errors.bio.message}</p>}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={isSubmitting} className="btn-primary !py-2 text-sm">Save</button>
              <button type="button" className="btn-ghost !py-2 text-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        )}
        <p role="status" className="text-sm text-beginner">{savedMsg && <span className="inline-flex items-center gap-1"><Check aria-hidden="true" className="h-4 w-4" /> Profile saved</span>}</p>

        {auth.status === 'authed' && (
          <div className="border-t border-line pt-5">
            <SignOutButton className="btn-ghost !py-2 text-sm" />
          </div>
        )}
      </section>

      <div className="min-w-0 space-y-8">
        <section aria-labelledby="stats-title">
          <h2 id="stats-title" className="mb-4 font-display text-3xl font-bold">Learning stats</h2>
          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: Clock, label: 'Planned hours', value: totalHours },
              { icon: Target, label: 'Weeks completed', value: completedWeeks },
              { icon: MapIcon, label: 'Roadmaps', value: roadmaps.length },
              { icon: Eye, label: 'Resources visited', value: visits.length },
            ].map((s) => (
              <div key={s.label} className="card-surface p-5">
                <s.icon aria-hidden="true" className="mb-3 h-5 w-5 text-accent" />
                <dt className="text-sm text-muted">{s.label}</dt>
                <dd className="font-display text-4xl font-bold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="skills-title">
          <h2 id="skills-title" className="mb-4 font-display text-3xl font-bold">Skills in progress</h2>
          {roadmaps.length === 0 ? (
            <p className="text-muted">No skills yet. Save a roadmap to see it here.</p>
          ) : (
            <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
              {roadmaps.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 p-4">
                  <span className="font-medium">{r.skillName}</span>
                  <DifficultyBadge level={r.difficulty} />
                </li>
              ))}
            </ul>
          )}
          {interests.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 font-mono text-xs uppercase tracking-wider text-muted">Interests</h3>
              <ul className="flex flex-wrap gap-2">
                {interests.map((i) => (
                  <li key={i} className="rounded-full border border-line px-3 py-1 text-sm">{CATEGORY_BY_ID[i]?.name}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
