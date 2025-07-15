<script lang="ts">
  import type { User } from '@auth/sveltekit';

  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import * as Avatar from '$lib/components/ui/avatar/index.js';
  import * as Sidebar from '$lib/components/ui/sidebar/index.js';
  import { createTeam, getCrews } from '$lib/remote/crew.remote';
  import { KeyIcon } from '@lucide/svelte';

  import { Button } from '../ui/button';
  import { Skeleton } from '../ui/skeleton';

  type Crew = Awaited<ReturnType<typeof getCrews>>[number];

  interface Props {
    user?: User;
  }

  let { user }: Props = $props();

  const crewsPromise = $derived.by(async () => {
    const crews = await getCrews();
    return crews;
  });

  const getActiveCrewId = (crews: Crew[]) => {
    const lastPart = page.url.pathname.split('/').pop();
    const activeCrew = crews?.find((crew) => crew.id === lastPart);
    return activeCrew?.id;
  };
</script>

<Sidebar.Root class="border-0">
  <Sidebar.Content class="">
    <Sidebar.Group class="flex h-full flex-col gap-2 p-0">
      <Sidebar.GroupLabel class="flex justify-center p-2 pt-8 pb-8 text-xl font-bold text-white">
        Agents Coordinator
      </Sidebar.GroupLabel>
      <Sidebar.GroupContent class="flex h-full flex-1 flex-col">
        <Sidebar.Menu class=" ">
          <svelte:boundary>
            {#await crewsPromise}
              <Sidebar.MenuItem>
                <Sidebar.MenuButton>
                  <Skeleton class="h-[20px] w-[100px] rounded-full" />
                </Sidebar.MenuButton>
              </Sidebar.MenuItem>
            {:then crews}
              <Sidebar.MenuItem class="px-4 pb-6">
                <Button
                  class="w-full rounded-sm py-4 text-center text-base"
                  variant="default"
                  onclick={async () => {
                    const crew = await createTeam();
                    goto(`/dashboard/${crew.id}`);
                  }}
                >
                  <span>Create a new crew</span>
                </Button>
              </Sidebar.MenuItem>
              <Sidebar.Separator class="my-2" />
              <Sidebar.GroupLabel class="flex justify-start py-6 pl-6 text-xs">
                My crews
              </Sidebar.GroupLabel>
              {#each crews as crew (crew.id)}
                <Sidebar.MenuItem class="px-4">
                  <Button
                    class={[
                      'flex w-full items-start justify-start rounded-sm p-2 text-left text-sm hover:text-violet-400',
                      crew.id === getActiveCrewId(crews) ? 'bg-accent text-violet-400 ' : ''
                    ]}
                    href={`/dashboard/${crew.id}`}
                    variant="ghost"
                  >
                    <div class="line-clamp-1">{crew.name}</div>
                  </Button>
                </Sidebar.MenuItem>
              {/each}
            {/await}
          </svelte:boundary>
        </Sidebar.Menu>
        <div class="mt-auto"></div>
        <Sidebar.Menu class="mb-2">
          <Sidebar.Separator class="my-2" />
          <Sidebar.GroupLabel class="flex justify-start py-6 pl-6 text-xs">
            My account
          </Sidebar.GroupLabel>
          <Sidebar.MenuItem class="px-4">
            <Button
              class={['flex w-full items-center justify-start rounded-sm p-2 text-left text-sm']}
              variant="ghost"
            >
              <KeyIcon class="h-4 w-4" />
              <span>API Keys</span>
            </Button>
          </Sidebar.MenuItem>
          <Sidebar.MenuItem class="bg-accent mx-4 mt-2 flex items-center gap-2 rounded-sm p-4">
            <Avatar.Root class="h-6 w-6">
              <Avatar.Image src={user?.image} alt={user?.name} />
              <Avatar.Fallback>{user?.name?.charAt(0)}</Avatar.Fallback>
            </Avatar.Root>
            <div class="line-clamp-1">{user?.name}</div>
          </Sidebar.MenuItem>
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  </Sidebar.Content>
</Sidebar.Root>
