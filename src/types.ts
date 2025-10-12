import { VNode } from 'preact';

export type Position = {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
};

export type Direction =
  | 'topLeft'
  | 'top'
  | 'topRight'
  | 'right'
  | 'left'
  | 'bottomRight'
  | 'bottom'
  | 'bottomLeft';

export type GuideStep = {
  points: GuidePoint[];
  nextButton?: boolean;
  contexts?: Context[];
  nextStepElements?: string[];
  shadowColor?: string;
};

export type Context = { selector: string };

export type GuidePoint = {
  card: (control: CardControl) => VNode;
  cardAnimation?: CardAnimationSettings;
  selector: string;
  disable?: boolean;
  scroll?: ScrollSettings;
  style?: StyleSettings;
  direction: Direction;
  subPoints?: string[];
  requiredElements?: string[];
};

export type ScrollSettings = {
  selector: string;
  behavior?: 'auto' | 'smooth';
  block?: ScrollPosition;
  inline?: ScrollPosition;
};

export type ScrollPosition = 'center' | 'end' | 'nearest' | 'start';

export type CardAnimationSettings = {
  duration?: string;
  delay?: string;
  timingFunction?: string;
};


export type StyleSettings = {
  border?: string;
  borderRadius?: string;
  padding?: number | Required<Position>;
  backgroundColor?: string;
};

export type CardControl = {
  prev?: () => void;
  next?: () => void;
  deactivate: () => void;
  pointNumber: number;
  pointsCount: number;
  pointsCountInStep: number;
  pointNumberInStep: number;
  stepsCount: number;
  stepNumber: number;
};

export type DecorationControl = { element: (cancel?: () => void) => VNode,  position: Position }

export type Guide = {
  steps: GuideStep[];
  rootContext?: string;
  deactivateElement?: DecorationControl;
  finalElement?: DecorationControl;
  loadingElement?: DecorationControl;
  decorations?: DecorationControl[];
  layers?: LayersSettings;
};


export type LayersSettings = {
  cardsLayer?: number;
  areaLayer?: number;
  helpersLayer?: number;
  disableLayer?: number;
  contextsLayer?: number;
  decorationsLayer?: number;
  mainDisplayLayer?: number;
  pointsLayer?: number;
  subPointsLayer?: number;
};