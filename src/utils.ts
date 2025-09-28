import { Position } from './types';

export const modifyzIndex = (id: string, index?: number) => {
  const item: any = document.querySelectorAll(id)?.item(0);
  console.log('context', id, item);
  if (item) {
    item.style.zIndex = index ?? null;
  }
};

export const modifyShadowContext = (id: string, active?: boolean) => {
  const item: any = document.querySelectorAll(id)?.item(0);
  if (item) {
    item.style.boxShadow = active
      ? 'rgba(121, 121, 121, 0.25) 0px 0px 0px 5000px'
      : null;
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
