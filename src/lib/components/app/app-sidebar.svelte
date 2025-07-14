<script lang="ts">
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import HouseIcon from '@lucide/svelte/icons/house';

  // List of AoA
  const items: {
    icon: typeof HouseIcon;
    title: string;
    url: string;
  }[] = [];
</script>

<Sidebar.Root>
  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel class="mb-4 flex justify-center">
        Agents Of Agents Creator
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          {#each items as item (item.title)}
            <Sidebar.MenuItem>
              <Sidebar.MenuButton>
                {#snippet child({ props })}
                  <a href={item.url} {...props}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                {/snippet}
              </Sidebar.MenuButton>
            </Sidebar.MenuItem>
          {/each}
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
</Sidebar.Root>
