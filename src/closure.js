// Utilities to wrap functions with additional functionality

export function ignoreFirst(closure) {
  // Ignore first invocation of a function
  let first = true;
  return () => {
    if (first) {
      first = false;
    } else {
      closure();
    }
  }
}

export function smoothify(fn) {
  // Make function call back when CPU is idle
  let timer = null;

  return ((...args) => {
    if (timer != null) {
      cancelAnimationFrame(timer);
      timer = null;
    }

    timer = requestAnimationFrame(() => {
      timer = null;
      fn(...args);
    });
  });
}
