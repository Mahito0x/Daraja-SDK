import { cn } from "@/lib/utils";
import Image from "next/image";

interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Size of the logomark icon in pixels */
  size?: number;
  /** Whether to show the "Lumière" text next to the logomark */
  showText?: boolean;
  className?: string;
}

export function Logo({
  size = 28,
  showText = true,
  className,
  ...props
}: LogoProps) {
  return (
    <div
      className={cn("flex items-center gap-2.5 select-none", className)}
      {...props}
    >
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{ height: size }}
      >
        <Image
          src="/logomark.svg"
          alt="Lumière Logomark"
          width={1828}
          height={860}
          priority
          className="h-full w-auto object-contain"
        />
      </div>
      {showText && (
        <span className="font-bold tracking-tight text-foreground text-sm sm:text-base">
          Daraja SDK
        </span>
      )}
    </div>
  );
}
