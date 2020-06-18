
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.ScrollZoom = factory());
}(this, (function () { 'use strict';

  // Utilities to wrap functions with additional functionality

  function ignoreFirst(closure) {
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

  function smoothify(fn) {
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

  class Bounds {
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

  /**
   * Common utilities
   * @module glMatrix
   */
  var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
  if (!Math.hypot) Math.hypot = function () {
    var y = 0,
        i = arguments.length;

    while (i--) {
      y += arguments[i] * arguments[i];
    }

    return Math.sqrt(y);
  };

  /**
   * 2x3 Matrix
   * @module mat2d
   * @description
   * A mat2d contains six elements defined as:
   * <pre>
   * [a, b,
   *  c, d,
   *  tx, ty]
   * </pre>
   * This is a short form for the 3x3 matrix:
   * <pre>
   * [a, b, 0,
   *  c, d, 0,
   *  tx, ty, 1]
   * </pre>
   * The last column is ignored so the array is shorter and operations are faster.
   */

  /**
   * Creates a new identity mat2d
   *
   * @returns {mat2d} a new 2x3 matrix
   */

  function create() {
    var out = new ARRAY_TYPE(6);

    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[4] = 0;
      out[5] = 0;
    }

    out[0] = 1;
    out[3] = 1;
    return out;
  }
  /**
   * Inverts a mat2d
   *
   * @param {mat2d} out the receiving matrix
   * @param {ReadonlyMat2d} a the source matrix
   * @returns {mat2d} out
   */

  function invert(out, a) {
    var aa = a[0],
        ab = a[1],
        ac = a[2],
        ad = a[3];
    var atx = a[4],
        aty = a[5];
    var det = aa * ad - ab * ac;

    if (!det) {
      return null;
    }

    det = 1.0 / det;
    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
  }
  /**
   * Scales the mat2d by the dimensions in the given vec2
   *
   * @param {mat2d} out the receiving matrix
   * @param {ReadonlyMat2d} a the matrix to translate
   * @param {ReadonlyVec2} v the vec2 to scale the matrix by
   * @returns {mat2d} out
   **/

  function scale(out, a, v) {
    var a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3],
        a4 = a[4],
        a5 = a[5];
    var v0 = v[0],
        v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v0;
    out[2] = a2 * v1;
    out[3] = a3 * v1;
    out[4] = a4;
    out[5] = a5;
    return out;
  }
  /**
   * Translates the mat2d by the dimensions in the given vec2
   *
   * @param {mat2d} out the receiving matrix
   * @param {ReadonlyMat2d} a the matrix to translate
   * @param {ReadonlyVec2} v the vec2 to translate the matrix by
   * @returns {mat2d} out
   **/

  function translate(out, a, v) {
    var a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3],
        a4 = a[4],
        a5 = a[5];
    var v0 = v[0],
        v1 = v[1];
    out[0] = a0;
    out[1] = a1;
    out[2] = a2;
    out[3] = a3;
    out[4] = a0 * v0 + a2 * v1 + a4;
    out[5] = a1 * v0 + a3 * v1 + a5;
    return out;
  }

  /**
   * 2 Dimensional Vector
   * @module vec2
   */

  /**
   * Creates a new, empty vec2
   *
   * @returns {vec2} a new 2D vector
   */

  function create$1() {
    var out = new ARRAY_TYPE(2);

    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
    }

    return out;
  }
  /**
   * Transforms the vec2 with a mat2d
   *
   * @param {vec2} out the receiving vector
   * @param {ReadonlyVec2} a the vector to transform
   * @param {ReadonlyMat2d} m matrix to transform with
   * @returns {vec2} out
   */

  function transformMat2d(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
  }
  /**
   * Perform some operation over an array of vec2s.
   *
   * @param {Array} a the array of vectors to iterate over
   * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
   * @param {Number} offset Number of elements to skip at the beginning of the array
   * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
   * @param {Function} fn Function to call for each vector in the array
   * @param {Object} [arg] additional argument to pass to fn
   * @returns {Array} a
   * @function
   */

  var forEach = function () {
    var vec = create$1();
    return function (a, stride, offset, count, fn, arg) {
      var i, l;

      if (!stride) {
        stride = 2;
      }

      if (!offset) {
        offset = 0;
      }

      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }

      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
      }

      return a;
    };
  }();

  function closeEnough(x, y, epsilon = 0.000001) {
    return Math.abs(x - y) < epsilon;
  }

  // TODO: refactor as parameters
  const MAX_ZOOM = 8; // 8x
  const MIN_ZOOM = 1 / 5;

  class Transform {
    constructor(bounds, domCallback) {
      this.matrix = create();
      this.callback = null;
      this.domCallback = domCallback;
      this.viewport = [bounds.width, bounds.height];
      this.runCallback = true;
      this.bounds = null;
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
        translate(this.matrix, this.matrix, [dx, dy]);
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
      transformMat2d(result, point, this.matrix);
      return result;
    }

    unproject(point) {
      const result = [0, 0];
      const inverted = create();
      invert(inverted, this.matrix);
      transformMat2d(result, point, inverted);
      return result;
    }

    scale(cx, cy, factor) {
      if (this.matrix[0] * factor < MIN_ZOOM) {
        factor = MIN_ZOOM / this.matrix[0];
      } else if (this.matrix[0] * factor > MAX_ZOOM) {
        factor = MAX_ZOOM / this.matrix[0];
      }

      const [dx, dy] = this.unproject([cx, cy]);
      translate(this.matrix, this.matrix, [dx, dy]);
      scale(this.matrix, this.matrix, [factor, factor]);
      translate(this.matrix, this.matrix, [-dx, -dy]);
      this.updateMatrix(this.matrix);
    }

    fitTransform(centerPoint, width, height) {
      // Return a matrix that encompasses the desired center point and encompasses the width/height
      const vw = this.viewport[0];
      const vh = this.viewport[1];
      const scaleFactor = Math.min(vw / width, vh / height);
      const matrix = create();
      translate(matrix, matrix, [vw / 2, vh / 2]);
      scale(matrix, matrix, [scaleFactor, scaleFactor]);
      translate(matrix, matrix, [-centerPoint[0], -centerPoint[1]]);
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

  // DOM utility functions

  function getRelativeCoordinates(event, referenceElement) {
    const position = {
      x: event.pageX,
      y: event.pageY
    };

    const offset = {
      left: referenceElement.offsetLeft,
      top: referenceElement.offsetTop
    };

    let reference = referenceElement.offsetParent;

    while (reference) {
      offset.left += reference.offsetLeft;
      offset.top += reference.offsetTop;
      reference = reference.offsetParent;
    }

    return {
      x: position.x - offset.left,
      y: position.y - offset.top
    };
  }

  // Adapted from https://stackoverflow.com/a/13650579
  // with custom touches

  function normalizeScroll(e) {
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

  // Zoom sensitivity
  const ZOOM_INTENSITY = 0.15;
  // const DOUBLE_TAP_TIMEOUT = 300;

  class Events {
    constructor(element, container, containerBounds, bounds, transform) {
      this.element = element;
      this.container = container;
      this.bounds = bounds;
      this.transform = transform;
      this.prevScale = 1;

      this.updateScrollPositions();

      // The transform bounds
      // Only updated when internal contents are added
      this.containerWidth = containerBounds[0];
      this.containerHeight = containerBounds[1];
      // Set transform bounds
      this.updateBounds();

      this.matrixInitiatedScroll = false;

      this.events = [
        [['scroll'], () => this.scroll()],
        [['wheel'], (e) => this.wheel(e)],
        [['gesturestart'], () => this.gesturestart()],
        [['gesturechange'], (e) => this.gesturechange(e)],
        [['touchstart'], (e) => this.touchstart(e)],
        [['touchmove'], (e) => this.touchmove(e)],
        [['touchend'], (e) => this.touchend(e)],
      ];

      // Smooth functions
      this.setContainer = smoothify((width, height, left, top) => {
        this.scrollPositions = {
          left,
          top,
          width,
          height
        };

        // Set width/height of scroll child
        if (!closeEnough(width, this.container.offsetWidth) || !closeEnough(height, this.container.offsetHeight)) {
          this.container.style.width = `${width}px`;
          this.container.style.height = `${height}px`;
        }

        if (!closeEnough(left, this.element.scrollLeft) || !closeEnough(top, this.scrollPositions.scrollTop)) {
          this.matrixInitiatedScroll = true;
          this.element.scrollLeft = left;
          this.matrixInitiatedScroll = true;
          this.element.scrollTop = top;
        }
      });

      this.transform.callback = () => this.transformCallback();

      this.events.forEach(event => {
        event[0].forEach(eventType => {
          this.element.addEventListener(eventType, event[1], { passive: false });
        });
      });

      this.updateTransformPositions();
    }

    updateBounds() {
      this.transform.bounds = [[this.bounds.width, this.bounds.height], [this.containerWidth, this.containerHeight]];
    }

    destroy() {
      this.events.forEach(event => {
        event[0].forEach(eventType => {
          this.element.removeEventListener(eventType, event[1], { passive: false });
        });
      });
    }

    transformCallback() {
      // Set child height / width
      const topLeft = this.transform.project([0, 0]);
      const bottomRight = this.transform.project([this.containerWidth, this.containerHeight]);
      const width = bottomRight[0] - topLeft[0];
      const height = bottomRight[1] - topLeft[1];
      this.setContainer(width, height, -topLeft[0], -topLeft[1]);
    }

    scroll() {
      if (this.matrixInitiatedScroll) {
        // Don't scroll handle if initiated by matrix
        this.matrixInitiatedScroll = false;
        return;
      }

      this.updateScrollPositions();
      this.updateTransformPositions();
    }

    updateTransformPositions(runCallback = false) {
      const topPerc = this.scrollPositions.top / this.scrollPositions.height;
      const heightPerc = this.bounds.height / this.scrollPositions.height;
      let leftPerc = this.scrollPositions.left / this.scrollPositions.width;
      const widthPerc = this.bounds.width / this.scrollPositions.width;
      if (widthPerc > 1) {
        // Fix width percent to handle centeredness
        leftPerc -= (widthPerc - 1) / 2;
      }

      if (!runCallback) this.transform.runCallback = false;
      this.transform.fitPercents(leftPerc, topPerc, widthPerc, heightPerc, this.containerWidth, this.containerHeight);
      if (!runCallback) this.transform.runCallback = true;
    }

    wheel(e) {
      if (e.ctrlKey && !this.visualScaleCheck()) {
        // Zoom
        e.preventDefault();

        let { x, y } = getRelativeCoordinates(e, this.element);
        const deltaY = normalizeScroll(e);

        if (deltaY == 0) ; else {
          this.transform.scale(x, y, Math.exp(deltaY * ZOOM_INTENSITY));
        }
      }
    }

    gesturestart() {
      this.prevScale = 1;
    }

    gesturechange(e) {
      if (this.visualScaleCheck()) return;
      const scale = e.scale / this.prevScale;
      const { x, y } = getRelativeCoordinates(e, this.element);
      this.transform.scale(x, y, scale);
      this.prevScale = e.scale;
    }

    visualScaleCheck() {
      return window.visualViewport != null && window.visualViewport.scale > 1;
    }

    touchstart(e) {
      if (e.touches.length >= 2) {
        if (this.visualScaleCheck()) {
          return;
        }

        // Two finger gesture
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }

    touchmove(e) {
      if (e.touches.length >= 2) {
        // Two finger gesture
        if (this.visualScaleCheck()) {
          return;
        }
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    }

    touchend(e) {
      // Adapted from https://stackoverflow.com/a/32761323

      // Only trigger off of single touch events
      if (e.touches.length != 0 || e.changedTouches.length != 1) return;

      // TODO: implement
      // if (!tappedTwice) {
      //   tappedTwice = true;
      //   setTimeout(() => tappedTwice = false, DOUBLE_TAP_TIMEOUT);
      //   return false;
      // }
      e.preventDefault();

      // TODO: Zoom to scene on double-tap
      // const { x, y } = getRelativeCoordinates(e, workspaceElem);
      // zoomToScene([x, y]);
    }

    updateScrollPositions() {
      this.scrollPositions = {
        left: this.element.scrollLeft,
        top: this.element.scrollTop,
        width: this.container.scrollWidth,
        height: this.container.scrollHeight,
      };
    }
  }

  const DEFAULT_SIZE = 500;

  class ScrollZoom {
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
            this.renderedComponents[component['id']] = elem;
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
          ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
          ctx.fillRect(topLeft[0], topLeft[1], bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1]);
        }
      }
    }
  }

  return ScrollZoom;

})));
