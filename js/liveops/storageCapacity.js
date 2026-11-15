export const STORAGE_PAGE_SIZE=24;
export const STORAGE_PAGE_COUNT=5;
export const STORAGE_FREE_SLOTS=8;
// Policy1 is immutable so a saved purchase keeps its original price on retry.
export const STORAGE_PURCHASE_VERSION=1;
const STORAGE_PURCHASE_POLICIES=Object.freeze({1:Object.freeze({price:1000})});
export const STORAGE_SLOT_PRICE=STORAGE_PURCHASE_POLICIES[STORAGE_PURCHASE_VERSION].price;
export const STORAGE_MAX_SLOTS=STORAGE_PAGE_SIZE*STORAGE_PAGE_COUNT;
export function normalizeStorageUnlocks(value){
  if(value===undefined)return {slots:[],sequence:0,last:null};
  if(!value||Object.keys(value).length!==3||!Array.isArray(value.slots)||value.slots.length>STORAGE_MAX_SLOTS-STORAGE_FREE_SLOTS
    ||new Set(value.slots).size!==value.slots.length||value.slots.some(n=>!Number.isInteger(n)||n<STORAGE_FREE_SLOTS||n>=STORAGE_MAX_SLOTS)
    ||!Number.isSafeInteger(value.sequence)||value.sequence!==value.slots.length
    ||(value.sequence===0?value.last!==null:!value.last||Object.keys(value.last).length!==2||!value.slots.includes(value.last.slot)||typeof value.last.operation!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(value.last.operation)))throw new Error('Dữ liệu ô kho chưa toàn vẹn.');
  return {slots:[...value.slots].sort((a,b)=>a-b),sequence:value.sequence,last:value.last&&{...value.last}};
}
export function unlockStorageSlot(previous,command,coins){
  const state=normalizeStorageUnlocks(previous);
  const version=command.storageVersion??1;
  if(!Number.isInteger(version)||!Object.hasOwn(STORAGE_PURCHASE_POLICIES,version))throw new Error('Phiên bản mua ô kho không hợp lệ.');
  const policy=STORAGE_PURCHASE_POLICIES[version];
  if(!Number.isInteger(command.slot)||command.slot<STORAGE_FREE_SLOTS||command.slot>=STORAGE_MAX_SLOTS
    ||typeof command.operation!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(command.operation))throw new Error('Ô kho không hợp lệ.');
  if(state.slots.includes(command.slot))return {state,applied:false};
  if(command.sequence!==state.sequence+1)throw new Error('Kho đã thay đổi. Hãy chọn lại ô.');
  if(!Number.isSafeInteger(coins)||coins<policy.price)throw new Error('Không đủ Xu để mở ô kho.');
  state.slots.push(command.slot);state.sequence++;state.last={slot:command.slot,operation:command.operation};
  return {state:normalizeStorageUnlocks(state),applied:true,price:policy.price};
}
