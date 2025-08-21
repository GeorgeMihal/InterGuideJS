import { render, VNode } from 'preact';
import { html as interpolate } from 'htm/preact';
import { GuideStep, Position } from './types';
import { clear, modifyShadowContext, modifyzIndex } from './utils';

class InterGuide {
  static instance: any;
  rootContext: undefined | string = undefined;
  decorationsIds: string[] = [];
  active: { index: number; items: string[] } = { index: 0, items: [] };
  observers: MutationObserver[] = [];
  items: GuideStep[] = [];

  constructor() {
    if (InterGuide.instance) {
      return InterGuide.instance;
    }

    InterGuide.instance = this;

    this.activateGuide = this.activateGuide.bind(this);
    this.deactivateGuide = this.deactivateGuide.bind(this);
    this.setRootContext = this.setRootContext.bind(this);
    this.appendItemToContext = this.appendItemToContext.bind(this);
    this.createMainDisplay = this.createMainDisplay.bind(this);
    this.addDecoration = this.addDecoration.bind(this);
    this.nextStepHandler = this.nextStepHandler.bind(this);
    this.prevStepHandler = this.prevStepHandler.bind(this);
    this.getPointNumber = this.getPointNumber.bind(this);
  }

  createMainDisplay() {
    let mainDisplay = document.createElement('div');
    mainDisplay.id = 'InterGuide-MainDisplay';
    mainDisplay.style.width = '100vw';
    mainDisplay.style.height = '100vh';
    mainDisplay.style.zIndex = '9000';
    mainDisplay.style.position = 'absolute';
    mainDisplay.style.top = '0';
    mainDisplay.style.left = '0';
    return mainDisplay;
  }

  appendItemToContext(item: HTMLDivElement, context?: string) {
    if (typeof context === 'undefined') {
      document.body.append(item);
    } else {
      let root = document.getElementById(context);
      root?.append(item);
    }
  }

  activateGuide(items: GuideStep[]) {
    this.appendItemToContext(this.createMainDisplay(), this.rootContext);
    this.items = items;
  }

  deactivateGuide() {
    if (this.active.index !== this.items.length) {
      clear(this.items, this.active.index);
    }
    document.getElementById('InterGuide-MainDisplay')?.remove();
    this.decorationsIds.forEach(id => document.getElementById(id)?.remove());
    this.decorationsIds = [];
    this.items = [];
    this.observers = [];
    this.active = { index: 0, items: [] };
  }

  nextStepHandler() {
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    clear(this.items, this.active.index);
    this.active = { index: this.active.index + 1, items: [] };
  }

  prevStepHandler() {
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    clear(this.items, this.active.index);
    this.active = { index: this.active.index - 1, items: [] };
  }

  getPointNumber(pointIndex: number) {
    return this.items
      .map((value, i) =>
        this.active.index > i
          ? value.points.length
          : this.active.index < i
          ? 0
          : pointIndex + 1
      )
      .reduce((a, b) => a + b);
  }

  setRootContext(value: string) {
    this.rootContext = value;
  }

  addDecoration(value: VNode, position: Position, id: string) {
    this.decorationsIds = [...this.decorationsIds, id];
    let wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.style.position = 'absolute';
    wrapper.style.zIndex = '9998';
    if (typeof position.bottom !== 'undefined') {
      wrapper.style.bottom = position.bottom;
    }
    if (typeof position.top !== 'undefined') {
      wrapper.style.top = position.top;
    }
    if (typeof position.right !== 'undefined') {
      wrapper.style.right = position.right;
    }
    if (typeof position.left !== 'undefined') {
      wrapper.style.left = position.left;
    }
    render(value, wrapper);
    this.appendItemToContext(wrapper, this.rootContext);
  }

  initStep() {
    if (this.items[this.active.index]?.nextStepElements) {
      const nextStepObserver = new MutationObserver(() => {
        const isNextElementsReady =
          this.items[this.active.index].nextStepElements?.every(value => {
            return !!document.querySelectorAll(value).item(0);
          }) ?? true;
        if (isNextElementsReady) {
          this.nextStepHandler();
        }
      });
      nextStepObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
      this.observers = [...this.observers, nextStepObserver];
    }
    this.items[this.active.index]?.points.forEach(point => {
      const observer = new MutationObserver(() => {
        const isDomReady = !!document.querySelectorAll(point.id).item(0);
        const isRequiredElementsReady =
          point.requiredElements?.every(value => {
            return !!document.querySelectorAll(value).item(0);
          }) ?? true;
        if (!this.active.items.includes(point.id)) {
          if (isDomReady && isRequiredElementsReady) {
            point.subPoints?.forEach(point => {
              modifyzIndex(point, 99998);
            });
            if (this.items[this.active.index]?.contexts) {
              this.items[this.active.index]?.contexts?.forEach((item, i) => {
                modifyzIndex(item.selector, 9000 + i);
                item.hasShadow && modifyShadowContext(item.selector, true);
              });
            }
            if (point.scrollId) {
              document.getElementById(point.scrollId)?.scrollIntoView();
            }
            modifyzIndex(point.id, 99999);
            this.active = {
              ...this.active,
              items: [...this.active.items, point.id],
            };
          }
        } else {
          if (!(isDomReady && isRequiredElementsReady)) {
            point.subPoints?.forEach(point => {
              modifyzIndex(point);
            });
            if (this.items[this.active.index]?.contexts) {
              this.items[this.active.index]?.contexts?.forEach(item => {
                modifyzIndex(item.selector);
                item.hasShadow && modifyShadowContext(item.selector, false);
              });
            }
            modifyzIndex(point.id);
            this.active = {
              ...this.active,
              items: this.active.items.filter(value => value !== point.id),
            };
          }
        }
      });
    });
  }
}

export { InterGuide, interpolate };
