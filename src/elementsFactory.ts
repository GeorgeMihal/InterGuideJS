import { Position } from './types';
import { setDecorationPosition, shadowColor, shadowSize } from './utils';

export const getMainDisplay = (layer: string) => {
  let mainDisplay = document.createElement('div');
  mainDisplay.id = 'InterGuide-MainDisplay';
  mainDisplay.className = 'interguide-js-main-display';
  mainDisplay.style.zIndex = layer;
  return mainDisplay;
};

export const getFinalWindow = (layer: string, position: Position) => {
  let wrapper = document.createElement('div');
  wrapper.id = 'InterGuide-FinalElement';
  wrapper.className = 'interguide-js-decoration';
  wrapper.style.zIndex = layer;
  wrapper.style.boxShadow = `${shadowColor} ${shadowSize}`;
  wrapper = setDecorationPosition(wrapper, position);
  return wrapper;
};

export const getLoadingWindow = (layer: string, position: Position) => {
  let wrapper = document.createElement('div');
  wrapper.id = 'InterGuide-LoadingElement';
  wrapper.className = 'interguide-js-decoration';
  wrapper.style.zIndex = layer;
  wrapper.style.boxShadow = `${shadowColor} ${shadowSize}`;
  wrapper = setDecorationPosition(wrapper, position);
  return wrapper;
};
