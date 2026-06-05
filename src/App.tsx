import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import paleoTree from "../amniote_dinosaur_context_tree_museum_v0_3.json";

type JsonNode = {
  id: string;
  label: string;
  parent: string | null;
  confidence?: string;
  status_note?: string;
  rank_or_level?: string;
  example_taxa?: string[];
  museum_display_group?: string;
  source_ids?: string[];
};

type SpeciesEntry = {
  id: string;
  label: string;
  rank?: string;
  parent_clade_hint?: string;
  catalog_group?: string;
  verification_status?: string;
  taxonomic_caution?: string;
  pbdb_lookup?: {
    match_status?: string;
    matched_name?: string | null;
    pbdb_taxon_no?: string | null;
    pbdb_web_url?: string | null;
    pbdb_api_url?: string | null;
    pbdb_authority?: string | null;
    reconciliation_note?: string;
  };
};

type AlternativeTopology = {
  id: string;
  label: string;
  status: string;
  summary: string;
  tree_edges?: [string, string][];
};

type TreeData = {
  title: string;
  scope_note: string;
  nodes: JsonNode[];
  species_catalog: SpeciesEntry[];
  alternative_topologies: AlternativeTopology[];
  species_catalog_summary: {
    entry_count: number;
    pbdb_reconciliation_status: string;
  };
};

type DisplayNode = JsonNode & {
  virtual?: boolean;
};

type SearchResult =
  | { kind: "clade"; id: string; label: string; detail: string }
  | { kind: "species"; id: string; label: string; detail: string };

const data = paleoTree as unknown as TreeData;

const periodBands = [
  { label: "Permian", start: 299, end: 252, color: "#d2d0bb" },
  { label: "Triassic", start: 252, end: 201, color: "#c7d7be" },
  { label: "Jurassic", start: 201, end: 145, color: "#b9d3d7" },
  { label: "Cretaceous", start: 145, end: 66, color: "#d7c8a8" },
  { label: "Cenozoic", start: 66, end: 0, color: "#ccd7e0" },
];

const groupLabels: Record<string, string> = {
  amniote_context: "Amniote context",
  mammal_line: "Mammal line",
  reptile_line: "Reptile line",
  archosaur_line: "Archosaur line",
  dinosaur_line: "Dinosaur line",
  pterosaur_line: "Pterosaur line",
  crocodile_line: "Crocodile line",
  marine_reptile_context: "Marine reptile context",
};

function shortConfidence(value?: string) {
  if (!value) return "unlabeled";
  if (value.includes("debated")) return "debated";
  if (value.includes("medium")) return "medium";
  if (value.includes("high")) return "high";
  return value.split("_").join(" ");
}

function cleanText(value?: string | null) {
  return value ? value.split("_").join(" ") : "Not available";
}

function buildHierarchy(topologyId: string) {
  const nodeMap = new Map<string, DisplayNode>();
  const parentMap = new Map<string, string | null>();

  data.nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    parentMap.set(node.id, node.parent);
  });

  const topology = data.alternative_topologies.find((item) => item.id === topologyId);
  topology?.tree_edges?.forEach(([parent, child]) => {
    if (!nodeMap.has(parent)) {
      nodeMap.set(parent, {
        id: parent,
        label: parent.split("_").join(" "),
        parent: null,
        confidence: "virtual_topology_node",
        status_note: "Virtual node from an alternative topology edge list.",
        virtual: true,
      });
    }
    if (!nodeMap.has(child)) {
      nodeMap.set(child, {
        id: child,
        label: child.split("_").join(" "),
        parent,
        confidence: "virtual_topology_node",
        status_note: "Virtual node from an alternative topology edge list.",
        virtual: true,
      });
    }
    parentMap.set(child, parent);
  });

  if (topologyId === "ornithoscelida_2017") {
    parentMap.set("saurischia", null);
  }

  const childMap = new Map<string, DisplayNode[]>();
  const roots: DisplayNode[] = [];

  nodeMap.forEach((node) => {
    const parentId = parentMap.get(node.id);
    if (parentId && nodeMap.has(parentId)) {
      const siblings = childMap.get(parentId) ?? [];
      siblings.push(node);
      childMap.set(parentId, siblings);
    } else if (!parentId) {
      roots.push(node);
    }
  });

  const rootNode = nodeMap.get("amniota") ?? roots[0];

  function nest(node: DisplayNode): DisplayNode & { children?: DisplayNode[] } {
    const children = (childMap.get(node.id) ?? [])
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(nest);
    return children.length ? { ...node, children } : node;
  }

  return d3.hierarchy<DisplayNode>(nest(rootNode));
}

function buildLayout(topologyId: string) {
  const root = buildHierarchy(topologyId);
  const layout = d3.tree<DisplayNode>().nodeSize([58, 230]);
  const laidOut = layout(root);
  const nodes = laidOut.descendants();
  const links = laidOut.links();
  const minX = d3.min(nodes, (node) => node.x) ?? 0;
  const maxX = d3.max(nodes, (node) => node.x) ?? 0;
  const maxY = d3.max(nodes, (node) => node.y) ?? 0;
  return {
    nodes,
    links,
    viewBox: {
      minX: -80,
      minY: minX - 80,
      width: maxY + 360,
      height: maxX - minX + 160,
    },
  };
}

export function App() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const viewportRef = useRef<SVGGElement | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [currentMya, setCurrentMya] = useState(145);
  const [selectedId, setSelectedId] = useState("dinosauria");
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [topologyId, setTopologyId] = useState("amniota_context_default_2026");

  const topology = data.alternative_topologies.find((item) => item.id === topologyId);
  const layout = useMemo(() => buildLayout(topologyId), [topologyId]);
  const nodesById = useMemo(
    () => new Map(layout.nodes.map((item) => [item.data.id, item])),
    [layout.nodes],
  );
  const nodeById = useMemo(
    () => new Map(data.nodes.map((node) => [node.id, node])),
    [],
  );
  const speciesById = useMemo(
    () => new Map(data.species_catalog.map((entry) => [entry.id, entry])),
    [],
  );

  const selectedNode = nodesById.get(selectedId)?.data ?? nodeById.get(selectedId);
  const selectedSpecies = selectedSpeciesId ? speciesById.get(selectedSpeciesId) : null;

  const searchResults = useMemo<SearchResult[]>(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) return [];

    const clades: SearchResult[] = data.nodes
      .filter((node) => node.label.toLowerCase().includes(term))
      .slice(0, 8)
      .map((node) => ({
        kind: "clade",
        id: node.id,
        label: node.label,
        detail: groupLabels[node.museum_display_group ?? ""] ?? cleanText(node.rank_or_level),
      }));

    const species: SearchResult[] = data.species_catalog
      .filter((entry) => entry.label.toLowerCase().includes(term))
      .slice(0, 8)
      .map((entry) => ({
        kind: "species",
        id: entry.id,
        label: entry.label,
        detail: cleanText(entry.pbdb_lookup?.match_status),
      }));

    return [...clades, ...species].slice(0, 12);
  }, [query]);

  useEffect(() => {
    if (!svgRef.current || !viewportRef.current) return;

    const svg = d3.select(svgRef.current);
    const viewport = d3.select(viewportRef.current);
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.35, 3.5])
      .on("zoom", (event) => {
        viewport.attr("transform", event.transform.toString());
      });

    svg.call(zoom);
    zoomRef.current = zoom;
    svg.call(zoom.transform, d3.zoomIdentity.translate(70, 260).scale(0.88));

    return () => {
      svg.on(".zoom", null);
    };
  }, [topologyId]);

  function selectClade(id: string, animated = true) {
    setSelectedId(id);
    setSelectedSpeciesId(null);

    const svg = svgRef.current;
    const target = nodesById.get(id);
    const zoom = zoomRef.current;
    if (!svg || !target || !zoom) return;

    const surface = svg.getBoundingClientRect();
    const scale = 1.35;
    const transform = d3.zoomIdentity
      .translate(surface.width / 2 - target.y * scale, surface.height / 2 - target.x * scale)
      .scale(scale);
    const selection = d3.select(svg);
    if (animated) {
      selection.transition().duration(650).ease(d3.easeCubicOut).call(zoom.transform, transform);
    } else {
      selection.call(zoom.transform, transform);
    }
  }

  function selectSearchResult(result: SearchResult) {
    if (result.kind === "clade") {
      selectClade(result.id);
    } else {
      setSelectedSpeciesId(result.id);
      const species = speciesById.get(result.id);
      const hint = species?.parent_clade_hint;
      const hintedNode =
        data.nodes.find((node) => hint?.includes(node.id)) ??
        data.nodes.find((node) => node.id === "dinosauria");
      if (hintedNode) selectClade(hintedNode.id);
    }
    setQuery(result.label);
  }

  const timeX = ((299 - currentMya) / 299) * 100;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Scientific prehistoric visualization</p>
          <h1>PaleoTime</h1>
        </div>
        <nav aria-label="Primary navigation">
          <a href="#tree">Tree</a>
          <a href="#sources">Sources</a>
          <a href="#roadmap">Roadmap</a>
        </nav>
      </header>

      <section className="workspace" id="tree">
        <aside className="control-panel">
          <p className="panel-label">Search</p>
          <div className="search-box">
            <input
              aria-label="Search clades and species"
              placeholder="Search Dinosauria, Triceratops..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((result) => (
                  <button
                    key={`${result.kind}-${result.id}`}
                    type="button"
                    onClick={() => selectSearchResult(result)}
                  >
                    <span>{result.label}</span>
                    <small>{result.kind} - {result.detail}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="panel-label">Topology</p>
          <select
            aria-label="Phylogenetic topology"
            value={topologyId}
            onChange={(event) => {
              setTopologyId(event.target.value);
              setSelectedSpeciesId(null);
            }}
          >
            {data.alternative_topologies.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <p className="topology-note">{topology?.summary}</p>

          <p className="panel-label">Deep time cursor</p>
          <output>{currentMya} million years ago</output>
          <input
            aria-label="Geological time in million years ago"
            type="range"
            min="0"
            max="299"
            value={currentMya}
            onChange={(event) => setCurrentMya(Number(event.target.value))}
          />
          <div className="time-band" aria-hidden="true">
            {periodBands.map((period) => {
              const left = ((299 - period.start) / 299) * 100;
              const width = ((period.start - period.end) / 299) * 100;
              return (
                <span
                  key={period.label}
                  style={{ left: `${left}%`, width: `${width}%`, background: period.color }}
                >
                  {period.label}
                </span>
              );
            })}
            <i style={{ left: `${timeX}%` }} />
          </div>
          <p className="hint">
            Tree branch length is topological in this version. The timeline is a
            geological context control until reviewed first/last appearance ages
            are added to the JSON.
          </p>
        </aside>

        <section className="tree-surface" aria-label="Interactive phylogenetic tree">
          <svg
            ref={svgRef}
            viewBox={`${layout.viewBox.minX} ${layout.viewBox.minY} ${layout.viewBox.width} ${layout.viewBox.height}`}
            role="img"
            aria-labelledby="treeTitle treeDescription"
          >
            <title id="treeTitle">PaleoTime phylogenetic context tree</title>
            <desc id="treeDescription">
              A zoomable and pannable left-to-right phylogenetic tree generated from the PaleoTime JSON.
            </desc>
            <g ref={viewportRef}>
              {layout.links.map((link) => (
                <path
                  key={`${link.source.data.id}-${link.target.data.id}`}
                  className={`tree-link confidence-${shortConfidence(link.target.data.confidence)}`}
                  d={`M ${link.source.y} ${link.source.x} C ${
                    link.source.y + 120
                  } ${link.source.x}, ${link.target.y - 120} ${link.target.x}, ${
                    link.target.y
                  } ${link.target.x}`}
                />
              ))}
              {layout.nodes.map((item) => {
                const selected = selectedId === item.data.id && !selectedSpeciesId;
                const isDebated = shortConfidence(item.data.confidence) === "debated";
                return (
                  <g
                    key={item.data.id}
                    className={`tree-node ${selected ? "is-selected" : ""} ${
                      isDebated ? "is-debated" : ""
                    } ${item.data.virtual ? "is-virtual" : ""}`}
                    transform={`translate(${item.y} ${item.x})`}
                    onClick={() => selectClade(item.data.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Inspect ${item.data.label}`}
                  >
                    <circle r={selected ? 9 : 6} />
                    <text x="14" y="-3">{item.data.label}</text>
                    <text x="14" y="14" className="node-meta">
                      {shortConfidence(item.data.confidence)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="tree-tools">
            <button type="button" onClick={() => selectClade("amniota")}>
              Reset
            </button>
            <button type="button" onClick={() => selectClade("dinosauria")}>
              Dinosauria
            </button>
          </div>
        </section>

        <aside className="detail-panel">
          {selectedSpecies ? (
            <>
              <p className="panel-label">Selected taxon</p>
              <h2>{selectedSpecies.label}</h2>
              <dl>
                <div>
                  <dt>PBDB status</dt>
                  <dd>{cleanText(selectedSpecies.pbdb_lookup?.match_status)}</dd>
                </div>
                <div>
                  <dt>PBDB taxon</dt>
                  <dd>{selectedSpecies.pbdb_lookup?.pbdb_taxon_no ?? "Not linked"}</dd>
                </div>
                <div>
                  <dt>Catalog group</dt>
                  <dd>{cleanText(selectedSpecies.catalog_group)}</dd>
                </div>
              </dl>
              <p>{selectedSpecies.taxonomic_caution ?? selectedSpecies.verification_status}</p>
              {selectedSpecies.pbdb_lookup?.pbdb_web_url && (
                <a className="source-link" href={selectedSpecies.pbdb_lookup.pbdb_web_url}>
                  Open PBDB taxon page
                </a>
              )}
            </>
          ) : (
            <>
              <p className="panel-label">Selected lineage</p>
              <h2>{selectedNode?.label}</h2>
              <dl>
                <div>
                  <dt>Rank / level</dt>
                  <dd>{cleanText(selectedNode?.rank_or_level)}</dd>
                </div>
                <div>
                  <dt>Confidence</dt>
                  <dd>{cleanText(selectedNode?.confidence)}</dd>
                </div>
                <div>
                  <dt>Display group</dt>
                  <dd>
                    {groupLabels[selectedNode?.museum_display_group ?? ""] ??
                      cleanText(selectedNode?.museum_display_group)}
                  </dd>
                </div>
              </dl>
              <p>{selectedNode?.status_note}</p>
              {selectedNode?.example_taxa && (
                <div className="chips">
                  {selectedNode.example_taxa.map((taxon) => (
                    <span key={taxon}>{taxon}</span>
                  ))}
                </div>
              )}
            </>
          )}
        </aside>
      </section>

      <section className="research-band" id="sources">
        <div>
          <p className="eyebrow">Data model</p>
          <h2>Curated tree, PBDB-linked taxa</h2>
        </div>
        <p>
          The interface now reads the museum seed JSON directly: {data.nodes.length} tree
          nodes, {data.species_catalog_summary.entry_count} catalog entries, and PBDB
          reconciliation metadata for search results and taxon panels.
        </p>
      </section>

      <section className="roadmap" id="roadmap">
        <h2>Next scientific UX upgrades</h2>
        <ol>
          <li>Add reviewed first and last appearance ages to each clade and species.</li>
          <li>Render species as zoom-level dependent leaves instead of only search results.</li>
          <li>Add occurrence maps from PBDB records and source cards for each claim.</li>
        </ol>
      </section>
    </main>
  );
}
