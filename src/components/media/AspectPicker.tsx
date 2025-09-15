import { useMemo } from 'react';

export type Aspect = '1:1' | '4:5' | '3:2' | '16:9' | 'original' | { w: number; h: number };

export function aspectToNumber(a: Aspect, original: { w: number; h: number }): number {
  if (a === 'original') return original.w / original.h;
  if (typeof a === 'object') return a.w / a.h;
  const [w, h] = a.split(':').map(Number);
  return w / h;
}

type Props = {
  value: Aspect;
  onChange: (a: Aspect) => void;
  original: { w: number; h: number };
};

export default function AspectPicker({ value, onChange, original }: Props) {
  const options = useMemo(() => (['1:1', '4:5', '3:2', '16:9', 'original'] as Aspect[]), []);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={typeof opt === 'string' ? opt : `${opt.w}:${opt.h}`}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-2 py-1 rounded border ${value === opt ? 'bg-neutral-900 text-white' : 'bg-white'}`}
          aria-pressed={value === opt}
        >
          {typeof opt === 'string' ? opt : `${opt.w}:${opt.h}`}
        </button>
      ))}
    </div>
  );
}


