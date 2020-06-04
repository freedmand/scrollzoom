export function clamp(x, min = 0, max = 1) {
  return Math.max(Math.min(x, max), min);
}

export function closeEnough(x, y, epsilon = 0.000001) {
  return Math.abs(x - y) < epsilon;
}
