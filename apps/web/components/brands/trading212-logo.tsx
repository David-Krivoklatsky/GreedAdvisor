import Image from 'next/image';
import { cn } from '@greed-advisor/utils';

interface Trading212LogoProps {
  size?: number;
  className?: string;
}

/**
 * Trading212 brand logo. Renders the real logo from /public/trading212.svg
 * when available, otherwise falls back to a text placeholder so the UI
 * never shows a broken image.
 */
export function Trading212Logo({ size = 18, className }: Trading212LogoProps) {
  return (
    <span
      className={cn('inline-flex items-center justify-center overflow-hidden', className)}
      style={{ width: size, height: size }}
    >
      <Image
        src="/trading212.svg"
        alt="Trading212"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        onError={e => {
          const el = e.currentTarget;
          el.style.display = 'none';
          el.nextElementSibling?.classList.remove('hidden');
        }}
        unoptimized
      />
      <span className="hidden rounded-sm bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
        T212
      </span>
    </span>
  );
}
