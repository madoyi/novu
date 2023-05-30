import type { IMessage, IPaginatedResponse } from '@novu/shared';
import { InfiniteData, useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query';
import { IStoreQuery } from '@novu/client';

import { INFINITE_NOTIFICATIONS_QUERY_KEY } from './queryKeys';
import { useNovuContext } from './useNovuContext';
import { useSetQueryKey } from './useSetQueryKey';

interface IMarkNotificationsAsReadVariables {
  feedId?: string | string[];
}

export const useMarkNotificationsAsRead = ({
  onSuccess,
  query,
  ...options
}: {
  onSuccess?: () => void;
  query?: IStoreQuery;
} & UseMutationOptions<IMessage[], Error, IMarkNotificationsAsReadVariables> = {}) => {
  const queryClient = useQueryClient();
  const { apiService } = useNovuContext();
  const setQueryKey = useSetQueryKey();

  const { mutate, ...result } = useMutation<IMessage[], Error, IMarkNotificationsAsReadVariables>(
    ({ feedId }) => apiService.markAllMessagesAsRead(feedId),
    {
      ...options,
      onSuccess: (responseData, variables, context) => {
        queryClient.setQueriesData<InfiniteData<IPaginatedResponse<IMessage>>>(
          { queryKey: setQueryKey([...INFINITE_NOTIFICATIONS_QUERY_KEY, query]), exact: false },
          (infiniteData) => {
            const pages = infiniteData.pages.map((page) => {
              const data = page.data.map((message) => {
                return { ...message, read: true, seen: true };
              });

              return {
                ...page,
                data,
              };
            });

            return {
              pageParams: infiniteData.pageParams,
              pages,
            };
          }
        );
        onSuccess?.(responseData, variables, context);
      },
    }
  );

  return { ...result, markNotificationsAsRead: mutate };
};
