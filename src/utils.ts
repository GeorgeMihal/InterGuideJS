import { GuideStep } from './types';

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
  items[index].points.forEach((point) => {
    point.subPoints?.forEach((point) => {
      modifyzIndex(point)
    })
    if(items[index]?.contexts){
      items[index]?.contexts.forEach((item) => {
        modifyzIndex(item.selector);
        item.hasShadow && modifyShadowContext(item.selector, false);
      });
    }
    modifyzIndex(point.id);
  })
};
