import { mat2d, vec2 } from 'gl-matrix';
import { closeEnough } from './math';

// TODO: refactor as parameters
const MAX_ZOOM = 8; // 8x
const MIN_ZOOM = 1 / 5;

export class Transform {
  constructor(bounds, domCallback) {
    this.matrix = mat2d.create();
    this.callback = null;
    this.domCallback = domCallback;
    this.viewport = bounds;
    this.runCallback = true;
    this.bounds = null;
  }

  updateBounds(bounds) {
    this.viewport = bounds;
  }

  ensureBounds() {
    return;
    if (this.bounds != null) {
      const viewportBounds = [...this.unproject(0, 0), ...this.unproject(this.bounds)];
      const [x1, y1, x2, y2] = viewportBounds;

      let dx = 0;
      let dy = 0;

      if (x2 - x1 > this.bounds[0]) {
        // Stay on top of page if zoomed out too far
        dx = x1;
      } else {
        // Prevent panning past page bounds
        if (x1 < 0) {
          dx = x1 - 0;
        } else if (x2 > this.bounds[0]) {
          dx = x2 - this.bounds[0];
        }
      }

      if (y2 - y1 > this.bounds[1]) {
        // Stay on top of page if zoomed out too far
        dy = y1;
      } else {
        // Prevent panning past page bounds
        if (y1 < 0) {
          dy = y1 - 0;
        } else if (y2 > this.bounds[1]) {
          dy = y2 - this.bounds[1];
        }
      }

      if (!closeEnough(dx, 0) || !closeEnough(dy, 0)) {
        mat2d.translate(this.matrix, this.matrix, [dx, dy]);
      }
    }
  }

  updateMatrix(matrix) {
    this.matrix = matrix;
    this.ensureBounds();
    if (this.callback != null && this.runCallback) this.callback();
    if (this.domCallback != null) this.domCallback();
  }

  project(point) {
    const result = [0, 0];
    vec2.transformMat2d(result, point, this.matrix);
    return result;
  }

  unproject(point) {
    const result = [0, 0];
    const inverted = mat2d.create();
    mat2d.invert(inverted, this.matrix);
    vec2.transformMat2d(result, point, inverted);
    return result;
  }

  scale(cx, cy, factor) {
    if (this.matrix[0] * factor < MIN_ZOOM) {
      factor = MIN_ZOOM / this.matrix[0];
    } else if (this.matrix[0] * factor > MAX_ZOOM) {
      factor = MAX_ZOOM / this.matrix[0];
    }

    const [dx, dy] = this.unproject([cx, cy]);
    mat2d.translate(this.matrix, this.matrix, [dx, dy]);
    mat2d.scale(this.matrix, this.matrix, [factor, factor]);
    mat2d.translate(this.matrix, this.matrix, [-dx, -dy]);
    this.updateMatrix(this.matrix);
    // TODO: ensure bounds
  }

  fitTransform(centerPoint, width, height) {
    // Return a matrix that encompasses the desired center point and encompasses the width/height
    const vw = this.viewport.width;
    const vh = this.viewport.height;
    const scaleFactor = Math.min(vw / width, vh / height);
    const matrix = mat2d.create();
    mat2d.translate(matrix, matrix, [vw / 2, vh / 2]);
    mat2d.scale(matrix, matrix, [scaleFactor, scaleFactor]);
    mat2d.translate(matrix, matrix, [-centerPoint[0], -centerPoint[1]]);
    return matrix;
  }

  fitPercents(leftPerc, topPerc, widthPerc, heightPerc, boundsWidth, boundsHeight) {
    const x1 = leftPerc * boundsWidth;
    const y1 = topPerc * boundsHeight;
    const width = widthPerc * boundsWidth;
    const height = heightPerc * boundsHeight;
    this.updateMatrix(this.fitTransform([x1 + width / 2, y1 + height / 2], width, height));
  }
}
