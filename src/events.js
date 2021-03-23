import { smoothify } from './closure';
import { closeEnough, clamp } from './math';
import { getRelativeCoordinates } from './dom';
import { normalizeScroll } from './normalizeScroll';

// Zoom sensitivity
const ZOOM_INTENSITY = 0.15;
const DOUBLE_TAP_TIMEOUT = 300;

function distance(pinchEvent) {
  const dx = pinchEvent.touches[0].pageX - pinchEvent.touches[1].pageX;
  const dy = pinchEvent.touches[0].pageY - pinchEvent.touches[1].pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

function center(pinchEvent) {
  return {
    pageX: (pinchEvent.touches[0].pageX + pinchEvent.touches[1].pageX) / 2,
    pageY: (pinchEvent.touches[0].pageY + pinchEvent.touches[1].pageY) / 2,
  };
}

export class Events {
  constructor(element, container, containerBounds, bounds, transform) {
    this.element = element;
    this.container = container;
    this.bounds = bounds;
    this.transform = transform;
    this.prevScale = 1;
    this.initScaleParams = null;
    this.tappedTwice = false;

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
      // [['gesturestart'], () => this.gesturestart()],
      // [['gesturechange'], (e) => this.gesturechange(e)],
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

      if (!closeEnough(left, this.element.scrollLeft)) {
        this.matrixInitiatedScroll = true;
        this.element.scrollLeft = left;
      }
      if (!closeEnough(top, this.scrollPositions.scrollTop)) {
        this.matrixInitiatedScroll = true;
        this.element.scrollTop = top;
      }
    });

    this.transform.callback = () => this.transformCallback();

    this.events.forEach(event => {
      event[0].forEach(eventType => {
        this.element.addEventListener(eventType, event[1], { passive: false });
      })
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
      })
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

  scrollTo(position) {
    this.matrixInitiatedScroll = false;
    this.element.scrollTop = position;
  }

  scaleTo(scale) {
    this.transform.scale(this.bounds.width / 2, 0, scale / this.transform.matrix[0]);
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

      if (deltaY == 0) {
        // Zoom to scene
        // TODO: implement
        // zoomToScene([x, y]);
      } else {
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
      e.stopImmediatePropagation()
      e.preventDefault();

      // Handle zooming
      if (e.touches.length == 2) {
        this.prevScale = 1;
        this.initScaleParams = {
          dist: distance(e),
          center: getRelativeCoordinates(center(e), this.element),
        }
      }
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

      // Handle zooming
      if (this.initScaleParams != null && e.touches.length == 2) {
        const scale = distance(e) / this.initScaleParams.dist;// / this.prevScale;
        const { x, y } = getRelativeCoordinates(center(e), this.element);
        this.transform.scale(x, y, scale);
        this.prevScale = scale;
      }
    }
  }

  touchend(e) {
    // Adapted from https://stackoverflow.com/a/32761323

    // Only trigger off of single touch events
    if (e.touches.length != 0 || e.changedTouches.length != 1) return;

    if (!this.tappedTwice) {
      this.tappedTwice = true;
      setTimeout(() => this.tappedTwice = false, DOUBLE_TAP_TIMEOUT);
      return false;
    }
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
