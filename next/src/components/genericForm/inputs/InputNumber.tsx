// genericForm/inputs/InputNumber.tsx
"use client";

import { Input } from "@/components/ui/input";
import type { InputComponentProps } from "./types";

/**
 * Input numérico.
 * Usa valueAsNumber de react-hook-form para conversión automática.
 */
export const InputNumber: React.FC<InputComponentProps> = ({
  field,
  register,
  error,
  id,
}) => {
  const hasIcon = !!field.icon;
  const Icon = field.icon;

  const inputElement = (
    <Input
      id={id}
      type="number"
      placeholder={field.placeholder}
      disabled={field.disabled}
      aria-invalid={!!error}
      className={`${hasIcon ? "pl-10" : ""} ${field.className || ""}`}
      {...register(field.name, { valueAsNumber: true })}
    />
  );

  if (!hasIcon) return inputElement;

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
      </div>
      {inputElement}
    </div>
  );
};
