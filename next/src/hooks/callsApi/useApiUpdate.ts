import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { ZodType } from "zod";

import api from "@/lib/api";
import { handleApiError, notify } from "@/errors";
import { buildApiPayload } from "@/utils";

type UpdateVariables<TPayload> = { id: number | string; data: TPayload };

interface UseApiUpdateProps<TData, TPayload> {
  baseUrl: string;
  schema?: ZodType<TData>;
  method?: "PUT" | "PATCH";
  showToast?: boolean;
  options?: Omit<
    UseMutationOptions<TData, AxiosError, UpdateVariables<TPayload>>,
    "mutationFn"
  >;
}

export function useApiUpdate<TData = unknown, TPayload = unknown>({
  baseUrl,
  schema,
  method = "PUT",
  showToast = true,
  options,
}: UseApiUpdateProps<TData, TPayload>) {
  return useMutation<TData, AxiosError, UpdateVariables<TPayload>>({
    mutationFn: async ({ id, data }) => {
      try {
        const payload = buildApiPayload(data);
        const { data: responseData } = await api.request({
          url: `${baseUrl}/${id}/`,
          method,
          data: payload,
        });
        return schema ? schema.parse(responseData) : (responseData as TData);
      } catch (error) {
        const apiError = handleApiError(error);
        if (showToast) notify.error(apiError.message);
        throw error;
      }
    },
    ...options,
  });
}
