<script lang="ts">
  import type { CrewWithAgentsGetResponse } from '$lib/type';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';

  import CrewOverview from '$lib/components/app/crew/crew-overview.svelte';
  import DeleteCrew from '$lib/components/app/crew/delete-crew.svelte';
  import { Button } from '$lib/components/ui/button';
  import Card from '$lib/components/ui/card/card.svelte';
  import Skeleton from '$lib/components/ui/skeleton/skeleton.svelte';
  import * as Tabs from '$lib/components/ui/tabs/index.js';
  import Textarea from '$lib/components/ui/textarea/textarea.svelte';
  import { faker } from '@faker-js/faker';
  import { GamepadIcon, SquareChartGanttIcon, WorkflowIcon } from '@lucide/svelte';
  import { SvelteFlowProvider } from '@xyflow/svelte';
  import { fade } from 'svelte/transition';

  import type { UpsertAgentSchema } from './upsert-agent.schema';

  type Props = {
    crew: CrewWithAgentsGetResponse;
    superFormData: SuperValidated<Infer<UpsertAgentSchema>>;
  };

  let { crew, superFormData }: Props = $props();
</script>

<div transition:fade class="relative flex min-h-screen flex-col items-start">
  <div class="flex w-full items-center justify-between p-6">
    <div class="flex w-max flex-col items-start justify-start gap-2 text-left text-4xl font-bold">
      <div>{crew.name}</div>
      <div class="text-sm text-gray-500">{crew.description}</div>
    </div>
    <DeleteCrew crewId={crew.id} />
  </div>
  <div class="relative flex w-full">
    <div class="relative w-full flex-1 px-6">
      <div class="flex flex-col gap-8">
        <Skeleton class="h-40 w-full" />
        <Card class="w-[70%] self-end border-none p-4">
          {faker.lorem.paragraph(5)}
        </Card>
        <Skeleton class="h-40 w-full" />
        <Skeleton class="h-40 w-full" />
        <Skeleton class="h-40 w-full" />
      </div>
      <div
        class="from-background via-background sticky bottom-0 w-full bg-gradient-to-t via-90% to-transparent py-6 text-center"
      >
        <Textarea class="h-32 w-full " rows={5} placeholder="Message" />
      </div>
    </div>
    <div class="sticky top-6 right-0 h-[calc(100vh-150px)] flex-1 pr-6">
      <Tabs.Root value="overview" class="h-full w-full">
        <div class="flex items-center justify-between">
          <Tabs.List>
            <Tabs.Trigger value="overview">
              <SquareChartGanttIcon class="h-4 w-4" />
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger value="workflow">
              <WorkflowIcon class="h-4 w-4" />
              Workflow
            </Tabs.Trigger>
          </Tabs.List>
          <Button class="bg-violet-500">
            <GamepadIcon class="h-4 w-4" />
            Try it
          </Button>
        </div>
        <Tabs.Content value="overview">
          <div class="h-full w-full">
            {#key crew.id + 'crew-flow'}
              <SvelteFlowProvider>
                <CrewOverview {crew} {superFormData} />
              </SvelteFlowProvider>
            {/key}
          </div>
        </Tabs.Content>
        <Tabs.Content value="workflow">
          <div class="h-full w-full">
            <Skeleton class="h-full w-full" />
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  </div>
</div>
