import { isAppActive } from '../appVisibility.js';
import { publishRewardPeriod } from './rewardPeriodViewState.js';
import { getFirebaseBackend } from '../firebaseBackend.js';
import { getAccountService } from '../accountService.js';
import { loadSyncMetadata, saveSyncMetadata, bindPendingRewardFacts } from '../persistence.js';
import { createGameShellLifecycle, getActiveGameScope } from '../gameShell/gameShellLifecycle.js';
import { liveopsEnabled } from './availability.js';
import { DAY_MS } from './model.js';
import { confirmSparkClock } from './store.js';
import { secureSector, secureUnit, AD_DAILY_LIMIT } from './sparkModel.js';
import { createWheelRolls, WHEEL_VERSION, WHEEL_ODDS_VERSION } from './wheelRewards.js';
import { canRunLocalReward, runLocalReward } from './localRewards.js';

let binding=null,clock=null;
const identityOf=account=>account?.getIdentity()||account?.getLocalIdentity();
function clockNow(identity){
  if(!clock||clock.uid!==identity.uid||clock.profileId!==identity.profileId)return null;
  if(Math.abs(Date.now()-clock.wall-(performance.now()-clock.observedAt))>2000)return null;
  return Math.floor(clock.now+performance.now()-clock.observedAt);
}
export function trustedRewardPeriod(){
  const identity=identityOf(getAccountService());
  const now=identity?clockNow(identity):null;
  return now===null?null:{uid:identity.uid,day:Math.floor(now/DAY_MS)};
}

// A clock refresh may date pending rounds; neither it nor cloud backup owns
// the completion of a device reward. No network I/O runs in the device writer.
export function bindLiveopsAccount(account){
  binding?.dispose();clock=null;
  if(!liveopsEnabled()){binding=null;return()=>{};}
  const scope=createGameShellLifecycle();binding=scope;let refreshing=null;
  const refresh=()=>{
    const identity=account.getIdentity();
    if(!identity||!scope.active||!navigator.onLine||!isAppActive()||getActiveGameScope()||refreshing)return;
    if(clockNow(identity)!==null&&performance.now()-clock.observedAt<300000)return;
    const owns=()=>scope.active&&account.getIdentity()?.uid===identity.uid&&account.getIdentity()?.profileId===identity.profileId;
    refreshing=(async()=>{
      const backend=await getFirebaseBackend();if(!backend||!owns())return;
      const confirmed=await confirmSparkClock(backend.database,identity.environment,identity.uid,owns);
      if(!owns())return;
      clock={uid:identity.uid,profileId:identity.profileId,now:confirmed.timestamp,observedAt:performance.now(),wall:Date.now()};
      publishRewardPeriod();
      await bindPendingRewardFacts(identity,Math.floor(confirmed.timestamp/DAY_MS),owns);
      if(owns())await requestLiveops();
    })().catch(error=>console.info('Reward calendar awaits connection',error.code||error.name)).finally(()=>{refreshing=null;});
  };
  scope.own(account.subscribe(state=>{if(!['connecting','restoring','syncing'].includes(state.phase))refresh();}));
  scope.listen(window,'online',()=>{clock=null;refresh();});
  scope.listen(document,'appvisibilitychange',refresh);
  scope.listen(window,'liveopssyncrequired',()=>{
    const identity=account.getIdentity();
    const confirmedNow=identity&&clockNow(identity);
    if(identity&&confirmedNow!==null&&navigator.onLine&&isAppActive()&&!getActiveGameScope()){
      const owns=()=>scope.active&&account.getIdentity()?.uid===identity.uid&&account.getIdentity()?.profileId===identity.profileId;
      void bindPendingRewardFacts(identity,Math.floor(confirmedNow/DAY_MS),owns)
        .then(()=>{if(owns())return requestLiveops();})
        .catch(error=>console.info('Reward journal awaits reconciliation',error.code||error.name));
    }else refresh();
  });
  refresh();
  return()=>{scope.dispose();if(binding===scope){binding=null;clock=null;}};
}

export async function requestLiveops(command={type:'status'}){
  if(!liveopsEnabled())throw Object.assign(new Error('Nhiệm vụ và vòng quay sắp mở.'),{code:'rewards/not-enabled'});
  const account=getAccountService(),captured=identityOf(account);
  if(!captured)throw new Error('Chưa đọc được hồ sơ trên máy. Hãy tải lại trò chơi.');
  const current=()=>{const identity=identityOf(account);return identity?.uid===captured.uid&&identity?.profileId===captured.profileId;};
  const options={current,confirmedNow:clockNow(captured)};
  if(command.type==='prepareAd'){
    if(!navigator.onLine)throw new Error('Cần kết nối để xem quảng cáo.');
    const result=await requestLiveops();
    if(!current())throw new Error('Tài khoản đã thay đổi.');
    const pendingAd=await loadSyncMetadata(`rewardedPending:${captured.uid}`);
    if(pendingAd?.earned)throw new Error('Phần thưởng quảng cáo trước vẫn được giữ. Hãy nhận quà trước khi xem tiếp.');
    if(result.state.pendingWheel)throw new Error('Hãy nhận phần quà đang chờ trước khi quay tiếp.');
    if(result.state.spins.ads.length>=AD_DAILY_LIMIT)throw new Error('Bạn đã dùng hết lượt quảng cáo hôm nay.');
    return {...result,adOperation:{type:'spin',source:'ad',operation:crypto.randomUUID(),ordinal:result.state.spins.ads.length+1,
      sector:secureSector(),wheelVersion:WHEEL_VERSION,wheelOddsVersion:WHEEL_ODDS_VERSION,wheelRolls:createWheelRolls(secureUnit),day:result.state.day,profileId:captured.profileId}};
  }
  if(!canRunLocalReward(command))throw new Error('Không thực hiện được thao tác này.');
  if(command.type==='spin'&&command.source==='ad')throw new Error('Hãy xem hết quảng cáo để nhận lượt quay.');
  let result=await runLocalReward(captured,command,options);
  if(command.type==='status'){
    const key=`rewardedPending:${captured.uid}`,earned=await loadSyncMetadata(key);
    if(earned?.earned&&earned.profileId===captured.profileId){
      try {
        const recovered=await runLocalReward(captured,earned,options);
        result={...recovered,committedRewards:[...result.committedRewards,...recovered.committedRewards],committedWheelRewards:[...result.committedWheelRewards,...recovered.committedWheelRewards]};
        await saveSyncMetadata(key,null,current);
      } catch(error) {
        // The ad proof stays durable; its recovery must not hide the device inventory.
        console.info('Earned ad remains saved for recovery',error.code||error.name);
        result={...result,pendingAd:true};
      }
    }
  }
  return result;
}
