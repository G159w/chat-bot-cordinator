# Self Chat Bot

A crew-based AI agent system built with SvelteKit and Svelte Flow.

## Features

- **Crew Management**: Create and manage AI agent crews
- **Agent Workflows**: Visualize crew and agent relationships using Svelte Flow
- **Real-time Execution**: Monitor agent execution status
- **Modern UI**: Built with Tailwind CSS and modern design patterns

## Crew Flow Visualization

The application uses [Svelte Flow](https://svelteflow.dev/) to create interactive workflow diagrams that visualize:

- **Crew Node**: The main crew entity at the top of the diagram
- **Agent Nodes**: Individual AI agents with their roles, models, and tools
- **Execution Flow**: Animated connections showing the sequence of agent execution
- **Management Relationships**: Connections showing how the crew manages its agents

### Features of the Crew Flow

1. **Interactive Nodes**: Click and drag nodes to rearrange the workflow
2. **Animated Edges**: Visual flow indicators with animated connections
3. **Coordinator Highlighting**: Special styling for coordinator agents
4. **Tool Information**: Display of agent tools and capabilities
5. **Zoom and Pan**: Full navigation controls for large workflows
6. **Mini Map**: Overview of the entire workflow
7. **Responsive Design**: Adapts to different screen sizes

### Node Types

- **Crew Node**: Blue gradient background, represents the crew entity
- **Agent Nodes**: White background with role and model information
- **Coordinator Agents**: Purple border and background highlighting

### Edge Types

- **Management Edges**: Blue connections from crew to agents
- **Execution Edges**: Green connections showing agent execution order

## Getting Started

1. Install dependencies:

   ```bash
   bun install
   ```

2. Start the development server:

   ```bash
   bun run dev
   ```

3. Open your browser and navigate to the dashboard to see crew workflows.

## Technology Stack

- **Frontend**: SvelteKit 5, Svelte Flow, Tailwind CSS
- **Backend**: Elysia.js, Drizzle ORM
- **Database**: PostgreSQL
- **Authentication**: Auth.js
- **Package Manager**: Bun

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   └── CrewFlow.svelte    # Svelte Flow crew visualization
│   ├── server/
│   │   ├── api/
│   │   │   ├── crew/          # Crew API endpoints
│   │   │   └── agent/         # Agent API endpoints
│   │   └── db/                # Database schema and migrations
│   └── crew.remote.ts         # Client-side crew data fetching
└── routes/
    └── (app)/
        └── dashboard/
            └── [id]/
                └── +page.svelte  # Crew dashboard with flow visualization
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
