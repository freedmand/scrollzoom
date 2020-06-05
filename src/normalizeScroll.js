// Adapted from https://stackoverflow.com/a/13650579
// with custom touches

export function normalizeScroll(e) {
  var o = e,
    d = o.detail, w = ((-o.deltaY * 15) || o.wheelDelta || o.wheelDeltaY),
    n = 225, n1 = n - 1, f;


  // Normalize delta
  d = d ? w && (f = w / d) ? d / f : -d / 1.35 : w / 120;
  // Quadratic scale if |d| > 1
  d = d < 1 ? d < -1 ? (-Math.pow(d, 2) - n1) / n : d : (Math.pow(d, 2) + n1) / n;
  // Delta *should* not be greater than 2...
  return Math.min(Math.max(d / 2, -1), 1);
}
