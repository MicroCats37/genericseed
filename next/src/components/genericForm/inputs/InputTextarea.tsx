// genericForm/inputs/InputTextarea.tsx
"use client";

import { Textarea } from "@/components/ui/textarea";
import type { InputComponentProps } from "./types";

/**
 * Textarea multilínea.
 */
export const InputTextarea: React.FC<InputComponentProps> = ({
  field,
  register,
  error,
  id,
}) => {
  return (
    <Textarea
      id={id}
      rows={3}
      placeholder={field.placeholder}
      disabled={field.disabled}
      aria-invalid={!!error}
      className={field.className}
      {...register(field.name)}
    />
  );
};
