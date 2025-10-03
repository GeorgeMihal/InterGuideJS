import { render, VNode } from 'preact';
import { html as interpolate } from 'htm/preact';
import { Guide, GuidePoint, GuideStep, Position } from './types';
import './index.css';
import {
  getPaddingByPlacement,
  modifyzIndex,
  shadowColor,
  shadowSize,
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
    this.updateCard = this.updateCard.bind(this);
    this.replaceCard = this.replaceCard.bind(this);
    this.addShadowArea = this.addShadowArea.bind(this);
    this.addHelper = this.addHelper.bind(this);
    this.addContexts = this.addContexts.bind(this);
    this.initStep = this.initStep.bind(this);
    this.clear = this.clear.bind(this);
    this.createFinalWindow = this.createFinalWindow.bind(this);
    this.activateFinalWindow = this.activateFinalWindow.bind(this);
    this.createLoadingWindow = this.createLoadingWindow.bind(this);
    this.activateLoadingWindow = this.activateLoadingWindow.bind(this);
  }

  activateGuide(guide: Guide) {
    this.setRootContext(guide.rootContext ?? 'root');
    this.appendItemToContext(
      this.createMainDisplay(),
      `[id=${this.rootContext}]`
    );
    if (guide.loadingElement) {
      this.createLoadingWindow(
        guide.loadingElement.element(),
        guide.loadingElement.position
      );
    }
    if (guide.finalElement) {
      this.createFinalWindow(
        guide.finalElement.element,
        guide.finalElement.position
      );
    }
    if (guide.deactivateElement) {
      this.addDecoration(
        guide.deactivateElement.element(this.deactivateGuide),
        guide.deactivateElement.position,
        'InterGuide-CancelElement'
      );
    }
    if (guide.decorations) {
      guide.decorations.forEach(decoration => {
        this.addDecoration(
          decoration.element(),
          decoration.position,
          'InterGuide-CancelElement'
        );
      });
    }

    this.items = guide.steps;
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    this.active = { index: 0, items: [] };
    this.initStep();
  }

  deactivateGuide() {
    document.getElementById('InterGuide-MainDisplay')?.remove();
    document.getElementById('InterGuide-FinalElement')?.remove();
    document.getElementById('InterGuide-LoadingElement')?.remove();
    this.decorationsIds.forEach(id => document.getElementById(id)?.remove());
    this.decorationsIds = [];
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    if (this.active.index !== this.items.length) {
      this.clear(true);
    }
    this.items = [];
    this.active = { index: 0, items: [] };
  }

  private createLoadingWindow(value: VNode, position: Position) {
    this.loadingItem = { value, position };
  }

  private createFinalWindow(
    value: (cancel: () => void) => VNode,
    position: Position
  ) {
    this.finalItem = { value, position };
  }

  private setRootContext(value: string) {
    this.rootContext = value;
  }

  private addDecoration(value: VNode, position: Position, id: string) {
    this.decorationsIds = [...this.decorationsIds, id];
    let wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = 'interguide-js-decoration';
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
    this.appendItemToContext(wrapper, `[id=${this.rootContext}]`);
  }

  private createMainDisplay() {
    let mainDisplay = document.createElement('div');
    mainDisplay.id = 'InterGuide-MainDisplay';
    mainDisplay.className = 'interguide-js-main-display';
    return mainDisplay;
  }

  private activateFinalWindow() {
    const { value, position } = this.finalItem ?? {};
    if (position && value) {
      let wrapper = document.createElement('div');
      wrapper.id = 'InterGuide-FinalElement';
      wrapper.className = 'interguide-js-decoration';
      wrapper.style.boxShadow = `${shadowColor} ${shadowSize}`;
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
      this.appendItemToContext(wrapper, `[id=${this.rootContext}]`);
    }
  }

  private activateLoadingWindow() {
    const { value, position } = this.loadingItem ?? {};
    if (position && value) {
      let wrapper = document.createElement('div');
      wrapper.id = 'InterGuide-LoadingElement';
      wrapper.className = 'interguide-js-decoration';
      wrapper.style.boxShadow = `${shadowColor} ${shadowSize}`;
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
      this.appendItemToContext(wrapper, `[id=${this.rootContext}]`);
    }
  }

  private appendItemToContext(item: HTMLDivElement, context?: string) {
    if (typeof context === 'undefined') {
      document.body.append(item);
    } else {
      let root = document.querySelector(context);
      root?.append(item);
    }
  }

  private nextStepHandler() {
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    this.clear();
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
    this.clear();
    this.active = { index: this.active.index - 1, items: [] };
    this.initStep();
  }

  private getPointNumber(pointIndex: number) {
    return this.items?.length
      ? this.items
          ?.map((value, i) =>
            this.active.index > i
              ? value.points.length
              : this.active.index < i
              ? 0
              : pointIndex + 1
          )
          ?.reduce((a, b) => a + b)
      : 0;
  }

  private getPointsCount() {
    return this.items?.length
      ? this.items.map(value => value.points.length).reduce((a, b) => a + b)
      : 0;
  }

  private activatePoint(point: GuidePoint, i: number, state: boolean) {
    point.subPoints?.forEach(point => {
      modifyzIndex(point, state ? 93000 : undefined);
    });
    if (!state) {
      if (point.disable) {
        document
          .getElementById(`InterGuide-Disable-${point.selector}`)
          ?.remove();
      }
      document.getElementById(`InterGuide-Helper-${point.selector}`)?.remove();
      document.getElementById(`InterGuide-Area-${point.selector}`)?.remove();
      document.getElementById(`InterGuide-Card-${point.selector}`)?.remove();
      if (
        this.items[this.active.index].points.length - 1 !== i ||
        this.items.length - 1 === this.active.index
      ) {
        document.getElementById(`InterGuide-Card-${point.selector}`)?.remove();
      }
    }
    if (this.items[this.active.index]?.contexts) {
      this.items[this.active.index]?.contexts?.forEach((item, i) => {
        modifyzIndex(item.selector, state ? 90000 + i : undefined);
      });
    }
    if (point.scroll && state) {
      const { selector, behavior, block, inline } = point.scroll;
      document
        .querySelector(selector)
        ?.scrollIntoView({ behavior: behavior, block: block, inline: inline });
    }
    modifyzIndex(point.selector, state ? 94000 : undefined);
  }

  private initStep() {
    if (this.items[this.active.index]?.nextStepElements) {
      const nextStepObserver = new MutationObserver(() => {
        const isNextElementsReady =
          this.items[this.active.index].nextStepElements?.every(value => {
            return !!document.querySelector(value);
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
        const isDomReady = !!document.querySelector(point.selector);
        const isRequiredElementsReady =
          point.requiredElements?.every(value => {
            return !!document.querySelector(value);
          }) ?? true;
        if (!this.active.items.includes(point.selector)) {
          if (isDomReady && isRequiredElementsReady) {
            this.active = {
              ...this.active,
              items: [...this.active.items, point.selector],
            };
            if (this.active.items.length === 1) {
              document.getElementById('InterGuide-LoadingElement')?.remove();
            }
            this.activatePoint(point, i, true);
            this.initPoint(point, this.items[this.active.index], i);
            if (this.active.index === 0 || i !== 0) {
              this.addCard(point, i);
            } else {
              this.updateCard(point);
            }
            this.addContexts();
            this.addHelper(point, this.items[this.active.index]);
            this.initStep();
          }
        } else {
          if (!(isDomReady && isRequiredElementsReady)) {
            this.active = {
              ...this.active,
              items: this.active.items.filter(
                value => value !== point.selector
              ),
            };
            this.activatePoint(point, i, false);
            this.initStep();
          }
        }
        this.items[this.active.index]?.points.forEach((point, i) => {
          this.addShadowArea(point, i);
        });
      });
      if (
        !this.active.items.includes(point.selector) &&
        this.items.length !== this.active.index
      ) {
        const isDomReady = !!document.querySelector(point.selector);
        const isRequiredElementsReady =
          point.requiredElements?.every(value => {
            return !!document.querySelector(value);
          }) ?? true;
        if (!isDomReady || !isRequiredElementsReady) {
          observer.observe(document.body, { childList: true, subtree: true });
          this.observers = [...this.observers, observer];
        } else {
          this.active = {
            ...this.active,
            items: [...this.active.items, point.selector],
          };
          if (this.active.items.length === 1) {
            document.getElementById('InterGuide-LoadingElement')?.remove();
          }
          this.activatePoint(point, i, true);
          this.initPoint(point, this.items[this.active.index], i);
          if (this.active.index === 0 || i !== 0) {
            this.addCard(point, i);
          } else {
            this.updateCard(point);
          }
          this.addContexts();
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
    const area: any = document.getElementById(
      `InterGuide-Area-${point.selector}`
    );
    const activePoints = this.items[this.active.index]?.points.filter(point =>
      this.active.items.includes(point.selector)
    );
    if (area) {
      if (
        (this.items[this.active.index]?.points.length - 1 === i &&
          activePoints.length ===
            this.items[this.active.index]?.points.length) ||
        (i === 0 &&
          activePoints.length !== this.items[this.active.index]?.points.length)
      ) {
        area.style.boxShadow = `${this.items[this.active.index]?.shadowColor ??
          shadowColor} ${shadowSize}`;
      } else {
        area.style.boxShadow = null;
      }
    }
  }

  private initPoint(point: GuidePoint, step: GuideStep, i: number) {
    const action = () => {
      this.replaceHelper(`InterGuide-Helper-${point.selector}`, step, point);
      this.replaceHelper(`InterGuide-Area-${point.selector}`, step, point);
      if (point.disable) {
        this.replaceHelper(`InterGuide-Disable-${point.selector}`, step, point);
      }
      this.replaceCard(point);
    };
    const activePoints = this.items[this.active.index]?.points.filter(point =>
      this.active.items.includes(point.selector)
    );
    if (
      this.items[this.active.index]?.points.length - 1 === i &&
      activePoints.length === this.items[this.active.index]?.points.length &&
      !this.items[this.active.index]?.nextButton &&
      !this.items[this.active.index]?.nextStepElements
    ) {
      document
        .querySelector(point.selector)
        ?.addEventListener('click', this.nextStepHandler, { once: true });
    }

    const observer = new ResizeObserver(action);
    const bodyObserver = new ResizeObserver(action);
    const mutationObserver = new MutationObserver(action);
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    const element = document.querySelector(point.selector);
    if (element) {
      observer.observe(element);
    }
    bodyObserver.observe(document.body);
  }

  private replaceCard(point: GuidePoint) {
    const wrapper: any = document.getElementById(
      `InterGuide-Card-${point.selector}`
    );
    const rect = document
      .querySelector(point.selector)
      ?.getBoundingClientRect();
    const root = document.getElementById(this.rootContext ?? '');

    let pos = { top: 0, left: 0 };
    if (root && rect && wrapper) {
      if (point.direction === 'right') {
        pos = {
          top: rect.top + (rect.height - wrapper.clientHeight) / 2,
          left:
            rect.right +
            20 +
            Number(getPaddingByPlacement('right', point.style?.padding)),
        };
      } else if (point.direction === 'bottomRight') {
        pos = {
          top:
            rect.bottom +
            20 +
            Number(getPaddingByPlacement('bottom', point.style?.padding)),
          left: rect.left + rect.width / 2,
        };
      } else if (point.direction === 'topRight') {
        pos = {
          top:
            rect.top -
            wrapper.clientHeight -
            20 -
            Number(getPaddingByPlacement('top', point.style?.padding)),
          left: rect.left + rect.width / 2,
        };
      } else if (point.direction === 'top') {
        pos = {
          top:
            rect.top -
            wrapper.clientHeight -
            20 -
            Number(getPaddingByPlacement('top', point.style?.padding)),
          left: rect.left + (rect.width - wrapper.clientWidth) / 2,
        };
      } else if (point.direction === 'bottom') {
        pos = {
          top:
            rect.bottom +
            20 +
            Number(getPaddingByPlacement('bottom', point.style?.padding)),
          left: rect.left + (rect.width - wrapper.clientWidth) / 2,
        };
      } else if (point.direction === 'bottomLeft') {
        pos = {
          top:
            rect.bottom +
            20 +
            Number(getPaddingByPlacement('bottom', point.style?.padding)),
          left: rect.left + (rect.width / 2 - wrapper.clientWidth),
        };
      } else if (point.direction === 'topLeft') {
        pos = {
          top:
            rect.top -
            wrapper.clientHeight -
            20 -
            Number(getPaddingByPlacement('top', point.style?.padding)),
          left: rect.left + (rect.width / 2 - wrapper.clientWidth),
        };
      } else if (point.direction === 'left') {
        pos = {
          top: rect.top + (rect.height - wrapper.clientHeight) / 2,
          left:
            rect.left -
            wrapper.clientWidth -
            20 -
            Number(getPaddingByPlacement('left', point.style?.padding)),
        };
      }
      wrapper.style.top = `${pos.top.toString()}px`;
      wrapper.style.left = `${pos.left.toString()}px`;
    }
  }

  private replaceHelper(id: string, step: GuideStep, point: GuidePoint) {
    const helper: any = document.getElementById(id);
    const rootContext = this.rootContext ?? '';
    if (step) {
      const contextSelector =
        step.contexts && step.contexts?.length > 0
          ? step.contexts[step.contexts?.length - 1].selector ??
            `[id=${rootContext}]`
          : `[id=${rootContext}]`;
      const context = document.querySelector(contextSelector);

      if (context) {
        const contextRect = context?.getBoundingClientRect();

        const rect = document
          .querySelector(point.selector)
          ?.getBoundingClientRect();
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
              Number(getPaddingByPlacement('left', point.style?.padding))
            : undefined,
          top: rect?.top
            ? rect?.top -
              contextTop -
              Number(getPaddingByPlacement('top', point.style?.padding))
            : undefined,
          width: rect?.width
            ? rect?.width +
              Number(getPaddingByPlacement('right', point.style?.padding)) +
              Number(getPaddingByPlacement('left', point.style?.padding))
            : undefined,
          height: rect?.height
            ? rect?.height +
              Number(getPaddingByPlacement('bottom', point.style?.padding)) +
              Number(getPaddingByPlacement('top', point.style?.padding))
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
  }

  private addCard(point: GuidePoint, i: number) {
    let wrapper = document.createElement('div');
    wrapper.className = 'interguide-js-card';
    wrapper.id = `InterGuide-Card-${point.selector}`;

    const isNextButton = this.items[this.active.index]?.nextButton;
    const isPrevButton =
      this.active.index !== 0
        ? this.items[this.active.index - 1]?.nextButton
        : false;
    render(
      point.card({
        pointNumber: this.getPointNumber(i),
        pointsCount: this.getPointsCount(),
        pointsCountInStep: this.items[this.active.index].points.length,
        pointNumberInStep: i + 1,
        stepNumber: this.active.index + 1,
        stepsCount: this.items.length,
        prev: isPrevButton ? this.prevStepHandler : undefined,
        next: isNextButton ? this.nextStepHandler : undefined,
        deactivate: this.deactivateGuide,
      }),
      wrapper
    );
    this.appendItemToContext(wrapper, `[id=${this.rootContext}]`);
    this.replaceCard(point);
  }

  private updateCard(point: GuidePoint) {
    const prevItem = this.items[this.active.index - 1];
    let card = document.getElementById(
      `InterGuide-Card-${prevItem.points[prevItem.points.length - 1].selector}`
    );
    if (card) {
      card.id = `InterGuide-Card-${point.selector}`;
      const isNextButton = this.items[this.active.index]?.nextButton;
      const isPrevButton =
        this.active.index !== 0
          ? this.items[this.active.index - 1]?.nextButton
          : false;
      render(
        point.card({
          pointNumber: this.getPointNumber(0),
          pointsCount: this.getPointsCount(),
          pointsCountInStep: this.items[this.active.index].points.length,
          pointNumberInStep: 1,
          stepNumber: this.active.index + 1,
          stepsCount: this.items.length,
          prev: isPrevButton ? this.prevStepHandler : undefined,
          next: isNextButton ? this.nextStepHandler : undefined,
          deactivate: this.deactivateGuide,
        }),
        card
      );
    }
    this.replaceCard(point);
  }

  private addHelper(point: GuidePoint, step: GuideStep) {
    const rootContext = this.rootContext ?? '';
    if (step) {
      const contextSelector =
        step.contexts && step.contexts?.length > 0
          ? step.contexts[step.contexts?.length - 1].selector ??
            `[id=${rootContext}]`
          : `[id=${rootContext}]`;

      let helper = document.createElement('div');
      helper.className = 'interguide-js-helper';
      helper.id = `InterGuide-Helper-${point.selector}`;
      if (point.style?.backgroundColor) {
        helper.style.backgroundColor = point.style.backgroundColor;
      }
      this.replaceHelper(`InterGuide-Helper-${point.selector}`, step, point);
      this.appendItemToContext(helper, contextSelector);

      let area = document.createElement('div');
      area.className = 'interguide-js-area';
      area.id = `InterGuide-Area-${point.selector}`;
      if (point.style?.backgroundColor) {
        area.style.backgroundColor = point.style.backgroundColor;
      }
      this.replaceHelper(`InterGuide-Area-${point.selector}`, step, point);
      this.appendItemToContext(area, contextSelector);

      if (point.disable) {
        let disable = document.createElement('div');
        disable.className = 'interguide-js-disable';
        disable.id = `InterGuide-Disable-${point.selector}`;
        this.replaceHelper(`InterGuide-Disable-${point.selector}`, step, point);
        this.appendItemToContext(disable, contextSelector);
      }
    }
  }

  private addContexts() {
    const rootContext = this.rootContext ?? '';

    const contextItems =
      this.items[this.active.index]?.contexts?.map(
        item => item.selector ?? `[id=${rootContext}]`
      ) ?? [];

    contextItems?.forEach(item => {
      if (!document.getElementById(`InterGuide-Context-${item}`)) {
        let context = document.createElement('div');
        context.className = 'interguide-js-context';
        context.id = `InterGuide-Context-${item}`;
        this.appendItemToContext(context, item);
      }
    });
  }

  private clear(isDeactivate?: boolean) {
    const rootContext = this.rootContext ?? '';
    const index = this.active.index;
    const contextItems =
      this.items[index].contexts?.map(
        item => item.selector ?? `[id=${rootContext}]`
      ) ?? [];

    contextItems.forEach(item => {
      document.getElementById(`InterGuide-Context-${item}`)?.remove();
    });
    if (isDeactivate && index !== 0) {
      const lastPoint = this.items[index - 1].points[
        this.items[index - 1].points.length - 1
      ];
      document
        .getElementById(`InterGuide-Card-${lastPoint.selector}`)
        ?.remove();
    }
    this.items[index].points.forEach((point, i) => {
      if (point.disable) {
        document
          .getElementById(`InterGuide-Disable-${point.selector}`)
          ?.remove();
      }
      document.getElementById(`InterGuide-Helper-${point.selector}`)?.remove();
      document.getElementById(`InterGuide-Area-${point.selector}`)?.remove();
      if (
        this.items[index].points.length - 1 !== i ||
        this.items.length - 1 === index ||
        isDeactivate
      ) {
        document.getElementById(`InterGuide-Card-${point.selector}`)?.remove();
      }
      point.subPoints?.forEach(point => {
        modifyzIndex(point);
      });
      if (this.items[index]?.contexts) {
        this.items[index]?.contexts?.forEach(item => {
          modifyzIndex(item.selector);
        });
      }
      modifyzIndex(point.selector);
    });
  }
}

export { InterGuide, interpolate };
