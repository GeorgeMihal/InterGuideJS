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
  private rootContext: undefined | string = undefined;
  private decorationsIds: string[] = [];
  private active: { index: number; items: string[] } = { index: 0, items: [] };
  private observers: MutationObserver[] = [];
  private items: GuideStep[] = [];
  private finalItem?: {
    value: (cancel: () => void) => VNode;
    position: Position;
  } = undefined;
  private loadingItem?: {
    value: VNode;
    position: Position;
  } = undefined;

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
    this.getPointsCount = this.getPointsCount.bind(this);
    this.activatePoint = this.activatePoint.bind(this);
    this.addCard = this.addCard.bind(this);
    this.replaceCard = this.replaceCard.bind(this);
    this.addShadowArea = this.addShadowArea.bind(this);
    this.addHelper = this.addHelper.bind(this);
    this.initStep = this.initStep.bind(this);
    this.createFinalWindow = this.createFinalWindow.bind(this);
    this.activateFinalWindow = this.activateFinalWindow.bind(this);
    this.createLoadingWindow = this.createLoadingWindow.bind(this);
    this.activateLoadingWindow = this.activateLoadingWindow.bind(this);
  }

  private createMainDisplay() {
    let mainDisplay = document.createElement('div');
    mainDisplay.id = 'InterGuide-MainDisplay';
    mainDisplay.style.width = '100vw';
    mainDisplay.style.height = '100vh';
    mainDisplay.style.zIndex = '90000';
    mainDisplay.style.position = 'absolute';
    mainDisplay.style.top = '0px';
    mainDisplay.style.left = '0px';
    return mainDisplay;
  }

  createLoadingWindow(value: VNode, position: Position) {
    this.loadingItem = { value, position };
  }

  createFinalWindow(value: (cancel: () => void) => VNode, position: Position) {
    this.finalItem = { value, position };
  }

  private activateFinalWindow() {
    const { value, position } = this.finalItem ?? {};
    if (position && value) {
      let wrapper = document.createElement('div');
      wrapper.id = 'InterGuide-FinalElement';
      wrapper.style.position = 'absolute';
      wrapper.style.zIndex = '96000';
      wrapper.style.boxShadow = 'rgba(121, 121, 121, 0.25) 0px 0px 0px 5000px';
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
      render(value(this.deactivateGuide), wrapper);
      this.appendItemToContext(wrapper, this.rootContext);
    }
  }

  private activateLoadingWindow() {
    const { value, position } = this.loadingItem ?? {};
    if (position && value) {
      let wrapper = document.createElement('div');
      wrapper.id = 'InterGuide-LoadingElement';
      wrapper.style.position = 'absolute';
      wrapper.style.zIndex = '96000';
      wrapper.style.boxShadow = 'rgba(121, 121, 121, 0.25) 0px 0px 0px 5000px';
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
  }

  private appendItemToContext(item: HTMLDivElement, context?: string) {
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
    this.initStep();
  }

  deactivateGuide() {
    if (this.active.index !== this.items.length) {
      clear(this.items, this.active.index);
    }
    document.getElementById('InterGuide-MainDisplay')?.remove();
    document.getElementById('InterGuide-FinalElement')?.remove();
    this.decorationsIds.forEach(id => document.getElementById(id)?.remove());
    this.decorationsIds = [];
    this.items = [];
    this.observers = [];
    this.active = { index: 0, items: [] };
  }

  private nextStepHandler() {
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    clear(this.items, this.active.index);
    this.active = { index: this.active.index + 1, items: [] };
    if (this.active.index !== this.items.length) {
      this.activateLoadingWindow();
    }
    this.initStep();
    if (this.active.index === this.items.length) {
      this.activateFinalWindow();
    }
  }

  private prevStepHandler() {
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    clear(this.items, this.active.index);
    this.active = { index: this.active.index - 1, items: [] };
    this.initStep();
  }

  private getPointNumber(pointIndex: number) {
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

  private getPointsCount() {
    return this.items.map(value => value.points.length).reduce((a, b) => a + b);
  }

  setRootContext(value: string) {
    this.rootContext = value;
  }

  addDecoration(value: VNode, position: Position, id: string) {
    this.decorationsIds = [...this.decorationsIds, id];
    let wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.style.position = 'absolute';
    wrapper.style.zIndex = '96000';
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

  private activatePoint(point: GuidePoint, state: boolean) {
    point.subPoints?.forEach(point => {
      modifyzIndex(point, state ? 93000 : undefined);
    });
    if (!state) {
      if (point.disable) {
        document.getElementById(`InterGuide-Disable-${point.id}`)?.remove();
      }
      document.getElementById(`InterGuide-Helper-${point.id}`)?.remove();
      document.getElementById(`InterGuide-Area-${point.id}`)?.remove();
      document.getElementById(`InterGuide-Card-${point.id}`)?.remove();
    }
    if (this.items[this.active.index]?.contexts) {
      this.items[this.active.index]?.contexts?.forEach((item, i) => {
        modifyzIndex(item.selector, state ? 90000 + i : undefined);
        item.hasShadow && modifyShadowContext(item.selector, state);
      });
    }
    if (point.scrollId && state) {
      document.getElementById(point.scrollId)?.scrollIntoView();
    }
    modifyzIndex(point.id, state ? 94000 : undefined);
  }

  private initStep() {
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
            this.active = {
              ...this.active,
              items: [...this.active.items, point.id],
            };
            if (this.active.items.length === 1) {
              document.getElementById('InterGuide-LoadingElement')?.remove();
            }
            this.activatePoint(point, true);
            this.initPoint(point, this.items[this.active.index], i);
            this.addCard(point, i);
            this.addHelper(point, this.items[this.active.index]);
            this.initStep();
          }
        } else {
          if (!(isDomReady && isRequiredElementsReady)) {
            this.active = {
              ...this.active,
              items: this.active.items.filter(value => value !== point.id),
            };
            this.activatePoint(point, false);
            this.initStep();
          }
        }
        this.items[this.active.index]?.points.forEach((point, i) => {
          this.addShadowArea(point, i);
        });
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
          this.active = {
            ...this.active,
            items: [...this.active.items, point.id],
          };
          if (this.active.items.length === 1) {
            document.getElementById('InterGuide-LoadingElement')?.remove();
          }
          this.activatePoint(point, true);
          this.initPoint(point, this.items[this.active.index], i);
          this.addCard(point, i);
          this.addHelper(point, this.items[this.active.index]);
          this.initStep();
        }
      }
    });
    this.items[this.active.index]?.points.forEach((point, i) => {
      this.addShadowArea(point, i);
    });
  }

  private addShadowArea(point: GuidePoint, i: number) {
    const area: any = document.getElementById(`InterGuide-Area-${point.id}`);
    const activePoints = this.items[this.active.index]?.points.filter(point =>
      this.active.items.includes(point.id)
    );
    if (
      (this.items[this.active.index]?.points.length - 1 === i &&
        activePoints.length === this.items[this.active.index]?.points.length) ||
      (i === 0 &&
        activePoints.length !== this.items[this.active.index]?.points.length)
    ) {
      area.style.boxShadow = 'rgba(121, 121, 121, 0.25) 0px 0px 0px 5000px';
    } else {
      area.style.boxShadow = null;
    }
  }

  private initPoint(point: GuidePoint, step: GuideStep, i: number) {
    const mutationAction = () => {
      this.replaceHelper(`InterGuide-Helper-${point.id}`, step, point);
      this.replaceHelper(`InterGuide-Area-${point.id}`, step, point);
      if (point.disable) {
        this.replaceHelper(`InterGuide-Disable-${point.id}`, step, point);
      }
      this.replaceCard(point);
    };
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
    const resizeAction = () => {
      this.replaceHelper(`InterGuide-Helper-${point.id}`, step, point);
      this.replaceHelper(`InterGuide-Area-${point.id}`, step, point);
      if (point.disable) {
        this.replaceHelper(`InterGuide-Disable-${point.id}`, step, point);
      }
      this.replaceCard(point);
    };
    const observer = new ResizeObserver(resizeAction);
    const bodyObserver = new ResizeObserver(resizeAction);
    const mutationObserver = new MutationObserver(mutationAction);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    observer.observe(document.querySelectorAll(point.id).item(0));
    bodyObserver.observe(document.body);
  }

  private replaceCard(point: GuidePoint) {
    const wrapper: any = document.getElementById(`InterGuide-Card-${point.id}`);
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
      wrapper.style.top = `${pos.top.toString()}px`;
      wrapper.style.left = `${pos.left.toString()}px`;
    }
  }

  private replaceHelper(id: string, step: GuideStep, point: GuidePoint) {
    const helper: any = document.getElementById(id);
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

      if (helper) {
        if (pos.top) helper.style.top = `${pos.top.toString()}px`;
        if (pos.left) helper.style.left = `${pos.left.toString()}px`;
        if (pos.width) helper.style.width = `${pos.width.toString()}px`;
        if (pos.height) helper.style.height = `${pos.height.toString()}px`;
      }
    }
  }

  private addCard(point: GuidePoint, i: number) {
    let wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.zIndex = '96000';
    wrapper.id = `InterGuide-Card-${point.id}`;

    const isNextButton = this.items[this.active.index]?.nextButton;
    const isPrevButton =
      this.active.index !== 0
        ? this.items[this.active.index - 1]?.nextButton
        : false;
    render(
      point.card({
        pointNumber: this.getPointNumber(i),
        pointsCount: this.getPointsCount(),
        prev: isPrevButton ? this.prevStepHandler : undefined,
        next: isNextButton ? this.nextStepHandler : undefined,
      }),
      wrapper
    );
    this.appendItemToContext(wrapper, this.rootContext);
    this.replaceCard(point);
  }

  private addHelper(point: GuidePoint, step: GuideStep) {
    const rootContext = this.rootContext ?? '';
    const contextId =
      step.contexts && step.contexts?.length > 0
        ? step.contexts[step.contexts?.length - 1].id ?? rootContext
        : rootContext;

    const contextItems = step.contexts?.map(item => item.id ?? rootContext) ?? [
      rootContext,
    ];

    let helper = document.createElement('div');
    helper.style.position = 'absolute';
    helper.style.zIndex = '92000';
    helper.style.opacity = '1';
    helper.id = `InterGuide-Helper-${point.id}`;
    if (point.backgroundColor) {
      helper.style.backgroundColor = point.backgroundColor;
    }
    this.replaceHelper(`InterGuide-Helper-${point.id}`, step, point);
    this.appendItemToContext(helper, contextId);

    let area = document.createElement('div');
    area.style.position = 'absolute';
    area.style.zIndex = '91000';
    area.style.opacity = '1';
    area.id = `InterGuide-Area-${point.id}`;
    this.replaceHelper(`InterGuide-Area-${point.id}`, step, point);
    this.appendItemToContext(area, contextId);

    contextItems.forEach((item) => {
      let context = document.createElement('div');
      context.style.position = 'absolute';
      context.style.zIndex = '90000';
      context.style.top = '0px';
      context.style.left = '0px';
      context.style.width = '100%';
      context.style.height = '100%';
      context.style.opacity = '1';
      context.id = `InterGuide-Context-${point.id}`;
      this.appendItemToContext(context, item);
    });

    if (point.disable) {
      let disable = document.createElement('div');
      disable.style.position = 'absolute';
      disable.style.zIndex = '95000';
      disable.style.opacity = '1';
      disable.id = `InterGuide-Disable-${point.id}`;
      this.replaceHelper(`InterGuide-Disable-${point.id}`, step, point);
      this.appendItemToContext(disable, contextId);
    }
  }
}

export { InterGuide, interpolate };
