<script lang="ts">
  import type { Infer, SuperValidated } from 'sveltekit-superforms';

  import * as ContextMenu from '$lib/components/ui/context-menu/index.js';
  import { PencilIcon, SearchIcon, Trash2Icon, UploadIcon } from '@lucide/svelte';
  import { type NodeProps } from '@xyflow/svelte';

  import type { UpsertAgentSchema } from './upsert-agent.schema';

  import DeleteAgent from './delete-agent.svelte';
  import UpsertAgent, { type Agent } from './upsert-agent.svelte';

  let { data }: NodeProps = $props();

  let openEditAgent = $state(false);
  let openDeleteAgent = $state(false);

  let agent = $derived(data.agent as Agent);
  let agentKey = $derived.by(() => {
    return JSON.stringify(agent);
  });
  let crewId = $derived(data.crewId as string);
  let superFormData = $derived(data.superFormData as SuperValidated<Infer<UpsertAgentSchema>>);
</script>

<ContextMenu.Root>
  <ContextMenu.Trigger>
    {#snippet child({ props })}
      <div
        class=" bg-accent rounded-md border border-violet-400 px-4 py-2 shadow-md hover:border-violet-400/50"
        {...props}
      >
        <div class="flex flex-col">
          <div>{data.label}</div>
          <div class="text-muted-foreground text-xs">{agent.role}</div>
          <div class="mt-2 flex gap-2">
            <SearchIcon class="h-4 w-4 text-violet-400" />
            <UploadIcon class="h-4 w-4 text-violet-400" />
          </div>
        </div>
      </div>
    {/snippet}
  </ContextMenu.Trigger>
  <ContextMenu.Content>
    <ContextMenu.Item class="flex items-center gap-2" onclick={() => (openEditAgent = true)}>
      <PencilIcon class="h-4 w-4" />
      Edit
    </ContextMenu.Item>

    <ContextMenu.Item
      class="text-destructive flex items-center gap-2"
      onclick={() => (openDeleteAgent = true)}
    >
      <Trash2Icon class="text-destructive h-4 w-4" />
      Delete
    </ContextMenu.Item>
  </ContextMenu.Content>
  {#key agentKey}
    <UpsertAgent {crewId} {superFormData} {agent} bind:open={openEditAgent} />
  {/key}
  <DeleteAgent agentId={agent.id} bind:open={openDeleteAgent} />
</ContextMenu.Root>
