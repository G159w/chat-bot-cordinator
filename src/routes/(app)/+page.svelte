<script lang="ts">
  import { apiClient } from '$lib';
  import { Button } from '$lib/components/ui/button';
  import { SignIn } from '@auth/sveltekit/components';
  import { createQuery } from '@tanstack/svelte-query';

  const query = createQuery({
    queryFn: () => apiClient.api.crews.get(),
    queryKey: ['api']
  });
</script>

<div class="mt-10 text-6xl font-bold">Agents Of Agents creator</div>
<div class="my-10 text-2xl">Créez vos équipes d'agents naturellement</div>

<Button href="/dashboard">Commencer</Button>

{#if $query.isLoading}
  <p>Loading...</p>
{:else if $query.isError}
  <p>Error: {$query.error.message}</p>
{:else if $query.data}
  <ul>
    {#each $query.data.data || [] as crew (crew.id)}
      <li>{crew.name} - {crew.description}</li>
    {/each}
  </ul>
{/if}

<SignIn provider="google" class="mt-10">
  <Button class="mt-10">Sign in</Button>
</SignIn>
