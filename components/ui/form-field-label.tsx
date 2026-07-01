import * as React from "react";

import { FieldTooltip } from "@/components/ui/field-tooltip";
import { Label } from "@/components/ui/label";
import { premiumLabel } from "@/lib/ui/premium-styles";
import { cn } from "@/lib/utils";

type FormFieldLabelProps = {
  htmlFor?: string;
  required?: boolean;
  tooltip?: string;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
};

export function FormFieldLabel({
  htmlFor,
  required = false,
  tooltip,
  className,
  labelClassName,
  children,
}: FormFieldLabelProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Label className={cn(premiumLabel, labelClassName)} htmlFor={htmlFor}>
        {children}
        {required ? <span className="text-destructive"> *</span> : null}
      </Label>
      {tooltip ? <FieldTooltip content={tooltip} /> : null}
    </div>
  );
}
