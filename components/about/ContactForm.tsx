'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { contactSchema } from '@/lib/schemas';

type Values = z.infer<typeof contactSchema>;

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(contactSchema), defaultValues: { name: '', email: '', message: '' } });

  const onSubmit = async (values: Values) => {
    // No backend mailbox is wired in this build. Keep the message in the console for development.
    if (process.env.NODE_ENV !== 'production') console.info('[contact]', values);
    await new Promise((r) => setTimeout(r, 400));
    reset();
    setSent(true);
  };

  if (sent) {
    return (
      <p role="status" className="rounded-xl bg-beginner/15 p-4 font-medium">
        Thanks! We read every message. Expect a reply within a few days.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 md:grid-cols-2">
      <div>
        <label htmlFor="c-name" className="mb-1.5 block text-sm font-medium">Name</label>
        <input id="c-name" className="input-base" aria-invalid={!!errors.name} aria-describedby={errors.name ? 'c-name-error' : undefined} {...register('name')} />
        {errors.name && <p id="c-name-error" role="alert" className="mt-1 text-sm text-advanced">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="c-email" className="mb-1.5 block text-sm font-medium">Email</label>
        <input id="c-email" type="email" className="input-base" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'c-email-error' : undefined} {...register('email')} />
        {errors.email && <p id="c-email-error" role="alert" className="mt-1 text-sm text-advanced">{errors.email.message}</p>}
      </div>
      <div className="md:col-span-2">
        <label htmlFor="c-msg" className="mb-1.5 block text-sm font-medium">Feedback or a resource to add</label>
        <textarea id="c-msg" rows={4} className="input-base" aria-invalid={!!errors.message} aria-describedby={errors.message ? 'c-msg-error' : undefined} {...register('message')} />
        {errors.message && <p id="c-msg-error" role="alert" className="mt-1 text-sm text-advanced">{errors.message.message}</p>}
      </div>
      <div className="md:col-span-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? 'Sending…' : 'Send feedback'}
        </button>
      </div>
    </form>
  );
}
