// Sample a regular grid in depth; perspective compresses the distant rows.
const terrainRows = 39;
const terrainColumns = 75;
export const terrain = Array.from({ length: terrainRows }, (_, row) => {
  const depth = row / (terrainRows - 1);
  const perspective = 0.27 + 0.9 * depth ** 1.5;
  // Keep distant rows beyond both edges so the wave fills the upper corners.
  const span = 0.56 + 0.61 * depth ** 1.5;
  return Array.from({ length: terrainColumns }, (_, column) => {
    const u = (column / (terrainColumns - 1)) * 2 - 1;
    const ridge =
      0.066 * Math.sin(8 * u + 10 * depth) +
      0.038 * Math.cos(12 * u - 7 * depth) +
      0.021 * Math.sin(18 * depth + 5 * u);
    return {
      index: row * terrainColumns + column,
      x: 0.5 + u * span,
      y: -0.045 + 1.23 * depth ** 1.34 + ridge * perspective,
      size: 0.85 + depth * 0.85,
      phase: 5 * u + 5 * depth,
      amplitude: 0.009 + 0.025 * perspective,
      light: Math.min(
        7,
        Math.max(0, Math.floor((0.8 + 4.4 * depth + 14 * ridge) * 1.2)),
      ),
    };
  });
}).flat();
