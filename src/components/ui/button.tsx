import type { ButtonHTMLAttributes, FC, ReactNode } from "react";
import { cn } from "~/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "add";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    "h-[52px] rounded-full justify-center gap-2.5",
    "text-white font-semibold text-[17px] font-[Outfit]",
    "bg-gradient-to-b from-[#3D8A5A] to-[#4D9B6A]",
    "[box-shadow:0_4px_16px_#3D8A5A30]",
  ].join(" "),
  secondary: [
    "h-12 rounded-full justify-center gap-2.5",
    "text-[#3D8A5A] font-semibold text-[15px] font-[Outfit]",
    "bg-white [box-shadow:0_2px_12px_#1A191808]",
  ].join(" "),
  ghost: [
    "h-12 rounded-full justify-center gap-2",
    "text-[#6D6C6A] font-medium text-[14px] font-[Outfit]",
    "bg-transparent border border-[#D1D0CD]",
  ].join(" "),
  add: [
    "h-12 rounded-full justify-center gap-2",
    "text-[#6D6C6A] font-medium text-[14px] font-[Outfit]",
    "bg-white border-[1.5px] border-[#D1D0CD]",
  ].join(" "),
};

export const Button: FC<ButtonProps> = ({
  variant = "primary",
  icon,
  children,
  className,
  ...props
}) => {
  return (
    <button
      className={cn(
        "flex w-full items-center cursor-pointer transition-opacity active:opacity-80",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};

export type { ButtonVariant, ButtonProps };
