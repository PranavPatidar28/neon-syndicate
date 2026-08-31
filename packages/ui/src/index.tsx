import type { ButtonHTMLAttributes } from 'react';
export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="rounded border border-cyan-400/50 bg-cyan-400/10 px-4 py-2 font-mono text-sm text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
      {...props}
    />
  );
}
