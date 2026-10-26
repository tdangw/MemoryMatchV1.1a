import { isAndroidAdsPlatform } from './platform.js';
import { initializeMenuAds, suspendMenuAds } from './menuAds.js';
import { getAccountService } from '../accountService.js';
import { requestLiveops } from '../liveops/service.js';
import { saveSyncMetadata } from '../persistence.js';

const adId = import.meta.env?.VITE_ADMOB_REWARDED_ID || '';
let active = null;
export const rewardedSpinAvailable = () => isAndroidAdsPlatform && /^ca-app-pub-\d{16}\/\d{10}$/.test(adId);
export function requestRewardedSpin() {
  if (active) return active;
  active = perform().finally(() => { active = null; }); return active;
}
async function perform() {
  if (!rewardedSpinAvailable()) throw new Error('Quảng cáo nhận thưởng hiện chưa khả dụng.');
  const account = getAccountService(), uid = account?.getIdentity()?.uid;
  if (!uid) throw new Error('Hãy kết nối tài khoản.');
  const prepared = await requestLiveops({ type: 'prepareAd' });
  const operation = prepared.adOperation, preparedAt = performance.now();
  const runtime = await initializeMenuAds();
  if (!runtime || !await runtime.service.prepare() || account.getIdentity()?.uid !== uid) throw new Error('Chưa thể mở quảng cáo.');
  const resume = suspendMenuAds('rewarded-spin');
  await runtime.controller.idle();
  let earnedWrite = null;
  const recordEarned = () => earnedWrite ||= saveSyncMetadata(`rewardedPending:${uid}`, { ...operation, earned: true, earnedAt: Math.floor(prepared.serverNow + performance.now() - preparedAt) }, () => account.getIdentity()?.uid === uid);
  try {
    const result = await runtime.service.showRewarded({ adId, npa: true }, recordEarned);
    if (account.getIdentity()?.uid !== uid) throw new Error('Tài khoản đã thay đổi.');
    if (result.earned) await recordEarned();
    const response = await requestLiveops();
    if (!response.state.spins.ads.some(spin => spin.operation === operation.operation)) throw new Error(result.earned ? 'Đang xác nhận thưởng. Quyền nhận được giữ lại.' : 'Quảng cáo chưa hoàn tất. Lượt thêm vẫn được giữ.');
    return response;
  } finally { resume(); }
}
