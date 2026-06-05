# PaleoTime

PaleoTime is a serious scientific learning and visualization site for exploring
prehistoric life through deep time. The first major feature is an interactive
dinosaur evolutionary tree: a zoomable Stammbaum that combines phylogenetic
relationships, geological time, extinction events, and recent paleontology
research.

The goal is not to present dinosaur evolution as a fixed poster. Paleontology is
an active science, and relationships can change when new fossils, analyses, or
dating methods appear. PaleoTime should therefore make uncertainty visible,
separate curated interpretation from raw database data, and cite sources for
important claims.

## First milestone

Build an interactive Dinosauria timeline and lineage explorer:

* Zoom and pan through major dinosaur clades
* Move through Triassic, Jurassic, and Cretaceous time with a geological slider
* See when groups appear, diversify, and go extinct
* Click clades and species to inspect relationships, fossil age ranges, and notes
* Highlight uncertain or debated relationships instead of hiding them
* Link data points to scientific sources or trusted paleontology databases

## Technology direction

* Vite, React, and TypeScript for the web app
* D3 for custom tree, timeline, zoom, and scale interactions
* SVG for the first version of the tree, with Canvas/WebGL as an upgrade path if
  the dataset becomes too large
* Structured JSON data for the curated first dinosaur tree
* Paleobiology Database, Open Tree of Life, and TimeTree as enrichment sources
* Later: a backend or database for saved datasets, source management, and update
  workflows

## Data principles

PaleoTime should treat paleontology data carefully:

* Prefer primary literature or trusted databases for scientific claims
* Store citations next to clades, species, and events
* Show confidence levels for uncertain relationships
* Keep the curated tree versioned so changes are explainable
* Avoid implying exact certainty where fossil evidence is incomplete

## Development

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Suggested GitHub About

Interactive scientific paleontology site with a zoomable dinosaur evolutionary
tree, geological timeline, and recent research context.
