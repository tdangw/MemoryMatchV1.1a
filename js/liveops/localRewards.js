import {commitLocalSparkOperation} from '../persistence.js';
import {transitionSpark,secureUnit,secureSector,MAX_LOCAL_REWARD_OPERATIONS} from './sparkModel.js';
import {ownedProfileCosmeticItems} from '../progression/achievementModel.js';
import {ownedWheelItemIds} from './wheelCatalog.js';
import {CHEST_TYPES,CHEST_VERSION} from './chestConfig.js';
import {chestCandidate,randomChestGame} from './chests.js';
import {chestSupportCount} from './supportInventory.js';
import {festivalChestsEnabled} from './availability.js';
import {createWheelRolls,createWheelCandidate,WHEEL_VERSION} from './wheelRewards.js';
import {prepareFusionCandidate,PAID_LETTER_FUSION_POLICY} from './letters.js';
import {projectSparkRewards,sparkOutcome} from './rewardProjection.js';
import {committedRewardsForTransition,committedWheelRewardsForTransition} from './rewardFeedbackModel.js';
import {DAY_MS} from './model.js';
import {hourlyGiftCandidate} from './hourlyGift.js';
import {createLoginCandidate} from './missionRewards.js';
import {getFirebaseEnvironment} from '../firebaseEnvironment.js';

export const LOCAL_REWARD_SYNC_POLICY='snapshot-v1';
const localTypes=new Set(['status','login','daily','dailyBonus','weekly','openChest','sellChest','sellCosmeticFragments','fuseCosmeticFragments','sellLetter','fuseLetter','exchangeLetterSet','claimFestival','claimWheelReward','claimHourlyGift','spin']);
export const canRunLocalReward=command=>localTypes.has(command.type)&&(command.type!=='spin'||['free','ticket','ad'].includes(command.source));
export function localRewardNow(save,confirmedNow=null){
  if(confirmedNow!==null)return Math.max(save.state?.day*DAY_MS||0,confirmedNow);
  if(!save.state)return Date.now();
  // Cold offline boots retain the last known period; device time cannot grant a new daily turn.
  return Math.min((save.state.day+1)*DAY_MS-1,Math.max(save.state.day*DAY_MS,confirmedNow??Date.now()));
}
export function localRewardView(data,identity,confirmedNow=null){
  const save=data.appearance.spark;
  const owned=ownedProfileCosmeticItems(data.appearance).map(item=>item.id);
  const now=localRewardNow(save,confirmedNow);
  const result=transitionSpark(save.state,{type:'status'},{uid:identity.uid,now,coinsBalance:data.coins,cosmeticEnabled:true,
    festivalEnabled:festivalChestsEnabled(),ownedItemIds:owned,ticketEarned:save.ticketEarned,letterEarned:save.letterEarned,fireflyEarned:save.fireflyEarned,
    sourceEarned:Object.fromEntries(CHEST_TYPES.map(type=>[type,Object.values(data.appearance.achievements?.grants||{}).filter(grant=>grant.chestType===type).length]))});
  return {state:result.receipts.length&&save.state?save.state:result.state,serverNow:confirmedNow??Date.now(),offline:Boolean(save.offline)||!navigator.onLine,
    ownedItemIds:owned,committedRewards:[],committedWheelRewards:[]};
}
export function runLocalReward(identity,command,{current,confirmedNow=null,festivalEnabled=festivalChestsEnabled()}){
  return commitLocalSparkOperation(identity,(data,save)=>{
    const out=save.offline;
    const environment=identity.environment||getFirebaseEnvironment();
    if(out&&out.profileId!==identity.profileId)throw new Error('Giao dịch thuộc hồ sơ khác.');
    if(out?.environment&&out.environment!==environment)throw Object.assign(new Error('Kho đang chờ đối chiếu với bản đã lưu. Bạn vẫn có thể chơi.'),{code:'rewards/replay-conflict'});
    const owned=ownedProfileCosmeticItems(data.appearance).map(item=>item.id),wheelOwned=ownedWheelItemIds(data.appearance);
    const now=localRewardNow(save,confirmedNow);
    const context={uid:identity.uid,now,coinsBalance:data.coins,cosmeticEnabled:true,festivalEnabled,
      ownedItemIds:owned,ownedWheelItemIds:wheelOwned,ticketEarned:save.ticketEarned,letterEarned:save.letterEarned,fireflyEarned:save.fireflyEarned,
      sourceEarned:Object.fromEntries(CHEST_TYPES.map(type=>[type,Object.values(data.appearance.achievements?.grants||{}).filter(grant=>grant.chestType===type).length]))};
    const facts=(data.appearance.rewards?.pending||[]).filter(item=>[identity.uid,identity.profileId].includes(item.uid)&&item.fact.day!==null);
    const prepared=transitionSpark(save.state,{type:'status'},{...context,facts:facts.map(item=>item.fact)});
    const preparedAdded=projectSparkRewards(data,prepared,identity.uid,owned);
    let action={...structuredClone(command),operation:command.type==='spin'&&command.source==='ad'?command.operation:crypto.randomUUID()};
    const state=prepared.state;
    if(action.type==='login'&&action.loginVersion===2)action.loginCandidate=createLoginCandidate(state.loginNext,Array.from({length:3},secureUnit));
    if(action.type==='spin'&&action.source==='free'&&state.spins.free)throw new Error('Bạn đã dùng lượt miễn phí của kỳ đã lưu. Dùng vé để quay tiếp.');
    if(['openChest','sellChest'].includes(action.type))action.sequence=(state.chests?.sequence||0)+1;
    if(['sellLetter','fuseLetter','exchangeLetterSet'].includes(action.type))action.sequence=state.letters.sequence+1;
    if(['sellCosmeticFragments','fuseCosmeticFragments'].includes(action.type))action.sequence=state.cosmeticProgress.sequence+1;
    if(action.type==='openChest'){
      action.gameId=action.gameId??randomChestGame(secureUnit);action.chestVersion=CHEST_VERSION;
      action.candidate=chestCandidate(action.chestType,action.gameId,owned,secureUnit);
    }
    if(action.type==='fuseCosmeticFragments')action.fusionRoll=secureUnit();
    if(action.type==='claimHourlyGift'){
      action.sequence=(state.hourlyGift?.sequence||0)+1;action.candidate=hourlyGiftCandidate(secureUnit);action.claimedAt=confirmedNow??Date.now();
    }
    if(action.type==='fuseLetter')action=prepareFusionCandidate(state.letters,{...action,fusionPolicy:PAID_LETTER_FUSION_POLICY,fusionRoll:secureUnit()});
    if(action.type==='spin'){
      action.day=action.day??state.day;action.sequence=state.ticketSpent+1;action.wheelVersion=action.wheelVersion??WHEEL_VERSION;action.wheelRolls=action.wheelRolls??createWheelRolls(secureUnit);action.wheelCandidate=action.wheelCandidate??createWheelCandidate(action.wheelRolls,wheelOwned,action.wheelVersion);
    }
    const candidate=['openChest','claimHourlyGift'].includes(action.type)?action.candidate:action.type==='spin'?action.wheelCandidate:action.type==='claimWheelReward'?state.pendingWheel?.wheel:null;
    const supportCount=candidate?.kind==='support'?chestSupportCount(data.progress,candidate.gameId,candidate.key):0;
    const loginSupportCounts=action.loginCandidate?.supports.map(item=>chestSupportCount(data.progress,item.gameId,item.key))||[];
    const result=transitionSpark(state,action,{...context,coinsBalance:data.coins,supportCount,loginSupportCounts,randomLetter:action.randomLetter,sector:secureSector()});
    const changed=JSON.stringify(result.state)!==JSON.stringify(save.state)||prepared.receipts.length>0||facts.length>0||save.syncPolicy!==LOCAL_REWARD_SYNC_POLICY;
    if(!changed)return {...result,serverNow:confirmedNow??Date.now(),added:0,unchanged:true,offline:!navigator.onLine,committedRewards:[],committedWheelRewards:[]};
    const entry={command:action,now,supportCount,coinsBalance:data.coins,outcome:sparkOutcome(result)};
    result.state.revision=(save.state?.revision||0)+1;
    const added=preparedAdded+projectSparkRewards(data,result,identity.uid,prepared.ownedItemIds);
    result.receipts=[...prepared.receipts,...result.receipts];
    if(facts.length){const consumed=new Set(facts);data.appearance.rewards.pending=data.appearance.rewards.pending.filter(item=>!consumed.has(item));}
    data.appearance.spark={...save,syncPolicy:LOCAL_REWARD_SYNC_POLICY,state:result.state,ownerUid:identity.uid,economyRevision:save.economyRevision+1,
      offline:{version:1,uid:out?.uid||identity.uid,profileId:identity.profileId,environment,baseRevision:out?.baseRevision??save.state?.revision??0,
        ownedIds:out?.ownedIds||owned,wheelOwnedIds:out?.wheelOwnedIds||wheelOwned,operations:[...(out?.operations||[]),entry].slice(-MAX_LOCAL_REWARD_OPERATIONS)}};
    return {...result,serverNow:confirmedNow??Date.now(),added,offline:true,committedRewards:committedRewardsForTransition(state,result),committedWheelRewards:committedWheelRewardsForTransition(result)};
  },current);
}
