import Image from "next/image";

export type FlagCode =
  | "US"
  | "EU"
  | "GB"
  | "MX"
  | "BR"
  | "NG"
  | "IN"
  | "CN"
  | "AE"
  | "HK"
  | "SG"
  | "AU"
  | "JP"
  | "CO"
  | "CL"
  | "AR"
  | "BO"
  | "EC"
  | "VE"
  | "CA"
  | "CH"
  | "DE"
  | "ES"
  | "FR"
  | "PT"
  | "IT"
  | "KR"
  | "TR"
  | "RU";

interface CountryFlagProps {
  code: FlagCode;
  className?: string;
}

/**
 * Crisp 4:3 SVG country flag rendered via static /flags/<CODE>.svg assets
 * with Limited's subtle specular linear overlay so flags stay sharp on any backdrop.
 */
export function CountryFlag({ code, className = "h-[15px] w-5 rounded-[3px]" }: CountryFlagProps) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.18),inset_0_0_0_1px_rgba(255,255,255,0.14)] ${className}`}
    >
      <Image
        src={`/flags/${code}.svg`}
        alt=""
        width={20}
        height={15}
        unoptimized
        className="block size-full object-cover"
      />
      <span
        className="pointer-events-none absolute inset-0 mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0) 48%, rgba(0,0,0,0.18) 100%)",
        }}
      />
    </span>
  );
}
