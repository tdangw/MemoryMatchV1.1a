import { createIcon } from './icons.js';

export function createRewardInfo(text,label='Thông tin rương'){
  const button=document.createElement('button');button.type='button';button.className='reward-info-button';
  button.dataset.tooltipInfo='';button.dataset.tooltip=text;button.setAttribute('aria-label',label);button.append(createIcon('info'));return button;
}
