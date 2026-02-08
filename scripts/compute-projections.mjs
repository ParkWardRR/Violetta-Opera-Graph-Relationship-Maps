import { UMAP } from 'umap-js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const staticDir = process.argv[2] || join(process.env.HOME, 'Violetta-Opera-Graph-Relationship-Maps');
const processedDir = join(staticDir, 'data', 'processed');

const embeddingsPath = join(processedDir, 'embeddings.json');
const graphPath = join(processedDir, 'graph.json');
const outputPath = join(processedDir, 'projections.json');

console.log(`Reading embeddings from ${embeddingsPath}`);
const embeddings = JSON.parse(readFileSync(embeddingsPath, 'utf-8'));

const keys = Object.keys(embeddings.embeddings);
const vectors = keys.map(k => embeddings.embeddings[k]);

console.log(`Computing UMAP for ${keys.length} vectors (dim=${embeddings.dimension})`);

const umap = new UMAP({
  nComponents: 2,
  nEpochs: 500,
  nNeighbors: Math.min(15, Math.max(2, keys.length - 1)),
  minDist: 0.1,
});

const projection = umap.fit(vectors);

const projections = {};
keys.forEach((key, i) => {
  projections[key] = { x: projection[i][0], y: projection[i][1] };
});

writeFileSync(outputPath, JSON.stringify({ method: 'umap', projections }, null, 2));
console.log(`Projections written to ${outputPath}`);

// Merge projections into graph.json
console.log(`Merging projections into ${graphPath}`);
const graph = JSON.parse(readFileSync(graphPath, 'utf-8'));

for (const node of graph.nodes) {
  const proj = projections[node.key];
  if (proj) {
    node.attributes.projX = proj.x;
    node.attributes.projY = proj.y;
  }
}

writeFileSync(graphPath, JSON.stringify(graph, null, 2));
console.log('Done.');
