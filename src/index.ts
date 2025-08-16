import { render, VNode } from 'preact';
import { html as interpolate } from 'htm/preact';

type Position = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
};

class InterGuide {
  static instance: any;
  rootContext: undefined | string = undefined;
  decorationsIds: string[] = [];

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
  }

  createMainDisplay() {
    let mainDisplay = document.createElement('div');
    mainDisplay.id = 'InterGuide-MainDisplay';
    mainDisplay.style.width = '100vw';
    mainDisplay.style.height = '100vh';
    mainDisplay.style.zIndex = '99998';
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

  activateGuide() {
    this.appendItemToContext(this.createMainDisplay(), this.rootContext);
  }

  deactivateGuide() {
    document.getElementById('InterGuide-MainDisplay')?.remove();
    this.decorationsIds.forEach(id => document.getElementById(id)?.remove());
  }

  setRootContext(value: string) {
    this.rootContext = value;
  }

  addDecoration(value: VNode, position: Position, id: string) {
    this.decorationsIds = [...this.decorationsIds, id];
    let wrapper = document.createElement('div');
    wrapper.id = id;
    wrapper.style.position = 'absolute';
    wrapper.style.zIndex = '99999';
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

export { InterGuide, interpolate };
