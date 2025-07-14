<script lang="ts">
	import AppSidebar from '$lib/components/app/app-sidebar.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';

	let { children } = $props();
</script>

<Sidebar.Provider>
	<AppSidebar />
	<main class="w-full">
		<Sidebar.Trigger class="md:hidden" />
		{@render children?.()}
	</main>
</Sidebar.Provider>
