import { type UseMutationOptions, useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import api from "@/lib/api";
import { handleApiError, notify } from "@/errors";

interface UseApiDeleteProps<TData> {
  baseUrl: string;
  showToast?: boolean;
  options?: Omit<
    UseMutationOptions<TData, AxiosError, number | string>,
    "mutationFn"
  >;
}

export function useApiDelete<TData = unknown>({
  baseUrl,
  showToast = true,
  options,
}: UseApiDeleteProps<TData>) {
  return useMutation<TData, AxiosError, number | string>({
    mutationFn: async (id) => {
      try {
        const { data } = await api.delete(`${baseUrl}/${id}/`);
        return data as TData;
      } catch (error) {
        const apiError = handleApiError(error);
        if (showToast) notify.error(apiError.message);
        throw error;
      }
    },
    ...options,
  });
}
