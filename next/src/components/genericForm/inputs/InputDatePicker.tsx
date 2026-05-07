// genericForm/inputs/InputDatePicker.tsx
"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { InputComponentProps } from "./types";

/**
 * DatePicker usando shadcn Calendar.
 * Guarda la fecha como string ISO (YYYY-MM-DD).
 */
export const InputDatePicker: React.FC<InputComponentProps> = ({
  field,
  control,
  error,
  id,
}) => {
  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: controllerField }) => {
        // Convertir string a Date si existe
        const selectedDate = controllerField.value
          ? new Date(controllerField.value)
          : undefined;

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id={id}
                variant="outline"
                disabled={field.disabled}
                aria-invalid={!!error}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !controllerField.value && "text-muted-foreground",
                  field.className,
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {controllerField.value ? (
                  format(selectedDate!, "PPP", { locale: es })
                ) : (
                  <span>{field.placeholder || "Seleccionar fecha..."}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  // Guardar como string ISO (solo fecha, sin hora)
                  controllerField.onChange(
                    date ? format(date, "yyyy-MM-dd") : null,
                  );
                }}
                locale={es}
                initialFocus
                captionLayout="dropdown"
                startMonth={new Date(new Date().getFullYear() - 100, 0)}
                endMonth={new Date()}
              />
            </PopoverContent>
          </Popover>
        );
      }}
    />
  );
};
