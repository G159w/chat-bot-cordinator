<script lang="ts">
  import type { CrewWithAgentsGetResponse } from '$lib/type';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';

  import { Button } from '$lib/components/ui/button';
  import dagre from '@dagrejs/dagre';
  import '@xyflow/svelte/dist/style.css';
  import { PlusIcon } from '@lucide/svelte';
  import {
    Background,
    ConnectionLineType,
    Controls,
    type Edge,
    type Node,
    Panel,
    Position,
    SvelteFlow
  } from '@xyflow/svelte';

  import type { UpsertAgentSchema } from './upsert-agent.schema';

  import CustomNode from './agent-detail-node.svelte';
  import UpsertAgent from './upsert-agent.svelte';

  type Props = {
    crew: CrewWithAgentsGetResponse;
    superFormData: SuperValidated<Infer<UpsertAgentSchema>>;
  };
  const { crew, superFormData }: Props = $props();

  // Create reactive stores for nodes and edges
  let nodes: Node[] = $state([]);
  let edges: Edge[] = $state([]);

  // Dagre configuration
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 200;
  const nodeHeight = 110;

  function getLayoutedElements(nodes: Node[], edges: Edge[]) {
    dagreGraph.setGraph({
      marginx: 10,
      marginy: 10,
      nodesep: 5,
      rankdir: 'LR',
      ranksep: 5
    });

    // Clear the graph
    dagreGraph.nodes().forEach((node) => dagreGraph.removeNode(node));

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, {
        height: node.measured?.height ?? nodeHeight,
        width: node.measured?.width ?? nodeWidth
      });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      node.targetPosition = Position.Left;
      node.sourcePosition = Position.Right;

      // We are shifting the dagre node position (anchor=center center) to the top left
      // so it matches the SvelteFlow node anchor point (top left).
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2
        }
      };
    });

    return { edges, nodes: layoutedNodes };
  }

  // Update nodes and edges when crewWithAgents changes
  $effect(() => {
    const agentNodes = crew.agents.map((agent, index) => ({
      data: {
        agent,
        crewId: crew.id,
        label: agent.name,
        superFormData
      },
      id: agent.id,
      position: { x: 300 * index, y: 150 },
      type: 'agent'
    }));

    // Add crew node at the top
    // const crewNode: Node = {
    //   data: {
    //     ...crew,
    //     isCrew: true,
    //     label: crew.name
    //   },
    //   id: 'crew',
    //   position: { x: 300 * Math.floor(crew.agents.length / 2), y: -50 },
    //   type: 'crew'
    // };

    const allNodes = [...agentNodes];

    // Create edges
    const edgeList: Edge[] = [];

    // // Connect crew to all agents
    // crew.agents.forEach((agent) => {
    //   edgeList.push({
    //     animated: true,
    //     id: `crew-${agent.id}`,
    //     source: 'crew',
    //     target: agent.id,
    //     type: 'smoothstep'
    //   });
    // });

    // Apply layout
    const layoutedElements = getLayoutedElements(allNodes, edgeList);
    nodes = [...layoutedElements.nodes];
    edges = [...layoutedElements.edges];
  });

  const nodeTypes = {
    agent: CustomNode,
    crew: CustomNode
  };
</script>

<div class="h-full w-full">
  <SvelteFlow
    bind:nodes
    bind:edges
    fitView
    colorMode="dark"
    class="!bg-background h-full w-full rounded-lg border"
    {nodeTypes}
    connectionLineType={ConnectionLineType.SmoothStep}
    defaultEdgeOptions={{ animated: true, type: 'smoothstep' }}
  >
    <Panel position="top-right" class="flex gap-2">
      <UpsertAgent crewId={crew.id} {superFormData}>
        {#snippet children({ props })}
          <Button variant="secondary" {...props}>
            <PlusIcon class="h-4 w-4" />
            Add an agent
          </Button>
        {/snippet}
      </UpsertAgent>
    </Panel>
    <Background />
    <Controls />
  </SvelteFlow>
</div>
