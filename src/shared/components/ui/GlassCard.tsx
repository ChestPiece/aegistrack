import { cn } from "@/shared/utils/utils";
import { Card } from "@/shared/components/ui/card";
import React from "react";

interface GlassCardProps extends React.ComponentProps<typeof Card> {
  gradient?: boolean;
}

export function GlassCard({
  className,
  gradient,
  children,
  ...props
}: GlassCardProps) {
  return (
    <Card
      className={cn(
        "bg-white/10 dark:bg-black/20 backdrop-blur-md border-white/20 dark:border-white/10 shadow-xl",
        gradient &&
          "bg-gradient-to-br from-white/10 to-white/5 dark:from-white/10 dark:to-transparent",
        "transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}
