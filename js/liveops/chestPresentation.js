import {node,action} from './ui.js';
import {requestLiveops} from './service.js';
import {loadPersistentGameData,subscribeToLocalCommit} from '../persistence.js';
import {getActiveGameScope,createGameShellLifecycle} from '../gameShell/gameShellLifecycle.js';
import {getAccountService} from '../accountService.js';
import {refreshAppWallet} from '../appNavigation.js';
import {mountStorageGrid} from './storagePresentation.js';
import '../../styles/liveops.css';

export function mountChestInventory(host,{owner,back,initialType=null}){
  const scope=createGameShellLifecycle(),release=owner.own(()=>scope.dispose());scope.own(()=>release.forget());
  const account=getAccountService(),localIdentity=()=>account?.getIdentity()||account?.getLocalIdentity();
  const identity=localIdentity();
  const current=()=>scope.active&&host.isConnected&&localIdentity()?.profileId===identity?.profileId&&localIdentity()?.uid===identity?.uid;
  const root=node('div','liveops liveops--chests'),status=node('p','liveops__status','Đang tải Kho lưu trữ…'),body=node('div','storage');
  status.setAttribute('role','status');
  if(back)root.append(action('Quay lại Bộ sưu tập',back));root.append(status,body);host.replaceChildren(root);
  let view=null,busy=false,loading=null;
  const grid=mountStorageGrid(body,{owner:scope,current,getState:()=>view?.state,initialType,execute:async command=>{
    if(busy)throw new Error('Đang hoàn tất giao dịch trước.');
    if(getActiveGameScope())throw new Error('Về bản đồ để dùng vật phẩm trong kho.');
    busy=true;
    try{const result=await requestLiveops(command);if(current()){view=result;status.textContent='';refreshAppWallet();grid.render();}return result;}
    finally{busy=false;}
  }});
  async function cached(){
    const data=await loadPersistentGameData();
    if(!current())return;
    const spark=data.appearance.spark;
    if(spark?.ownerUid===identity?.uid||!spark?.ownerUid)view={state:spark?.state};
    grid.render();
  }
  async function load(){
    if(loading||busy||!current())return loading;
    loading=(async()=>{
      await cached();if(!current())return;
      if(getActiveGameScope()){status.textContent='';return;}
      try{const result=await requestLiveops();if(current()){view=result;status.textContent='';grid.render();}}
      catch(error){if(current()){status.textContent='Đang xem dữ liệu đã lưu trên máy.';console.info('Storage awaits sync',error.code||error.name);}}
    })().finally(()=>{loading=null;});return loading;
  }
  scope.listen(window,'online',()=>void load());
  scope.own(subscribeToLocalCommit(({patch})=>{
    if(!busy&&current()&&patch.appearance?.spark?.state){view={state:patch.appearance.spark.state};status.textContent='';grid.render();}
  }));
  if(account)scope.own(account.subscribe(()=>{if(scope.active&&!current()){grid.dispose();view=null;body.replaceChildren();status.textContent='Tài khoản đã thay đổi. Mở lại Kho lưu trữ.';}}));
  void load();return ()=>{scope.dispose();release.forget();};
}
