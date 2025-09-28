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
};

export type Context = { selector: string; id?: string; hasShadow?: boolean };

export type GuidePoint = {
  card: (control: Control) => VNode;
  selector: string;
  disable?: boolean;
  scrollId?: string;
  direction: Direction;
  subPoints?: string[];
  requiredElements?: string[];
  backgroundColor?: string;
  padding?: number | Required<Position>;
};

export type Control = {
  prev?: () => void;
  next?: () => void;
  pointNumber: number;
  pointsCount: number;
};
