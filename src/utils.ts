import { Position, ScrollSettings } from './types';

export const modifyzIndex = (id: string, index?: number) => {
  const item: any = document.querySelectorAll(id)?.item(0);
  if (item) {
    item.style.zIndex = index ?? null;
  }
};

export const getPaddingByPlacement = (
  placement: 'left' | 'right' | 'bottom' | 'top',
  padding?: number | Required<Position>
) => {
  if (typeof padding === 'undefined') {
    return 5;
  }
  if (typeof padding === 'number') {
    return padding;
  }
  return padding[placement];
};

export const appendItemToContext = (item: HTMLDivElement, context?: string) => {
  if (typeof context === 'undefined') {
    document.body.append(item);
  } else {
    let root = document.querySelector(context);
    root?.append(item);
  }
};

export const setDecorationPosition = (
  wrapper: HTMLDivElement,
  position: Position
) => {
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
  return wrapper;
};

export const shadowSize = '0px 0px 0px 5000px';
export const shadowColor = 'rgba(121, 121, 121, 0.25)';

export const scrollToElement = (scroll?: ScrollSettings) => {
  if (scroll) {
    const { selector, behavior, block, inline } = scroll;
    document.querySelector(selector)?.scrollIntoView({
      behavior: behavior,
      block: block,
      inline: inline,
    });
  }
};