import { useMemo, useState } from "react";
import { dinosaurTree, LineageNode, timeMarkers } from "./paleoData";

type PositionedNode = {
  node: LineageNode;
  x: number;
  y: number;
  depth: number;
  parent?: PositionedNode;
};

function flattenTree(root: LineageNode): PositionedNode[] {
  const rows: PositionedNode[] = [];
  let y = 60;

  function visit(node: LineageNode, depth: number, parent?: PositionedNode) {
    const positioned = {
      node,
      x: 70 + depth * 235,
      y,
      depth,
      parent,
    };
    rows.push(positioned);
    y += 86;
    node.children?.forEach((child) => visit(child, depth + 1, positioned));
  }

  visit(root, 0);
  return rows;
}

export function App() {
  const [currentMya, setCurrentMya] = useState(100);
  const [selectedId, setSelectedId] = useState("dinosauria");
  const nodes = useMemo(() => flattenTree(dinosaurTree), []);
  const selected = nodes.find((item) => item.node.id === selectedId) ?? nodes[0];

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
          <p className="panel-label">Deep time cursor</p>
          <output>{currentMya} million years ago</output>
          <input
            aria-label="Geological time in million years ago"
            type="range"
            min="0"
            max="252"
            value={currentMya}
            onChange={(event) => setCurrentMya(Number(event.target.value))}
          />
          <div className="periods">
            {timeMarkers.map((marker) => (
              <span key={marker.label}>{marker.label}</span>
            ))}
          </div>
          <p className="hint">
            First build target: replace this curated seed tree with a cited,
            versioned Dinosauria dataset enriched from paleontology databases.
          </p>
        </aside>

        <section className="tree-surface" aria-label="Dinosaur evolutionary tree concept">
          <svg viewBox="0 0 940 690" role="img" aria-labelledby="treeTitle treeDescription">
            <title id="treeTitle">Dinosaur lineage tree concept</title>
            <desc id="treeDescription">
              A concept visualization of major dinosaur clades arranged as an evolutionary tree.
            </desc>
            <g>
              {nodes
                .filter((item) => item.parent)
                .map((item) => (
                  <path
                    key={`${item.parent?.node.id}-${item.node.id}`}
                    className="tree-link"
                    d={`M ${item.parent!.x + 150} ${item.parent!.y} C ${item.parent!.x + 205} ${item.parent!.y}, ${item.x - 50} ${item.y}, ${item.x} ${item.y}`}
                  />
                ))}
              {nodes.map((item) => {
                const active =
                  currentMya <= item.node.fromMya && currentMya >= item.node.toMya;
                return (
                  <g
                    key={item.node.id}
                    className={`tree-node ${active ? "is-active" : ""} ${
                      selectedId === item.node.id ? "is-selected" : ""
                    }`}
                    transform={`translate(${item.x} ${item.y})`}
                    onClick={() => setSelectedId(item.node.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Inspect ${item.node.name}`}
                  >
                    <rect width="172" height="48" rx="8" />
                    <text x="16" y="22">{item.node.name}</text>
                    <text x="16" y="38" className="node-age">
                      {item.node.fromMya}-{item.node.toMya} Ma
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </section>

        <aside className="detail-panel">
          <p className="panel-label">Selected lineage</p>
          <h2>{selected.node.name}</h2>
          <dl>
            <div>
              <dt>Range</dt>
              <dd>
                {selected.node.fromMya}-{selected.node.toMya} Ma
              </dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{selected.node.confidence}</dd>
            </div>
          </dl>
          <p>{selected.node.note}</p>
        </aside>
      </section>

      <section className="research-band" id="sources">
        <div>
          <p className="eyebrow">Research model</p>
          <h2>Curated first, database-enriched second</h2>
        </div>
        <p>
          Paleontology APIs are powerful, but taxonomy and phylogeny are not
          always cleanly aligned across sources. PaleoTime should start with a
          reviewed, cited dinosaur tree and enrich it with fossil occurrences,
          age ranges, and external identifiers.
        </p>
      </section>

      <section className="roadmap" id="roadmap">
        <h2>Initial build roadmap</h2>
        <ol>
          <li>Create a cited Dinosauria clade dataset with confidence fields.</li>
          <li>Replace the static SVG prototype with D3 zoom, pan, and filtering.</li>
          <li>Add fossil occurrence maps and recent-research update notes.</li>
        </ol>
      </section>
    </main>
  );
}
