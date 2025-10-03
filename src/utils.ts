import { Position } from './types';

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


export const shadowSize = '0px 0px 0px 5000px';
export const shadowColor = 'rgba(121, 121, 121, 0.25)';