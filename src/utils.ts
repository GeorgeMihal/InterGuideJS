import { GuideStep, Position } from './types';

export const modifyzIndex = (id: string, index?: number) => {
  const item: any = document.querySelectorAll(id)?.item(0);
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

export const clear = (items: GuideStep[], index: number) => {
  items[index].points.forEach(point => {
    if (point.disable) {
      document.getElementById(`InterGuide-Disable-${point.id}`)?.remove()
    }
    document.getElementById(`InterGuide-Helper-${point.id}`)?.remove();
    document.getElementById(`InterGuide-Area-${point.id}`)?.remove();
    document.getElementById(`InterGuide-Card-${point.id}`)?.remove();
    point.subPoints?.forEach(point => {
      modifyzIndex(point);
    });
    if (items[index]?.contexts) {
      items[index]?.contexts?.forEach(item => {
        modifyzIndex(item.selector);
        item.hasShadow && modifyShadowContext(item.selector, false);
      });
    }
    modifyzIndex(point.id);
  });
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
