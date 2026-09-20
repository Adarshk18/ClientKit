import { initials } from "@/lib/sanitize";

export function LogoMark({
  name,
  src,
  size = "md",
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : size === "lg" ? "h-14 w-14 text-lg" : "h-10 w-10 text-sm";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className={`${dim} object-cover`} />
    );
  }
  return (
    <span
      className={`${dim} inline-flex items-center justify-center bg-stamp font-medium text-paper`}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
