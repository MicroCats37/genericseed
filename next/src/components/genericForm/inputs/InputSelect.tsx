// genericForm/inputs/InputSelect.tsx
"use client";

import type React from "react";
import { Controller } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InputComponentProps } from "./types";

/**
 * Select dropdown con opciones estáticas.
 * Soporta conversión de tipos (string/number/boolean) via valueType.
 */
export const InputSelect: React.FC<InputComponentProps> = ({
  field,
  control,
  error,
  id,
}) => {
  if (!field.options) {
    console.warn(`InputSelect: No options provided for field "${field.name}"`);
    return null;
  }

  // TypeScript narrowing: after guard, options is guaranteed to exist
  const options = field.options;

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => (
        <Select
          disabled={field.disabled || field.isLoading}
          value={controllerField.value?.toString() || ""}
          onValueChange={(value) => {
            let convertedValue: unknown = value;

            // Conversión de tipos
            if (field.valueType === "number") {
              convertedValue = Number(value);
            } else if (field.valueType === "boolean") {
              convertedValue = value === "true";
            } else if (!field.valueType && options.length > 0) {
              // Inferir tipo de la primera opción
              const firstVal = options[0].value;
              if (typeof firstVal === "number") {
                convertedValue = Number(value);
              }
            }

            controllerField.onChange(convertedValue);
          }}
        >
          <SelectTrigger
            id={id}
            aria-invalid={!!error}
            className={field.className}
          >
            <SelectValue placeholder={field.placeholder || "Seleccione..."} />
          </SelectTrigger>
          <SelectContent>
            {field.isLoading ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                Cargando...
              </div>
            ) : options.length === 0 ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No hay opciones
              </div>
            ) : (
              options.map((option) => (
                <SelectItem
                  key={option.value.toString()}
                  value={option.value.toString()}
                >
                  {option.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}
    />
  );
};
