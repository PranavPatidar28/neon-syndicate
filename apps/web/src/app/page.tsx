import { Button } from '@neon/ui';
export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-20">
      <p className="mb-3 font-mono text-sm tracking-[0.3em] text-cyan-300">
        SYSTEM // FOUNDATION ONLINE
      </p>
      <h1 className="text-5xl font-black tracking-tight md:text-7xl">
        Neon Syndicate
      </h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-300">
        The city is waiting. Product features are intentionally locked: begin
        with Boot Sequence in the curriculum.
      </p>
      <div className="mt-8">
        <Button disabled>Identity protocol locked</Button>
      </div>
    </main>
  );
}
