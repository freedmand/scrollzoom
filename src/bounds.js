import { ignoreFirst, smoothify } from "./closure";

function windowObserver(_, callback) {
  const event = ['resize', smoothify(callback)];
  window.addEventListener(...event);
  return () => window.removeEventListener(...event);
}

function resizeObserver(element, callback) {
  const observer = new ResizeObserver(ignoreFirst(smoothify(callback)));
  observer.observe(element);

  return () => observer.disconnect();
}

function defaultObserver(element, callback) {
  if (window.ResizeObserver != null) {
    return resizeObserver(element, callback);
  } else {
    return windowObserver(element, callback);
  }
}

export class Bounds {
  constructor(element, resizeCallback, resizeMethod = defaultObserver) {
    this.element = element;
    this.resizeCallback = resizeCallback;
    this.updateDimensions(true);

    this.cleanup = resizeMethod(element, () => this.updateDimensions());
  }

  destroy() {
    if (this.cleanup != null) this.cleanup();
  }

  updateDimensions(init = false) {
    this.width = this.element.offsetWidth;
    this.height = this.element.offsetHeight;
    if (!init && this.resizeCallback != null) this.resizeCallback(this.width, this.height);
  }
}
