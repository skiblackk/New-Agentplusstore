# Glass Folder Cards integration in the official AgentPlus site

AgentPlus now integrates the MIT-licensed Glass Folder Cards component by Kedhareswer Naidu. The complete React source is stored at `client/src/components/GlassFolderCards.tsx`; it has no runtime dependency beyond React and generates its own artwork with a shared canvas queue.

The component is placed in the official homepage’s existing **Why AgentPlus** section as a layout-preserving showcase for Agents, Workflows, and Signals. It uses the component’s own interaction animations—hover tilt, folder assembly, keyboard opening, and file fanning—without replacing the official site’s existing copy, navigation, color palette, or card system.

The Liquid Sculpture animation is stored at `client/src/components/LiquidSculptureHero.tsx` and is mounted immediately below the existing hero section. The original background video remains in place at `client/public/agentplus-hero.mp4`; it was not removed or modified. The sculpture uses the official site’s dark background and orange accent values for the new band, while the existing hero/video design remains unchanged.

The project uses Vite + React + TypeScript with Tailwind available in the repository. The two components are self-contained and were copied into the existing `client/src/components` directory without adding dependencies. The original Glass Folder Cards source notes are preserved at `docs/GLASS-FOLDER-CARDS-SOURCE.md`.
