import { Bounds } from "./bounds";
import { Transform } from "./transform";
import { Events } from "./events";

const DEFAULT_SIZE = 500;

export default function scrollzoom(element, options = {}) {
  const bounds = new Bounds(element);

  // Render components as transform changes
  let componentId = 0;
  const components = (options['components'] || []).map(x => {
    return {
      ...x,
      id: componentId++
    }
  });
  const rendered = {};

  const width = options['width'] || DEFAULT_SIZE;
  const height = options['height'] || DEFAULT_SIZE;
  const container = document.createElement('div');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.position = 'relative';
  container.style.margin = '0 auto';
  element.appendChild(container);

  const transform = new Transform(bounds, () => {
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const scrollOrigin = transform.project([0, 0]);
      const topLeft = transform.project([component['x'], component['y']]);
      const bottomRight = transform.project([component['x'] + component['width'], component['y'] + component['height']]);
      const position = {
        x: topLeft[0] - scrollOrigin[0],
        y: topLeft[1] - scrollOrigin[1],
        width: bottomRight[0] - topLeft[0],
        height: bottomRight[1] - topLeft[1],
      };

      if (rendered[component['id']] == null) {
        // Render
        const elem = component['component']['render'](position);
        rendered[component['id']] = elem;
        element.children[0].appendChild(elem);
      } else {
        // Update
        const elem = rendered[component['id']];
        component['component']['update'](elem, position);
      }
    }

    const canvas = options['debugCanvas'];
    const width = options['width'];
    const height = options['height'];
    const SCALE = 0.5;
    if (canvas != null) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(-width / SCALE, -height / SCALE, width / SCALE * 2, height / SCALE * 2);
      ctx.restore();
      ctx.save();
      ctx.scale(SCALE, SCALE);
      ctx.translate(width * (1 - SCALE), height * (1 - SCALE));

      const topLeft = transform.unproject([0, 0]);
      const bottomRight = transform.unproject([bounds.width, bounds.height]);
      ctx.strokeRect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.strokeRect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);

      for (let i = 0; i < components.length; i++) {
        const component = components[i];
        const topLeft = [component['x'], component['y']];
        const bottomRight = [component['x'] + component['width'], component['y'] + component['height']];
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)'
        ctx.fillRect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
      }
    }
  });
  transform.domCallback();

  const events = new Events(element, container, [width, height], bounds, transform);
  bounds.resizeCallback = (w, h) => transform.updateBounds(w, h);

}
