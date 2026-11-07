import { isAndroidAdsPlatform } from './platform.js';
import { initializeMenuAds, suspendMenuAds } from './menuAds.js';
import { getAccountService } from '../accountService.js';
import { requestLiveops } from '../liveops/service.js';
import { saveSyncMetadata } from '../persistence.js';
import { AD_CONFIG } from './adConfig.js';
import { isAppActive } from '../appVisibility.js';

const adId = AD_CONFIG.rewardedId;
let active = null;
export const rewardedSpinAvailable = () => isAndroidAdsPlatform && /^ca-app-pub-\d{16}\/\d{10}$/.test(adId);
export function requestRewardedSpin(isCurrent = () => true) {
  if (active) return active;
  active = perform(isCurrent).finally(() => { active = null; }); return active;
}
async function perform(isCurrent) {
  if (!rewardedSpinAvailable() || !isAppActive() || !isCurrent()) throw new Error('Quảng cáo nhận thưởng hiện chưa khả dụng.');
  const account = getAccountService(), identity = account?.getIdentity(), uid = identity?.uid;
  const owns = () => account.getIdentity()?.uid === uid && account.getIdentity()?.profileId === identity.profileId;
  if (!uid) throw new Error('Hãy kết nối tài khoản.');
  const prepared = await requestLiveops({ type: 'prepareAd' });
  const operation = prepared.adOperation, preparedAt = performance.now();
  const runtime = await initializeMenuAds();
  if (!runtime || !await runtime.service.prepare() || !owns() || !isCurrent()) throw new Error('Chưa thể mở quảng cáo.');
  const resume = suspendMenuAds('rewarded-spin');
  let earnedWrite = null;
  const recordEarned = () => earnedWrite ||= saveSyncMetadata(`rewardedPending:${uid}`, { ...operation, earned: true, earnedAt: Math.floor(prepared.serverNow + performance.now() - preparedAt) }, owns);
  try {
    await runtime.controller.idle();
    const result = await runtime.service.showRewarded({ adId, npa: true }, recordEarned, () => isAppActive() && owns() && isCurrent());
    if (!owns()) throw new Error('Tài khoản đã thay đổi.');
    if (result.earned) await recordEarned();
    if (earnedWrite) await earnedWrite;
    const response = await requestLiveops();
    if (![...response.state.spins.ads, ...response.state.spins.pastAds].some(spin => spin.operation === operation.operation)) throw new Error(result.earned ? 'Đang xác nhận thưởng. Quyền nhận được giữ lại.' : 'Quảng cáo chưa hoàn tất. Lượt thêm vẫn được giữ.');
    return response;
  } finally { resume(); }
}
