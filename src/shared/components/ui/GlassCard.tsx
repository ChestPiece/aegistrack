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
        "bg-card border-border shadow-md",
        "transition-all duration-300 hover:shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );
}
