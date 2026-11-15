import { CATALOG_ART } from './generated/catalogArtManifest.js';
import { createIcon } from './icons.js';
import { catalogShortName, compactCatalogCount, supportDetails } from './catalogPresentationModel.js';
import '../styles/catalog-art.css';

const SUPPORT_ICONS={hint:'search',time:'timer',preview:'eye',shuffle:'shuffle',undo:'undo',freeze:'freeze',thunder:'wand',expand:'expand'};
const SUPPORT_BY_ICON={search:'hint',timer:'time',eye:'preview',puzzle:'preview',shuffle:'shuffle',undo:'undo',freeze:'freeze',snowflake:'freeze',expand:'expand'};
function artImage(key,fallback) {
  const spec=CATALOG_ART[key];
  if(!spec)return fallback();
  // 40 CSS pixels fit in128px through DPR3. Request only one larger image at
  // higher density; keep the same URL for all consumers on this device.
  const large=window.devicePixelRatio>3;
  const img=new Image();img.alt='';img.width=large?256:128;img.height=img.width;img.loading='lazy';img.decoding='async';
  img.className='catalog-art-image';
  img.onerror=()=>{img.onerror=null;if(img.parentNode)img.replaceWith(fallback());};
  img.src=`${import.meta.env.BASE_URL}${(large?spec.large:spec.small).replace(/^\//,'')}`;
  return img;
}
export function createSupportIcon(kind,{value}={}) {
  if(!SUPPORT_ICONS[kind])throw new RangeError(`Unknown support artwork: ${kind}`);
  const root=document.createElement('span');root.className=`ui-icon ui-icon--${SUPPORT_ICONS[kind]} support-art`;root.dataset.supportKind=kind;root.setAttribute('aria-hidden','true');
  root.append(artImage(`support/${kind}`,()=>{
    const icon=createIcon(SUPPORT_ICONS[kind],{vector:true});
    icon.classList.remove(`ui-icon--${SUPPORT_ICONS[kind]}`);
    if(kind==='time')icon.innerHTML='<circle cx="12" cy="13" r="8"/><path d="M9 3h6M12 5v2"/>';
    return icon;
  }));
  if(kind==='time'){
    const anchor=CATALOG_ART['support/time'].numberAnchor;
    const face=document.createElement('span');face.className=value==null?'support-art__hands':'support-art__number';
    if(value!=null)face.textContent=String(value);
    face.style.left=`${anchor[0]*100}%`;face.style.top=`${anchor[1]*100}%`;root.append(face);
  }
  return root;
}
export function createSupportItemIcon(item){const {kind,value}=supportDetails(item);return createSupportIcon(kind,{value});}
export function createRewardIcon(icon,kind=null){return kind||SUPPORT_BY_ICON[icon]?createSupportIcon(kind||SUPPORT_BY_ICON[icon]):createIcon(icon);}
export function prepareCatalogGroup(group){
  group.classList.add('catalog-group');group.querySelector('.appearance-choice-grid,.theme-choice-grid').classList.add('catalog-grid');
  const heading=group.querySelector(':scope>h3');if(heading&&heading.textContent!=='Nâng cấp vĩnh viễn')heading.hidden=true;
}
export function decorateCatalogCard(card,item,kind,{count,capacity}={}){
  card.classList.add('catalog-card');card.dataset.catalogId=item.id;card.dataset.catalogKind=kind;
  const name=card.querySelector(':scope>strong');name.textContent=catalogShortName(item,kind);name.classList.add('catalog-card__name');
  const preview=card.firstElementChild;const art=document.createElement('div');art.className='catalog-preview';
  if(kind==='support')art.append(createSupportItemIcon(item));
  else art.append(artImage(`${kind}/${item.id}`,()=>createIcon(item.icon||'images')));
  preview.replaceWith(art);
  for(const note of card.querySelectorAll(':scope>small'))note.remove();
  let description=item.title;
  if(count!==undefined){const badge=document.createElement('span');badge.className='catalog-card__stock';badge.textContent=`Có ${compactCatalogCount(count)}`;badge.setAttribute('aria-label',`Đang có: ${count.toLocaleString('vi-VN')}`);card.append(badge);description+=` · Đang có: ${count.toLocaleString('vi-VN')}`;}
  if(capacity){const badge=document.createElement('span');badge.className='catalog-card__stock';badge.textContent=`${capacity.current}/${capacity.maximum} ô`;card.append(badge);description+=` · ${capacity.current}/${capacity.maximum} ô · Mỗi lần mua thêm 1 ô`;}
  card.dataset.tooltip=description;card.setAttribute('aria-label',description);
  const button=card.querySelector('.shop-buy-button');
  if(button.textContent==='Đã sở hữu')button.textContent='Đã có';
  if(button.textContent==='Không khả dụng')button.textContent='Chưa có sẵn';
  button.setAttribute('aria-label',`${item.title} · ${button.textContent.trim()}${button.querySelector('.ui-icon--coin')?' Xu':''}`);
}
