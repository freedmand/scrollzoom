import { Bounds } from "./bounds";
import { Transform } from "./transform";
import { Events } from "./events";

const DEFAULT_SIZE = 500;

export default class ScrollZoom {
  constructor(element, options) {
    this.element = element;
    this.options = options;
    this.bounds = new Bounds(this.element);

    // Render components as transform changes
    this.componentId = 0;
    this.components = (this.options['components'] || []).map(x => {
      return {
        ...x,
        id: this.componentId++
      }
    });

    // Map of rendered elements
    this.rendered = {};
    // Map of rendered components
    this.renderedComponents = {};

    this.containerWidth = this.options['width'] || DEFAULT_SIZE;
    this.containerHeight = this.options['height'] || DEFAULT_SIZE;
    this.changeCallback = this.options['changeCallback'];

    // Create the internal container element
    this.container = document.createElement('div');
    this.container.style.width = `${this.containerWidth}px`;
    this.container.style.height = `${this.containerHeight}px`;
    this.container.style.position = 'relative';
    // Centered horizontally
    // TODO: refactor as a parameter
    this.container.style.margin = '0 auto';
    this.element.appendChild(this.container);

    this.transform = new Transform(this.bounds, () => this.domCallback());
    this.domCallback();

    this.events = new Events(this.element, this.container, [this.containerWidth, this.containerHeight], this.bounds, this.transform);
    this.bounds.resizeCallback = (w, h) => this.resizeBounds(w, h);
  }

  destroy() {
    this.bounds.destroy();
    this.events.destroy();

    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      this.destroyComponent(component);
    }
  }

  resizeBounds(w, h) {
    this.transform.updateBounds([w, h]);
    this.events.updateBounds();
    this.transform.updateMatrix(this.transform.matrix);
  }

  resizeContainer(w, h) {
    this.containerWidth = w;
    this.containerHeight = h;
    this.events.containerWidth = w;
    this.events.containerHeight = h;
    this.events.updateBounds();
  }

  destroyComponent(component) {
    const id = component['id'];
    const rendered = this.rendered[id];
    if (rendered != null) {
      const destroyFn = component['component']['destroy'];
      if (destroyFn != null) {
        destroyFn(rendered);
      }
      // Remove DOM node
      rendered.remove();
      delete this.rendered[id];
      delete this.renderedComponents[id];
      return true;
    }
    return false;
  }

  triggerChange() {
    if (this.changeCallback != null) this.changeCallback();
  }

  domCallback() {
    // Render the DOM
    let changed = false;
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      const scrollOrigin = this.transform.project([0, 0]);
      const topLeft = this.transform.project([component['x'], component['y']]);
      const bottomRight = this.transform.project([component['x'] + component['width'], component['y'] + component['height']]);

      // Visibility check
      const hidden = bottomRight[0] < 0 || topLeft[0] > this.bounds.width ||
        bottomRight[1] < 0 || topLeft[1] > this.bounds.height;

      const position = {
        x: topLeft[0] - scrollOrigin[0],
        y: topLeft[1] - scrollOrigin[1],
        width: bottomRight[0] - topLeft[0],
        height: bottomRight[1] - topLeft[1],
      };

      if (hidden) {
        // Hide if already rendered
        if (this.destroyComponent(component)) changed = true;
      } else {
        if (this.rendered[component['id']] == null) {
          // Render
          const elem = component['component']['render'](position);
          this.rendered[component['id']] = elem;
          this.renderedComponents[component['id']] = component;
          this.element.children[0].appendChild(elem);
          changed = true;
        } else {
          // Update
          const elem = this.rendered[component['id']];
          component['component']['update'](elem, position);
        }
      }
    }

    if (changed) {
      // What is rendered has changed
      this.triggerChange();
    }

    const canvas = this.options['debugCanvas'];
    const width = this.options['width'];
    const height = this.options['height'];
    const SCALE = 0.5;
    if (canvas != null) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(-width / SCALE, -height / SCALE, width / SCALE * 2, height / SCALE * 2);
      ctx.restore();
      ctx.save();
      ctx.scale(SCALE, SCALE);
      ctx.translate(width * (1 - SCALE), height * (1 - SCALE));

      const topLeft = this.transform.unproject([0, 0]);
      const bottomRight = this.transform.unproject([this.bounds.width, this.bounds.height]);
      ctx.strokeRect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.strokeRect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);

      for (let i = 0; i < this.components.length; i++) {
        const component = this.components[i];
        const topLeft = [component['x'], component['y']];
        const bottomRight = [component['x'] + component['width'], component['y'] + component['height']];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
        ctx.fillRect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
      }
    }
  }
}
