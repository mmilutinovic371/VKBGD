import Image from "next/image";

export default function Grb({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/grb.png"
      width={size}
      height={size}
      alt="Grb kluba"
      className={`shrink-0 rounded-full ${className}`}
    />
  );
}
