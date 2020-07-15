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
    this.viewport = [bounds.width, bounds.height];
    this.runCallback = true;
    this.bounds = null;
    this.scaleOffset = [0, 0];
  }

  updateBounds(bounds) {
    this.viewport = bounds;
  }

  ensureBounds() {
    if (this.bounds == null) return;

    let dx = 0;
    let dy = 0;

    const [x1, y1] = this.unproject([0, 0]);
    const [x2, y2] = this.unproject(this.bounds[0]);
    const width = x2 - x1;
    const boundsWidth = this.bounds[1][0];
    const height = y2 - y1;
    const boundsHeight = this.bounds[1][1];

    if (width < boundsWidth) {
      if (x1 < 0) {
        dx = x1;
      } else if (x2 > boundsWidth) {
        dx = x2 - boundsWidth;
      }
    } else {
      // Ensure center
      const currentCenter = x1 + (x2 - x1) / 2;
      const desiredCenter = boundsWidth / 2;
      dx = currentCenter - desiredCenter;
    }

    if (height < boundsHeight) {
      if (y1 < 0) {
        // Stay on top of page if zoomed out too far
        dy = y1;
      } else if (y2 > boundsHeight) {
        dy = y2 - boundsHeight;
      }
    } else {
      // Pin to top when zoomed out
      dy = y1;
    }

    if (!closeEnough(dx, 0) || !closeEnough(dy, 0)) {
      mat2d.translate(this.matrix, this.matrix, [dx, dy]);
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

  setScaleOffset(dx, dy) {
    this.scaleOffset = [dx, dy];
  }

  scale(cx, cy, factor) {
    if (this.matrix[0] * factor < MIN_ZOOM) {
      factor = MIN_ZOOM / this.matrix[0];
    } else if (this.matrix[0] * factor > MAX_ZOOM) {
      factor = MAX_ZOOM / this.matrix[0];
    }

    const [dx, dy] = this.unproject([cx - this.scaleOffset[0], cy - this.scaleOffset[1]]);
    mat2d.translate(this.matrix, this.matrix, [dx, dy]);
    mat2d.scale(this.matrix, this.matrix, [factor, factor]);
    mat2d.translate(this.matrix, this.matrix, [-dx, -dy]);
    this.updateMatrix(this.matrix);
  }

  fitTransform(centerPoint, width, height) {
    // Return a matrix that encompasses the desired center point and encompasses the width/height
    const vw = this.viewport[0];
    const vh = this.viewport[1];
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
