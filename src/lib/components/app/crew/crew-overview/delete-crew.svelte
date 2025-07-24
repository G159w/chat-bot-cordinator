<script lang="ts">
  import { goto } from '$app/navigation';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { deleteCrew } from '$lib/remote/crew.remote';
  import { Trash2 } from '@lucide/svelte';

  import { Button } from '../../../ui/button';

  let open = $state(false);

  type Props = {
    crewId: string;
  };

  const { crewId }: Props = $props();

  const deleteCrewMutation = async () => {
    await deleteCrew({ id: crewId });
    open = false;
    goto('/dashboard');
  };
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Trigger>
    {#snippet child({ props })}
      <Button variant="ghost" {...props}>
        <Trash2 class="h-4 w-4" />
      </Button>
    {/snippet}
  </AlertDialog.Trigger>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
      <AlertDialog.Description>
        This action cannot be undone. This will permanently delete the crew and all its agents.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action onclick={deleteCrewMutation}>Continue</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
