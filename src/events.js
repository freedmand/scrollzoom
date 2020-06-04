import { smoothify } from './closure';
import { closeEnough, clamp } from './math';
import { getRelativeCoordinates } from './dom';

// Zoom sensitivity
const ZOOM_INTENSITY = 0.007;
const DOUBLE_TAP_TIMEOUT = 300;

export class Events {
  constructor(element, container, containerBounds, bounds, transform) {
    this.element = element;
    this.container = container;
    this.bounds = bounds;
    this.transform = transform;

    this.updateScrollPositions();

    // The transform bounds
    // Only updated when internal contents are added
    this.containerWidth = containerBounds[0];
    this.containerHeight = containerBounds[1];
    this.transform.bounds = [this.containerWidth, this.containerHeight];

    this.matrixInitiatedScroll = false;
    this.scrollInitiated = false;

    this.events = [
      [['scroll'], () => this.scroll()],
      [['wheel'], (e) => this.wheel(e)]
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
      })
    });
  }

  transformCallback() {
    // Set child height / width
    const topLeft = this.transform.project([0, 0]);
    const bottomRight = this.transform.project([this.containerWidth, this.containerHeight]);
    const width = bottomRight[0] - topLeft[0];
    const height = bottomRight[1] - topLeft[1];
    this.setContainer(width, height, -topLeft[0], -topLeft[1], this.scrollInitiatedTransform);
    this.scrollInitiatedTransform = false;
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

  updateTransformPositions() {
    const topPerc = this.scrollPositions.top / this.scrollPositions.height;
    const heightPerc = this.bounds.height / this.scrollPositions.height;
    const leftPerc = this.scrollPositions.left / this.scrollPositions.width;
    const widthPerc = this.bounds.width / this.scrollPositions.width;

    this.transform.runCallback = false;
    this.transform.fitPercents(leftPerc, topPerc, widthPerc, heightPerc, this.containerWidth, this.containerHeight);
    this.transform.runCallback = true;
  }

  wheel(e) {
    if (e.ctrlKey) {
      // Zoom
      e.preventDefault();

      let { x, y } = getRelativeCoordinates(e, this.element);
      // TODO: normalize
      const { deltaX, deltaY } = e;

      if (deltaX == 0 && deltaY == 0) {
        // Zoom to scene
        // TODO: implement
        // zoomToScene([x, y]);
      } else {
        this.transform.scale(x, y, Math.exp(-deltaY * ZOOM_INTENSITY));
      }
    }
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
