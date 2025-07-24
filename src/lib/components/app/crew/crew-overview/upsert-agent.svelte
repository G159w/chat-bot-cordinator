<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { InferOutput } from 'valibot';

  import * as Dialog from '$lib/components/ui/dialog/index.js';
  import * as Form from '$lib/components/ui/form/index.js';
  import * as Select from '$lib/components/ui/select/index.js';
  import { createAgent, updateAgent } from '$lib/remote/agent.remote';
  import { type Infer, superForm, type SuperValidated } from 'sveltekit-superforms';
  import { valibotClient } from 'sveltekit-superforms/adapters';

  import { Button } from '../../../ui/button';
  import { Input } from '../../../ui/input';
  import { Textarea } from '../../../ui/textarea';
  import { agentModels, upsertAgentSchema, type UpsertAgentSchema } from './upsert-agent.schema';

  export type Agent = {
    description?: string;
    id: string;
    instructions: string;
    isCoordinator: boolean;
    model: string;
    name: string;
    role: string;
    temperature: number;
  };

  type Props = {
    agent?: Agent | null;
    children?: Snippet<[{ props: Record<string, unknown> }]>;
    crewId: string;
    open?: boolean;
    superFormData: SuperValidated<Infer<UpsertAgentSchema>>;
  };

  let { agent, children, crewId, open = $bindable(false), superFormData }: Props = $props();

  const form = superForm(superFormData, {
    id: agent?.id ?? 'create-agent',
    onResult: async (event) => {
      if (event.result.type === 'success') {
        const data = event.result.data?.form.data as InferOutput<UpsertAgentSchema>;
        if (agent) {
          await updateAgent({
            id: agent.id,
            ...data
          });
        } else {
          await createAgent({
            ...data,
            crewId
          });
          reset();
        }
        closeDialog();
      }
    },
    validators: valibotClient(upsertAgentSchema)
  });

  const { enhance, form: formData, reset } = form;

  const isUpdate = !!agent;

  $effect(() => {
    if (open && agent) {
      $formData = {
        description: agent.description,
        instructions: agent.instructions,
        isCoordinator: agent.isCoordinator,
        model: agent.model as (typeof agentModels)[number],
        name: agent.name,
        role: agent.role,
        temperature: agent.temperature
      };
    }
  });

  const openDialog = () => {
    open = true;
  };

  const closeDialog = () => {
    open = false;
  };
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger onclick={openDialog}>
    {#snippet child({ props })}
      {@render children?.({ props })}
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>{isUpdate ? 'Edit Agent' : 'Add New Agent'}</Dialog.Title>
        <Dialog.Description>
          {isUpdate ? 'Update the agent configuration.' : 'Create a new agent for your crew.'}
        </Dialog.Description>
      </Dialog.Header>

      <form method="POST" use:enhance class="space-y-4" action="?/validateUpsertAgent">
        <Form.Field {form} name="name">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label class="text-sm font-medium">Name *</Form.Label>
              <Input bind:value={$formData.name} placeholder="Enter agent name" {...props} />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="description">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label class="text-sm font-medium">Description</Form.Label>
              <Input
                bind:value={$formData.description}
                placeholder="Optional description"
                {...props}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="role">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label class="text-sm font-medium">Role *</Form.Label>
              <Input
                bind:value={$formData.role}
                placeholder="e.g., Researcher, Analyst, Coordinator"
                {...props}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="model">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label class="text-sm font-medium">Model *</Form.Label>
              <Select.Root type="single" bind:value={$formData.model} name={props.name}>
                <Select.Trigger {...props} class="min-w-40">
                  {$formData.model ? $formData.model : 'Select a model'}
                </Select.Trigger>
                <Select.Content>
                  {#each agentModels as model (model)}
                    <Select.Item value={model}>{model}</Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="instructions">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label class="text-sm font-medium">Instructions *</Form.Label>
              <Textarea
                bind:value={$formData.instructions}
                placeholder="Describe what this agent should do..."
                rows={4}
                {...props}
              />
            {/snippet}
          </Form.Control>
          <Form.FieldErrors />
        </Form.Field>

        <Form.Field {form} name="temperature">
          <Form.Control>
            {#snippet children({ props })}
              <Form.Label class="text-sm font-medium">Temperature</Form.Label>
              <Input
                type="number"
                bind:value={$formData.temperature}
                min="0"
                max="100"
                placeholder="70"
                {...props}
              />
            {/snippet}
          </Form.Control>
          <Form.Description>
            Controls randomness (0 = deterministic, 100 = very random)
          </Form.Description>
          <Form.FieldErrors />
        </Form.Field>
        <Dialog.Footer>
          <Button type="button" variant="outline" onclick={closeDialog}>Cancel</Button>
          <Form.Button>
            {isUpdate ? 'Update Agent' : 'Create Agent'}
          </Form.Button>
        </Dialog.Footer>
      </form>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
