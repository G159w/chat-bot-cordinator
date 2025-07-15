<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import '@xyflow/svelte/dist/style.css';

  import '../../app.css';

  let { children, data } = $props();
</script>

<svelte:head>
  <title>Agent Coordinator</title>
  <meta
    name="description"
    content="Agent Coordinator is a tool that helps you coordinate your agents."
  />
  <meta property="og_site_name" content="Agent Coordinator" />
  <meta property="og:url" content="https://agent-coordinator.com" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Agent Coordinator" />
  <meta
    property="og:description"
    content="Agent Coordinator is a tool that helps you coordinate your agents."
  />
  <meta property="og:image" content="https://agent-coordinator.com/logo.png" />
</svelte:head>

<QueryClientProvider client={data.queryClient}>
  <div class="flex h-screen flex-col items-center justify-center">
    {@render children()}
  </div>
</QueryClientProvider>
