export function fragmentArt(type){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('aria-hidden','true');svg.classList.add('storage__fragment');svg.dataset.type=type;
  for(const d of ['M10 23 24 12 42 16 53 31 38 53 18 46Z','M24 12 27 31 10 23M27 31 42 16M27 31 38 53M27 31 53 31']){
    const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',d);svg.append(path);
  }return svg;
}
