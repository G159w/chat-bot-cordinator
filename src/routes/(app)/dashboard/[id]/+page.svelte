<script lang="ts">
  import CrewView from '$lib/components/app/crew/crew-view.svelte';

  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.crew.name} | Agent Coordinator</title>
  <meta name="description" content={data.crew.description} />
  <meta property="og_site_name" content="Agent Coordinator" />
  <meta property="og:url" content="https://agent-coordinator.com/dashboard/{data.crew.id}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={data.crew.name} />
  <meta property="og:description" content={data.crew.description} />
</svelte:head>

<CrewView crew={data.crew} superFormData={data.form} />
