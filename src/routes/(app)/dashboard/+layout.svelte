<script lang="ts">
  import AppSidebar from '$lib/components/app/app-sidebar.svelte';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';

  let { children, data } = $props();
</script>

<Sidebar.Provider>
  <AppSidebar user={data.session?.user} />
  <main class="w-full">
    <Sidebar.Trigger class="md:hidden" />
    <div class="">
      {@render children?.()}
    </div>
  </main>
</Sidebar.Provider>
