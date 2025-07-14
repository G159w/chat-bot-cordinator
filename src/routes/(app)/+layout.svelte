<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { SvelteQueryDevtools } from '@tanstack/svelte-query-devtools';

  import '../../app.css';

  let { children, data } = $props();
</script>

<QueryClientProvider client={data.queryClient}>
  <SvelteQueryDevtools />
  <div class="flex h-screen flex-col items-center justify-center">
    {@render children()}
  </div>
</QueryClientProvider>
