import type { apiClient } from '.';

type ApiClientType = ReturnType<typeof apiClient>;

type CrewsGetResponse = NonNullable<
  Awaited<ReturnType<ApiClientType['api']['crews']['get']>>['data']
>;

type CrewWithAgentsGetResponse = NonNullable<
  Awaited<ReturnType<ReturnType<ApiClientType['api']['crews']>['with-agents']['get']>>['data']
>;
