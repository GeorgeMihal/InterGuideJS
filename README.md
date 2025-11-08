# InterGuideJS

Library for creating interactive guides in your Web Applications. The library can be used on any Frontend frameworks.

## API of library

## [React example - GitHub](https://github.com/GeorgeMihal/InterGuideJS-ReactExample)

### Methods

> activateGuide(guide: Guide) - method for activating guide script

> deactivateGuide() - method for deactivating guide script


### Guide Interface


##### Guide

| Field | Type | Description |
|--|--|--|
| steps | GuideStep[] | List of steps |
| rootContext | (optional) string | Selector for the main context in which the script will run |
| deactivateElement | (optional) DecorationControl | Element for deactivating script |
| finalElement | (optional) DecorationControl | Final window or card of script |
| loadingElement | (optional) DecorationControl | Loader element between steps |
| decorations | (optional) DecorationControl[] | Various fixed elements on the script |
| layers | (optional) LayersSettings | Layers settings of core library |
| shadowSize | (optional) string | Shadow size of step, default is 0px 0px 0px 5000px |

##### GuideStep

| Field | Type | Description |
|--|--|--|
| points | GuidePoint[] | List of points on step |
| nextButton | (optional) boolean | A flag indicating that the next step will be taken by calling the next function on the card |
| key | (optional) string | KeyCode for calling the next function on the card. Work only with nextButton=true |
| contexts | (optional) Context[] | Contexts in which the step is activated |
| nextStepElements | (optional) string[] | List of selectors. If there is at least one element in the list, the next step is only taken if all the elements are in the DOM. Work only with nextButton=false |
| shadowColor | (optional) string | Shadow color of step, default is rgba(121, 121, 121, 0.25) |

##### GuidePoint

| Field | Type | Description |
|--|--|--|
| cardRender | (wrapper: HTMLElement, control: CardControl) => void | Function for render of card |
| cardAnimation | (optional) CardAnimationSettings | Card animation settings between steps |
| selector | string | Selector of point |
| scroll | (optional) ScrollSettings | Scroll settings |
| style | (optional) StyleSettings | Settings of styling borders and padding of point |
| direction | (optional) Direction | Direction of card |
| position | (optional) CardPosition | Position of card |
| subPoints | (optional) string | Selectors of sub points. This elements without card on step |
| requiredElements | (optional) string[] | List of selectors. If there is at least one element in the list, the point will only be activated if all elements are in the DOM |

##### CardControl

| Field | Type | Description |
|--|--|--|
| prev | (optional) () => void | Function to go to the previous step |
| next | (optional) () => void | Function to go to the next step |
| deactivate | () => void | Function for deactivating guide script |
| pointNumber | number | Point number in script |
| pointsCount | number | Points count in script |
| pointsCountInStep | number | Points count in step |
| pointNumberInStep | number | Point number in step |
| stepsCount | number | Steps count in script |
| stepNumber | number | Step number in script |

##### DecorationControl

| Field | Type | Description |
|--|--|--|
| render | (wrapper: HTMLElement, cancel?: () => void) => void | Function for render of decoration |
| position | (optional) Position | Position of decoration |
| requiredElements | (optional) string[] | List of selectors. If there is at least one element in the list, the decoration will only be displayed if all elements are in the DOM |

##### LayersSettings

| Field | Type |
|--|--|
| cardsLayer | (optional) number |
| areaLayer | (optional) number |
| helpersLayer | (optional) number |
| disableLayer | (optional) number |
| contextsLayer | (optional) number |
| decorationsLayer | (optional) number |
| mainDisplayLayer | (optional) number |
| pointsLayer | (optional) number |
| subPointsLayer | (optional) number |

##### StyleSettings

| Field | Type |
|--|--|
| border | (optional) string |
| borderRadius | (optional) string |
| padding | (optional) number or Position |
| backgroundColor | (optional) string |

##### CardAnimationSettings

| Field | Type |
|--|--|
| duration | (optional) string |
| delay | (optional) string |
| timingFunction | (optional) string |

##### ScrollSettings

| Field | Type |
|--|--|
| selector | string |
| behavior | (optional) 'auto' or 'smooth' |
| block | (optional) ScrollPosition |
| inline | (optional) ScrollPosition |

##### Context

| Field | Type |
|--|--|
| selector | string |

##### Position

| Field | Type |
|--|--|
| top | (optional) string |
| left | (optional) string |
| right | (optional) string |
| bottom | (optional) string |

##### CardPosition

| Field | Type |
|--|--|
| top | (optional) number |
| left | (optional) number |

> type Direction = 'topLeft' | 'top' | 'topRight' | 'right' | 'left' | 'bottomRight' | 'bottom' | 'bottomLeft'

> type ScrollPosition = 'center' | 'end' | 'nearest' | 'start'