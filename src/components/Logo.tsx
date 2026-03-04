import { appDefaults } from "~/config/cms";

interface LogoProps {
  width?: number;
  className?: string;
  variant?: "full" | "icon";
}

export default function Logo({ width = 200, className = "", variant = "full" }: LogoProps) {
  const src = variant === "icon" ? "/icon.svg" : "/logo.svg";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={appDefaults.name}
      width={width}
      className={className}
    />
  );
}
