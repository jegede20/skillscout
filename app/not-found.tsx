import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-[8rem] font-bold leading-none text-orange md:text-[12rem]">404</p>
      <h1 className="font-display text-4xl font-bold">This page went off-syllabus.</h1>
      <p className="mt-3 text-muted">Let’s get you back on track.</p>
      <Link href="/" className="btn-primary mt-8">Go home</Link>
    </main>
  );
}
