const SHORT_NAMES = Object.freeze({
  'Động vật trên cạn':'Trên cạn','Động vật trên không':'Trên không','Động vật dưới biển':'Dưới biển',
  'Đồ dùng văn phòng':'Văn phòng','Thời trang & phụ kiện':'Thời trang','Phương tiện giao thông':'Phương tiện',
  'RPG phép thuật':'Phép thuật','Vật dụng gia đình':'Gia đình','Dụng cụ làm vườn':'Làm vườn',
  'Thiết bị gián điệp':'Gián điệp','Ký hiệu máy tính':'Ký hiệu','Mờ phóng to':'Mờ phóng','Xoay thu phóng':'Xoay phóng',
  'Tam Tinh Hội Tụ':'Tam Tinh','Cánh Hoa Nguyệt':'Hoa Nguyệt',
});
export function supportDetails(item) {
  const id=item.id || '';
  if(item.type==='time'||id==='time'||id.startsWith('time-'))return {kind:'time',value:item.value,title:'Thêm giờ'};
  if(item.type==='hint'||id==='hint'||id.startsWith('hint-'))return {kind:'hint',title:item.value>1?`Gợi ý ×${item.value}`:'Gợi ý'};
  if(item.type?.startsWith('reveal')||item.type==='preview'||id.startsWith('preview'))return {kind:'preview',title:item.type==='reveal-all'||item.value==='all'?'Xem hết':`Xem ${item.value} thẻ`};
  const kinds={reshuffle:'shuffle',shuffle:'shuffle',undo:'undo',freeze:'freeze',thunder:'thunder','tray-expansion':'expand'};
  const kind=kinds[id];
  if(!kind)throw new RangeError(`Missing support artwork contract: ${id}`);
  return {kind,title:kind==='freeze'?'Đóng băng':kind==='expand'?'Thêm ô':item.title};
}
export function catalogShortName(item,kind) { return kind==='support'?supportDetails(item).title:SHORT_NAMES[item.title]||item.title; }
export function compactCatalogCount(count) {
  if(!Number.isSafeInteger(count)||count<0)throw new RangeError('Catalog stock requires a nonnegative integer');
  if(count<1000)return String(count);
  const unit=count>=1000000?1000000:1000;
  return `${(Math.floor(count/unit*10)/10).toLocaleString('vi-VN')}${unit===1000?'k':'tr'}`;
}
