<script lang="ts">
  import { goto } from '$app/navigation';
  import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
  import { deleteAgent } from '$lib/remote/agent.remote';

  type Props = {
    agentId: string;
    open: boolean;
  };

  let { agentId, open = $bindable(false) }: Props = $props();

  const deleteAgentMutation = async () => {
    await deleteAgent({ id: agentId });
    open = false;
    goto('/dashboard');
  };
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
      <AlertDialog.Description>
        This action cannot be undone. This will permanently delete the agent.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
      <AlertDialog.Action onclick={deleteAgentMutation}>Continue</AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
