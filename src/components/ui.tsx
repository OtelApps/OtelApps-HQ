import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost';
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const base = variant === 'ghost' ? 'hq-btn-ghost' : 'hq-btn';
  return <button className={`${base} ${className}`.trim()} {...props} />;
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({ label, className = '', ...props }: TextFieldProps) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <input className={`hq-input ${className}`.trim()} {...props} />
    </label>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: ReactNode;
};

export function SelectField({ label, children, ...props }: SelectFieldProps) {
  return (
    <label className="block text-sm font-medium text-ink">
      {label}
      <select className="hq-input" {...props}>
        {children}
      </select>
    </label>
  );
}

export function Card({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <div className={`hq-card ${className}`.trim()}>{children}</div>;
}

export function Banner({ tone, children }: { tone: 'ok' | 'error'; children: ReactNode }) {
  const cls =
    tone === 'ok'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
      : 'border-red-200 bg-red-50 text-red-700';
  return <p className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>{children}</p>;
}

export function CopyBlock({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">{title}</p>
        <button
          type="button"
          className="text-xs font-medium text-muted hover:text-ink"
          onClick={() => {
            void navigator.clipboard.writeText(value);
          }}
        >
          Kopírovat
        </button>
      </div>
      <pre className="max-h-64 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-100 whitespace-pre-wrap">
        {value}
      </pre>
    </div>
  );
}
