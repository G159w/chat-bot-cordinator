<script lang="ts">
  import OnMount from '$lib/components/app/on-mount.svelte';
  import { Button } from '$lib/components/ui/button';
  import { SignIn } from '@auth/sveltekit/components';
  import { fly } from 'svelte/transition';

  let { data } = $props();

  // const query = createQuery({
  //   queryFn: () => apiClient.api.crews.get(),
  //   queryKey: ['api']
  // });
</script>

<OnMount>
  <div class="text-center" out:fly={{ duration: 1000, y: 100 }}>
    <img src="/ac_icon.png" alt="Agents Coordinator" class="mx-auto h-56" />
    <div class="text-6xl font-bold">Agents Coordinator</div>
    <div class="my-5 text-xl">Créez vos équipes d'agents, naturellement</div>

    {#if !data.session}
      <SignIn provider="google" class="mt-10">
        <Button slot="submitButton">Se connecter</Button>
      </SignIn>
    {:else}
      <Button class="mt-5" href="/dashboard">Commencer</Button>
      <!-- <SignOut class="mt-10">
        <Button slot="submitButton">Sign out</Button>
      </SignOut> -->
    {/if}
  </div>
</OnMount>
<!-- {#if $query.isLoading}
  <p>Loading...</p>
{:else if $query.isError}
  <p>Error: {$query.error.message}</p>
{:else if $query.data}
  <ul class="mt-10">
    {#each $query.data.data || [] as crew (crew.id)}
      <li>{crew.name} - {crew.description}</li>
    {/each}
  </ul>
{/if} -->
