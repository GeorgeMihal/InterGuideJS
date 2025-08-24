import { render, VNode } from 'preact';
import { html as interpolate } from 'htm/preact';
import { GuidePoint, GuideStep, Position } from './types';
import {
  clear,
  getPaddingByPlacement,
  modifyShadowContext,
  modifyzIndex,
} from './utils';

class InterGuide {
  static instance: any;
  rootContext: undefined | string = undefined;
  decorationsIds: string[] = [];
  active: { index: number; items: string[] } = { index: 0, items: [] };
  observers: MutationObserver[] = [];
  items: GuideStep[] = [];
  rects: DOMRect[] = [];

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
    this.activatePoint = this.activatePoint.bind(this);
    this.addCard = this.addCard.bind(this);
    this.addHelper = this.addHelper.bind(this);
    this.initStep = this.initStep.bind(this);
  }

  createMainDisplay() {
    let mainDisplay = document.createElement('div');
    mainDisplay.id = 'InterGuide-MainDisplay';
    mainDisplay.style.width = '100vw';
    mainDisplay.style.height = '100vh';
    mainDisplay.style.zIndex = '9000';
    mainDisplay.style.position = 'absolute';
    mainDisplay.style.top = '0px';
    mainDisplay.style.left = '0px';
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
    this.active = { index: 0, items: [] };
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    this.rects = [];
    this.initStep();
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
    this.initStep();
  }

  prevStepHandler() {
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    clear(this.items, this.active.index);
    this.active = { index: this.active.index - 1, items: [] };
    this.initStep();
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

  activatePoint(point: GuidePoint, state: boolean) {
    point.subPoints?.forEach(point => {
      modifyzIndex(point, state ? 99998 : undefined);
    });
    if (this.items[this.active.index]?.contexts) {
      this.items[this.active.index]?.contexts?.forEach((item, i) => {
        modifyzIndex(item.selector, state ? 9000 + i : undefined);
        item.hasShadow && modifyShadowContext(item.selector, state);
      });
    }
    if (point.scrollId && state) {
      document.getElementById(point.scrollId)?.scrollIntoView();
    }
    modifyzIndex(point.id, state ? 99999 : undefined);
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
    this.items[this.active.index]?.points.forEach((point, i) => {
      const observer = new MutationObserver(() => {
        const isDomReady = !!document.querySelectorAll(point.id).item(0);
        const isRequiredElementsReady =
          point.requiredElements?.every(value => {
            return !!document.querySelectorAll(value).item(0);
          }) ?? true;
        if (!this.active.items.includes(point.id)) {
          if (isDomReady && isRequiredElementsReady) {
            this.activatePoint(point, true);
            this.initPoint(point);
            this.addCard(point);
            this.addHelper(point, this.items[this.active.index], i);
            this.active = {
              ...this.active,
              items: [...this.active.items, point.id],
            };
            this.initStep();
          }
        } else {
          if (!(isDomReady && isRequiredElementsReady)) {
            this.activatePoint(point, false);
            this.active = {
              ...this.active,
              items: this.active.items.filter(value => value !== point.id),
            };
            this.initStep();
          }
        }
      });
      if (
        !this.active.items.includes(point.id) &&
        this.items.length !== this.active.index
      ) {
        const isDomReady = !!document.querySelectorAll(point.id).item(0);
        const isRequiredElementsReady =
          point.requiredElements?.every(value => {
            return !!document.querySelectorAll(value).item(0);
          }) ?? true;
        if (!isDomReady || !isRequiredElementsReady) {
          observer.observe(document.body, { childList: true, subtree: true });
          this.observers = [...this.observers, observer];
        } else {
          this.activatePoint(point, true);
          this.initPoint(point);
          this.addCard(point);
          this.addHelper(point, this.items[this.active.index], i);
          this.active = {
            ...this.active,
            items: [...this.active.items, point.id],
          };
          this.initStep();
        }
      }
    });
  }

  initPoint(point: GuidePoint /* , i: number */) {
    const mutationAction = () => {
      const rect = document.querySelector(point.id)?.getBoundingClientRect();
      if (rect) {
        this.rects = [...this.rects, rect];
      }
    };
    /* const resizeAction = () => {
      const localRect = document
        .querySelector(point.id)
        ?.getBoundingClientRect();
      if ((localRect?.top ?? -1) > 0 && localRect) {
        this.rects = [...this.rects, localRect];
      }
      this.activatePoint(point, true);
      this.addCard(point);
      this.addHelper(point, this.items[this.active.index], i);
      const activePoints = this.items[this.active.index]?.points.filter(point =>
        this.active.items.includes(point.id)
      );
      if (
        this.items[this.active.index]?.points.length - 1 === i &&
        activePoints.length === this.items[this.active.index]?.points.length &&
        !this.items[this.active.index]?.nextButton &&
        !this.items[this.active.index]?.nextStepElements
      ) {
        document
          .querySelectorAll(point.id)
          .item(0)
          .addEventListener('mouseup', this.nextStepHandler);
      }
    }; */
    //const observer = new ResizeObserver(resizeAction);
    //const bodyObserver = new ResizeObserver(resizeAction);
    const mutationObserver = new MutationObserver(mutationAction);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    //observer.observe(document.querySelectorAll(point.id).item(0));
    //bodyObserver.observe(document.body);
  }

  addCard(point: GuidePoint) {
    let wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.zIndex = '99999';
    wrapper.id = `InterGuide-Card-${point.id}`;
    render(point.card, wrapper);
    this.appendItemToContext(wrapper, this.rootContext);

    const rect = document.querySelector(point.id)?.getBoundingClientRect();
    const root = document.getElementById(this.rootContext ?? '');
    let pos = { top: 0, left: 0 };
    if (root && rect && wrapper) {
      if (point.direction === 'right') {
        pos = {
          top: rect.top + (rect.height - wrapper.clientHeight) / 2,
          left:
            rect.right +
            20 +
            Number(getPaddingByPlacement('right', point.padding)),
        };
      } else if (point.direction === 'bottomRight') {
        pos = {
          top:
            rect.bottom +
            20 +
            Number(getPaddingByPlacement('bottom', point.padding)),
          left: rect.left + rect.width / 2,
        };
      } else if (point.direction === 'topRight') {
        pos = {
          top:
            rect.top -
            wrapper.clientHeight -
            20 -
            Number(getPaddingByPlacement('top', point.padding)),
          left: rect.left + rect.width / 2,
        };
      } else if (point.direction === 'top') {
        pos = {
          top:
            rect.top -
            wrapper.clientHeight -
            20 -
            Number(getPaddingByPlacement('top', point.padding)),
          left: rect.left + (rect.width - wrapper.clientWidth) / 2,
        };
      } else if (point.direction === 'bottom') {
        pos = {
          top:
            rect.bottom +
            20 +
            Number(getPaddingByPlacement('bottom', point.padding)),
          left: rect.left + (rect.width - wrapper.clientWidth) / 2,
        };
      } else if (point.direction === 'bottomLeft') {
        pos = {
          top:
            rect.bottom +
            20 +
            Number(getPaddingByPlacement('bottom', point.padding)),
          left: rect.left + (rect.width / 2 - wrapper.clientWidth),
        };
      } else if (point.direction === 'topLeft') {
        pos = {
          top:
            rect.top -
            wrapper.clientHeight -
            20 -
            Number(getPaddingByPlacement('top', point.padding)),
          left: rect.left + (rect.width / 2 - wrapper.clientWidth),
        };
      } else if (point.direction === 'left') {
        pos = {
          top: rect.top + (rect.height - wrapper.clientHeight) / 2,
          left:
            rect.left -
            wrapper.clientWidth -
            20 -
            Number(getPaddingByPlacement('left', point.padding)),
        };
      }
    }
    wrapper.style.top = `${pos.top.toString()}px`;
    wrapper.style.left = `${pos.left.toString()}px`;
  }

  addHelper(point: GuidePoint, step: GuideStep, i: number) {
    const rootContext = this.rootContext ?? '';
    const contextId =
      step.contexts && step.contexts?.length > 0
        ? step.contexts[step.contexts?.length - 1].id ?? rootContext
        : rootContext;
    const context = document.getElementById(contextId);
    if (context) {
      const contextRect = context?.getBoundingClientRect();
      const rect = document.querySelector(point.id)?.getBoundingClientRect();
      const contextLeft =
        step.contexts && step.contexts?.length > 0 && contextRect
          ? contextRect?.left
          : 0;
      const contextTop =
        step.contexts && step.contexts?.length > 0 && contextRect
          ? contextRect?.top
          : 0;
      const pos = {
        left: rect?.left
          ? rect?.left -
            contextLeft -
            Number(getPaddingByPlacement('left', point.padding))
          : undefined,
        top: rect?.top
          ? rect?.top -
            contextTop -
            Number(getPaddingByPlacement('top', point.padding))
          : undefined,
        width: rect?.width
          ? rect?.width +
            Number(getPaddingByPlacement('right', point.padding)) +
            Number(getPaddingByPlacement('left', point.padding))
          : undefined,
        height: rect?.height
          ? rect?.height +
            Number(getPaddingByPlacement('bottom', point.padding)) +
            Number(getPaddingByPlacement('top', point.padding))
          : undefined,
      };

      console.log('posHelper', pos);

      let helper = document.createElement('div');
      helper.style.position = 'absolute';
      helper.style.zIndex = '9999';
      helper.style.opacity = '1';
      helper.id = `InterGuide-Helper-${point.id}`;
      if (point.backgroundColor) {
        helper.style.backgroundColor = point.backgroundColor;
      }
      if (pos.top) helper.style.top = `${pos.top.toString()}px`;
      if (pos.left) helper.style.left = `${pos.left.toString()}px`;
      if (pos.width) helper.style.width = `${pos.width.toString()}px`;
      if (pos.height) helper.style.height = `${pos.height.toString()}px`;
      console.log('posHelperStyle', helper.style);
      this.appendItemToContext(helper, contextId);

      let area = document.createElement('div');
      area.style.position = 'absolute';
      area.style.zIndex = '9997';
      area.style.opacity = '1';
      area.id = `InterGuide-Area-${point.id}`;
      const activePoints = this.items[this.active.index]?.points.filter(point =>
        this.active.items.includes(point.id)
      );
      if (
        (this.items[this.active.index]?.points.length - 1 === i &&
          activePoints.length ===
            this.items[this.active.index]?.points.length) ||
        (i === 0 &&
          activePoints.length !== this.items[this.active.index]?.points.length)
      ) {
        area.style.boxShadow = 'rgba(121, 121, 121, 0.25) 0px 0px 0px 5000px';
      }
      if (pos.top) area.style.top = `${pos.top.toString()}px`;
      if (pos.left) area.style.left = `${pos.left.toString()}px`;
      if (pos.width) area.style.width = `${pos.width.toString()}px`;
      if (pos.height) area.style.height = `${pos.height.toString()}px`;
      this.appendItemToContext(area, contextId);

      if (point.disable) {
        let disable = document.createElement('div');
        disable.style.position = 'absolute';
        disable.style.zIndex = '99999';
        disable.style.opacity = '1';
        disable.id = `InterGuide-Disable-${point.id}`;
        if (pos.top) disable.style.top = `${pos.top.toString()}px`;
        if (pos.left) disable.style.left = `${pos.left.toString()}px`;
        if (pos.width) disable.style.width = `${pos.width.toString()}px`;
        if (pos.height) disable.style.height = `${pos.height.toString()}px`;
        this.appendItemToContext(disable, contextId);
      }
    }
  }
}

export { InterGuide, interpolate };
