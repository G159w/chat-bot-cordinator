<script lang="ts">
	import { apiClient } from '$lib';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Plus, Trash2 } from '@lucide/svelte';
	import { onMount } from 'svelte';

	let crews: Array<{
		createdAt?: Date;
		description?: string;
		id: string;
		isActive?: boolean;
		name: string;
		updatedAt?: Date;
		userId: string;
	}> = [];
	let showCreateForm = false;

	let newCrew = {
		agents: [] as Array<{
			description: string;
			instructions: string;
			isCoordinator: boolean;
			model: string;
			name: string;
			role: string;
			temperature: number;
		}>,
		description: '',
		name: ''
	};

	let newAgent = {
		description: '',
		instructions: '',
		isCoordinator: false,
		model: 'gpt-4',
		name: '',
		role: '',
		temperature: 0.7
	};

	async function loadCrews() {
		try {
			const response = await apiClient.api.crews.get();
			crews = response.data || [];
		} catch (error) {
			console.error('Failed to load crews:', error);
		}
	}

	async function createCrew() {
		try {
			await apiClient.api.crews.post(newCrew);
			showCreateForm = false;
			newCrew = { agents: [], description: '', name: '' };
			await loadCrews();
		} catch (error) {
			console.error('Failed to create crew:', error);
		}
	}

	function addAgent() {
		newCrew.agents = [...newCrew.agents, { ...newAgent }];
		newAgent = {
			description: '',
			instructions: '',
			isCoordinator: false,
			model: 'gpt-4',
			name: '',
			role: '',
			temperature: 0.7
		};
	}

	function removeAgent(index: number) {
		newCrew.agents = newCrew.agents.filter((_, i) => i !== index);
	}

	onMount(() => {
		loadCrews();
	});
</script>

<div class="container mx-auto p-6">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold">My Crews</h1>
		<Button on:click={() => (showCreateForm = true)}>
			<Plus class="mr-2 h-4 w-4" />
			Create Crew
		</Button>
	</div>

	{#if showCreateForm}
		<Card class="mb-6">
			<CardHeader>
				<CardTitle>Create New Crew</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div>
						<label class="mb-2 block text-sm font-medium">Crew Name</label>
						<Input bind:value={newCrew.name} placeholder="Enter crew name" />
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium">Description</label>
						<Textarea bind:value={newCrew.description} placeholder="Describe your crew's purpose" />
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium">Agents</label>
						{#each newCrew.agents as agent, index (agent.id)}
							<div class="mb-2 rounded-lg border p-4">
								<div class="mb-2 flex items-start justify-between">
									<h4 class="font-medium">Agent {index + 1}</h4>
									<Button variant="ghost" size="sm" on:click={() => removeAgent(index)}>
										<Trash2 class="h-4 w-4" />
									</Button>
								</div>

								<div class="grid grid-cols-2 gap-4">
									<div>
										<label class="mb-1 block text-sm">Name</label>
										<Input bind:value={agent.name} placeholder="Agent name" />
									</div>
									<div>
										<label class="mb-1 block text-sm">Role</label>
										<Input bind:value={agent.role} placeholder="e.g., Researcher, Writer" />
									</div>
									<div class="col-span-2">
										<label class="mb-1 block text-sm">Instructions</label>
										<Textarea
											bind:value={agent.instructions}
											placeholder="What should this agent do?"
										/>
									</div>
									<div>
										<label class="mb-1 block text-sm">Model</label>
										<select bind:value={agent.model} class="w-full rounded border px-3 py-2">
											<option value="gpt-4">GPT-4</option>
											<option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
										</select>
									</div>
									<div>
										<label class="mb-1 block text-sm">Temperature</label>
										<Input
											type="number"
											bind:value={agent.temperature}
											min="0"
											max="2"
											step="0.1"
										/>
									</div>
									<div class="col-span-2">
										<label class="flex items-center">
											<input type="checkbox" bind:checked={agent.isCoordinator} class="mr-2" />
											<span class="text-sm">Is Coordinator</span>
										</label>
									</div>
								</div>
							</div>
						{/each}

						<Button variant="outline" on:click={addAgent}>
							<Plus class="mr-2 h-4 w-4" />
							Add Agent
						</Button>
					</div>

					<div class="flex gap-2">
						<Button on:click={createCrew}>Create Crew</Button>
						<Button variant="outline" on:click={() => (showCreateForm = false)}>Cancel</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	{/if}

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each crews as crew (crew.id)}
			<Card>
				<CardHeader>
					<CardTitle>{crew.name}</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="mb-4 text-gray-600">{crew.description}</p>
					<Button href="/dashboard/crews/{crew.id}">View Details</Button>
				</CardContent>
			</Card>
		{/each}
	</div>
</div>
