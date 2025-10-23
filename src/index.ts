import {
  DecorationControl,
  Guide,
  GuidePoint,
  GuideStep,
  LayersSettings,
} from './types';
import './index.css';
import {
  appendItemToContext,
  getPaddingByPlacement,
  modifyzIndex,
  scrollToElement,
  setDecorationPosition,
  shadowColor,
  shadowSize,
} from './utils';
import {
  getFinalWindow,
  getLoadingWindow,
  getMainDisplay,
} from './elementsFactory';

class InterGuide {
  static instance: any;
  private rootContext: undefined | string = undefined;
  private decorationsIds: string[] = [];
  private decorationObservers: MutationObserver[] = [];
  private active: { index: number; items: string[] } = { index: 0, items: [] };
  private observers: MutationObserver[] = [];
  private items: GuideStep[] = [];
  private layers: Required<LayersSettings> = {
    cardsLayer: 97000,
    areaLayer: 91000,
    helpersLayer: 92000,
    disableLayer: 95000,
    contextsLayer: 90000,
    decorationsLayer: 96000,
    mainDisplayLayer: 90000,
    pointsLayer: 94000,
    subPointsLayer: 93000,
  };
  private finalItem?: DecorationControl = undefined;
  private loadingItem?: DecorationControl = undefined;

  constructor() {
    if (InterGuide.instance) {
      return InterGuide.instance;
    }

    InterGuide.instance = this;

    this.activateGuide = this.activateGuide.bind(this);
    this.deactivateGuide = this.deactivateGuide.bind(this);
    this.setRootContext = this.setRootContext.bind(this);
    this.addDecoration = this.addDecoration.bind(this);
    this.nextStepHandler = this.nextStepHandler.bind(this);
    this.prevStepHandler = this.prevStepHandler.bind(this);
    this.getPointNumber = this.getPointNumber.bind(this);
    this.getPointsCount = this.getPointsCount.bind(this);
    this.getActiveStep = this.getActiveStep.bind(this);
    this.getActivePoints = this.getActivePoints.bind(this);
    this.getActiveContexts = this.getActiveContexts.bind(this);
    this.getActivePointsCount = this.getActivePointsCount.bind(this);
    this.activatePoint = this.activatePoint.bind(this);
    this.activateContexts = this.activateContexts.bind(this);
    this.addCard = this.addCard.bind(this);
    this.updateCard = this.updateCard.bind(this);
    this.replaceCard = this.replaceCard.bind(this);
    this.addShadowArea = this.addShadowArea.bind(this);
    this.addHelper = this.addHelper.bind(this);
    this.addContexts = this.addContexts.bind(this);
    this.initStep = this.initStep.bind(this);
    this.clear = this.clear.bind(this);
    this.addShadowAreaToPoints = this.addShadowAreaToPoints.bind(this);
    this.preparePoint = this.preparePoint.bind(this);
    this.createFinalWindow = this.createFinalWindow.bind(this);
    this.activateFinalWindow = this.activateFinalWindow.bind(this);
    this.createLoadingWindow = this.createLoadingWindow.bind(this);
    this.activateLoadingWindow = this.activateLoadingWindow.bind(this);
    this.isNextElementsReady = this.isNextElementsReady.bind(this);
    this.prepareWrapperCard = this.prepareWrapperCard.bind(this);
    this.isRequiredElementsReady = this.isRequiredElementsReady.bind(this);
  }

  activateGuide(guide: Guide) {
    this.setRootContext(guide.rootContext ?? '[id=root]');
    this.layers = {
      ...this.layers,
      ...guide.layers,
    } as Required<LayersSettings>;
    appendItemToContext(
      getMainDisplay(this.layers.mainDisplayLayer.toString()),
      this.rootContext
    );
    if (guide.loadingElement) {
      this.createLoadingWindow(guide.loadingElement);
    }
    if (guide.finalElement) {
      this.createFinalWindow(guide.finalElement);
    }
    if (guide.deactivateElement) {
      this.addDecoration(guide.deactivateElement, 'InterGuide-CancelElement');
    }
    if (guide.decorations) {
      guide.decorations.forEach((decoration, i) => {
        if (!decoration.requiredElements?.length) {
          this.addDecoration(decoration, `InterGuide-Decoration-${i}`);
        } else {
          const observer = new MutationObserver(() => {
            const isRequiredElementsReady =
              decoration.requiredElements?.every(value => {
                return !!document.querySelector(value);
              }) ?? true;
            const hasDecoration = !!document.getElementById(
              `InterGuide-Decoration-${i}`
            );
            if (isRequiredElementsReady && !hasDecoration) {
              this.addDecoration(decoration, `InterGuide-Decoration-${i}`);
            }
          });
          observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
          });
          this.decorationObservers = [...this.decorationObservers, observer];
        }
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
    this.decorationObservers.forEach(obs => obs.disconnect());
    this.decorationObservers = [];
    if (this.active.index !== this.items.length) {
      this.clear(true);
    }
    this.items = [];
    this.active = { index: 0, items: [] };
    document.dispatchEvent(new CustomEvent('deactivate-guide'));
  }

  private createLoadingWindow(value: DecorationControl) {
    this.loadingItem = value;
  }

  private createFinalWindow(value: DecorationControl) {
    this.finalItem = value;
  }

  private setRootContext(value: string) {
    this.rootContext = value;
  }

  private getActiveStep() {
    return this.items[this.active.index];
  }

  private getActivePoints() {
    return this.getActiveStep()?.points;
  }

  private getActiveContexts() {
    return this.getActiveStep()?.contexts;
  }

  private getActivePointsCount() {
    return this.getActivePoints()?.length;
  }

  private addDecoration(decoration: DecorationControl, id: string) {
    this.decorationsIds = [...this.decorationsIds, id];
    let wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.className = 'interguide-js-decoration';
    wrapper.style.zIndex = this.layers.decorationsLayer.toString();
    wrapper = setDecorationPosition(wrapper, decoration.position);
    decoration.render?.(wrapper, this.deactivateGuide);
    appendItemToContext(wrapper, this.rootContext);
  }

  private activateFinalWindow() {
    const { render, position } = this.finalItem ?? {};
    if (position && render) {
      let wrapper = getFinalWindow(
        this.layers.decorationsLayer.toString(),
        position
      );
      render(wrapper, this.deactivateGuide);
      appendItemToContext(wrapper, this.rootContext);
    }
  }

  private activateLoadingWindow() {
    const { render, position } = this.loadingItem ?? {};
    if (position && render) {
      let wrapper = getLoadingWindow(
        this.layers.decorationsLayer.toString(),
        position
      );
      render(wrapper);
      appendItemToContext(wrapper, this.rootContext);
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
    this.clear(true);
    this.active = { index: this.active.index - 1, items: [] };
    this.initStep(true);
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
      modifyzIndex(point, state ? this.layers.subPointsLayer : undefined);
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
        this.getActivePointsCount() - 1 !== i ||
        this.items.length - 1 === this.active.index
      ) {
        document.getElementById(`InterGuide-Card-${point.selector}`)?.remove();
      }
    }
    modifyzIndex(point.selector, state ? this.layers.pointsLayer : undefined);
  }
  private activateContexts(state: boolean) {
    if (this.getActiveContexts()) {
      this.getActiveContexts()?.forEach((item, i) => {
        modifyzIndex(
          item.selector,
          state ? this.layers.contextsLayer + i : undefined
        );
      });
    }
  }

  private isNextElementsReady() {
    return (
      this.getActiveStep()?.nextStepElements?.every(value => {
        return !!document.querySelector(value);
      }) ?? true
    );
  }

  private isRequiredElementsReady(point: GuidePoint) {
    return (
      point.requiredElements?.every(value => {
        return !!document.querySelector(value);
      }) ?? true
    );
  }

  private preparePoint(point: GuidePoint, i: number, isPrev?: boolean) {
    const isDomReady = !!document.querySelector(point.selector);
    const isRequiredElementsReady = this.isRequiredElementsReady(point);
    if (isDomReady && isRequiredElementsReady) {
      this.active = {
        ...this.active,
        items: [...this.active.items, point.selector],
      };
      if (this.active.items.length === 1) {
        document.getElementById('InterGuide-LoadingElement')?.remove();
      }
      scrollToElement(point.scroll);
      this.activatePoint(point, i, true);
      this.activateContexts(true);
      this.initPoint(point, this.getActiveStep(), i);
      if (this.active.index === 0 || i !== 0 || isPrev) {
        this.addCard(point, i);
      } else {
        this.updateCard(point, i);
      }
      this.addContexts();
      this.addHelper(point, this.getActiveStep());
      this.initStep();
    }
  }

  private addShadowAreaToPoints() {
    this.getActivePoints()?.forEach((point, i) => {
      this.addShadowArea(point, i);
    });
  }

  private initStep(isPrev?: boolean) {
    if (this.getActiveStep()?.nextStepElements) {
      const nextStepObserver = new MutationObserver(() => {
        const isNextElementsReady = this.isNextElementsReady();
        if (isNextElementsReady) {
          this.nextStepHandler();
        }
      });
      nextStepObserver.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      this.observers = [...this.observers, nextStepObserver];
    }
    this.getActivePoints()?.forEach((point, i) => {
      const observer = new MutationObserver(() => {
        if (!this.active.items.includes(point.selector)) {
          this.preparePoint(point, i, isPrev);
        } else {
          const isDomReady = !!document.querySelector(point.selector);
          const isRequiredElementsReady = this.isRequiredElementsReady(point);
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
        this.addShadowAreaToPoints();
      });
      if (
        !this.active.items.includes(point.selector) &&
        this.items.length !== this.active.index
      ) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
        });
        this.observers = [...this.observers, observer];
        this.preparePoint(point, i, isPrev);
      }
    });
    this.addShadowAreaToPoints()
  }

  private addShadowArea(point: GuidePoint, i: number) {
    const area: any = document.getElementById(
      `InterGuide-Area-${point.selector}`
    );
    const activePoints = this.getActivePoints()?.filter(point =>
      this.active.items.includes(point.selector)
    );
    if (area) {
      if (
        (this.getActivePointsCount() - 1 === i &&
          activePoints.length === this.getActivePointsCount()) ||
        (i === 0 && activePoints.length !== this.getActivePointsCount())
      ) {
        area.style.boxShadow = `${this.getActiveStep()?.shadowColor ??
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
    const activePoints = this.getActivePoints()?.filter(point =>
      this.active.items.includes(point.selector)
    );
    if (
      this.getActivePointsCount() - 1 === i &&
      activePoints.length === this.getActivePointsCount() &&
      !this.getActiveStep()?.nextButton &&
      !this.getActiveStep()?.nextStepElements
    ) {
      document
        .querySelector(point.selector)
        ?.addEventListener('click', this.nextStepHandler, { once: true });
    }

    window?.addEventListener('scroll', action);
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
    const root = document.querySelector(this.rootContext ?? '');
    let pos = { top: 0, left: 0 };
    let left = point.position?.left;
    let top = point.position?.top;
    if (root && rect && wrapper) {
      if (point.direction === 'right' || point.direction === 'left') {
        pos = {
          ...pos,
          top: rect.top + (rect.height - wrapper.clientHeight) / 2 + (top || 0),
        };
      } else if (
        point.direction === 'bottomLeft' ||
        point.direction === 'bottomRight' ||
        point.direction === 'bottom'
      ) {
        pos = {
          ...pos,
          top:
            rect.bottom +
            (top || 20) +
            Number(getPaddingByPlacement('bottom', point.style?.padding)),
        };
      } else if (
        point.direction === 'topLeft' ||
        point.direction === 'topRight' ||
        point.direction === 'top'
      ) {
        pos = {
          ...pos,
          top:
            rect.top -
            wrapper.clientHeight -
            (top || 20) -
            Number(getPaddingByPlacement('top', point.style?.padding)),
        };
      }
      if (point.direction === 'right') {
        pos = {
          ...pos,
          left:
            rect.right +
            (left || 20) +
            Number(getPaddingByPlacement('right', point.style?.padding)),
        };
      } else if (point.direction === 'left') {
        pos = {
          ...pos,
          left:
            rect.left -
            wrapper.clientWidth -
            (left || 20) -
            Number(getPaddingByPlacement('left', point.style?.padding)),
        };
      } else if (
        point.direction === 'bottomRight' ||
        point.direction === 'topRight'
      ) {
        pos = {
          ...pos,
          left: rect.left + rect.width / 2 + (left || 0),
        };
      } else if (point.direction === 'top' || point.direction === 'bottom') {
        pos = {
          ...pos,
          left:
            rect.left + (rect.width - wrapper.clientWidth) / 2 + (left || 0),
        };
      } else if (
        point.direction === 'bottomLeft' ||
        point.direction === 'topLeft'
      ) {
        pos = {
          ...pos,
          left:
            rect.left + (rect.width / 2 - wrapper.clientWidth) + (left || 0),
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
          ? step.contexts[step.contexts?.length - 1].selector ?? rootContext
          : rootContext;
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

  private prepareWrapperCard(
    wrapper: HTMLElement,
    i: number,
    point: GuidePoint,
    type: 'add' | 'update'
  ) {
    if (
      this.getActivePointsCount() - 1 === i &&
      this.items.length - 1 !== this.active.index
    ) {
      const { duration, delay, timingFunction } = point.cardAnimation ?? {};
      wrapper.style.transition = `top ${duration ?? '1s'} ${timingFunction ??
        'linear'} ${delay ?? '0s'}, left ${duration ?? '1s'} ${timingFunction ??
        'linear'} ${delay ?? '0s'}`;
    }
    const isNextButton = this.getActiveStep()?.nextButton;
    const key = this.getActiveStep()?.key;
    const isPrevButton =
      this.active.index !== 0
        ? this.items[this.active.index - 1]?.nextButton
        : false;
    if (isNextButton && key) {
      document.addEventListener(
        'keydown',
        event => {
          if (event.code == key) {
            this.nextStepHandler();
          }
        },
        { once: true }
      );
    }
    point.cardRender(wrapper, {
      pointNumber: this.getPointNumber(type === 'add' ? i : 0),
      pointsCount: this.getPointsCount(),
      pointsCountInStep: this.getActivePointsCount(),
      pointNumberInStep: type === 'add' ? i + 1 : 1,
      stepNumber: this.active.index + 1,
      stepsCount: this.items.length,
      prev: isPrevButton ? this.prevStepHandler : undefined,
      next: isNextButton ? this.nextStepHandler : undefined,
      deactivate: this.deactivateGuide,
    });
    this.replaceCard(point);
  }

  private addCard(point: GuidePoint, i: number) {
    let wrapper = document.createElement('div');
    wrapper.className = 'interguide-js-card';
    wrapper.id = `InterGuide-Card-${point.selector}`;
    wrapper.style.zIndex = this.layers.cardsLayer.toString();
    this.prepareWrapperCard(wrapper, i, point, 'add');
    appendItemToContext(wrapper, this.rootContext);
  }

  private updateCard(point: GuidePoint, i: number) {
    const prevItem = this.items[this.active.index - 1];
    let card = document.getElementById(
      `InterGuide-Card-${prevItem.points[prevItem.points.length - 1].selector}`
    );
    if (card) {
      card.id = `InterGuide-Card-${point.selector}`;
      this.prepareWrapperCard(card, i, point, 'update');
    }
  }

  private addHelper(point: GuidePoint, step: GuideStep) {
    const rootContext = this.rootContext ?? '';
    if (step) {
      const contextSelector =
        step.contexts && step.contexts?.length > 0
          ? step.contexts[step.contexts?.length - 1].selector ?? rootContext
          : rootContext;

      let helper = document.createElement('div');
      helper.className = 'interguide-js-helper';
      helper.id = `InterGuide-Helper-${point.selector}`;
      helper.style.zIndex = this.layers.helpersLayer.toString();
      if (point.style?.backgroundColor) {
        helper.style.backgroundColor = point.style.backgroundColor;
      }
      if (point.style?.border) {
        helper.style.border = point.style.border;
      }
      if (point.style?.borderRadius) {
        helper.style.borderRadius = point.style.borderRadius;
      }
      if (point.style?.backgroundColor) {
        helper.style.backgroundColor = point.style.backgroundColor;
      }
      this.replaceHelper(`InterGuide-Helper-${point.selector}`, step, point);
      appendItemToContext(helper, contextSelector);

      let area = document.createElement('div');
      area.className = 'interguide-js-area';
      area.style.zIndex = this.layers.areaLayer.toString();
      area.id = `InterGuide-Area-${point.selector}`;
      if (point.style?.backgroundColor) {
        area.style.backgroundColor = point.style.backgroundColor;
      }
      if (point.style?.border) {
        area.style.border = point.style.border;
      }
      if (point.style?.borderRadius) {
        area.style.borderRadius = point.style.borderRadius;
      }
      this.replaceHelper(`InterGuide-Area-${point.selector}`, step, point);
      appendItemToContext(area, contextSelector);

      if (point.disable) {
        let disable = document.createElement('div');
        disable.className = 'interguide-js-disable';
        disable.style.zIndex = this.layers.disableLayer.toString();
        disable.id = `InterGuide-Disable-${point.selector}`;
        this.replaceHelper(`InterGuide-Disable-${point.selector}`, step, point);
        appendItemToContext(disable, contextSelector);
      }
    }
  }

  private addContexts() {
    const rootContext = this.rootContext ?? '';

    const contextItems =
      this.getActiveContexts()?.map(item => item.selector ?? rootContext) ?? [];

    contextItems?.forEach(item => {
      if (!document.getElementById(`InterGuide-Context-${item}`)) {
        let context = document.createElement('div');
        context.className = 'interguide-js-context';
        context.id = `InterGuide-Context-${item}`;
        context.style.zIndex = this.layers.contextsLayer.toString();
        appendItemToContext(context, item);
      }
    });
  }

  private clear(isDeactivate?: boolean) {
    const rootContext = this.rootContext ?? '';
    const index = this.active.index;
    const contextItems =
      this.getActiveContexts()?.map(item => item.selector ?? rootContext) ?? [];

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
    this.getActivePoints()?.forEach((point, i) => {
      if (point.disable) {
        document
          .getElementById(`InterGuide-Disable-${point.selector}`)
          ?.remove();
      }
      document.getElementById(`InterGuide-Helper-${point.selector}`)?.remove();
      document.getElementById(`InterGuide-Area-${point.selector}`)?.remove();
      if (
        this.getActivePointsCount() - 1 !== i ||
        this.items.length - 1 === index ||
        isDeactivate
      ) {
        document.getElementById(`InterGuide-Card-${point.selector}`)?.remove();
      }
      point.subPoints?.forEach(point => {
        modifyzIndex(point);
      });
      if (this.getActiveContexts()) {
        this.getActiveContexts()?.forEach(item => {
          modifyzIndex(item.selector);
        });
      }
      modifyzIndex(point.selector);
    });
  }
}

export { InterGuide };
