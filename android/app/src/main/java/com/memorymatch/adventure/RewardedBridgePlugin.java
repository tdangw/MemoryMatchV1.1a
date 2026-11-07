package com.memorymatch.adventure;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.community.admob.rewarded.AdRewardExecutor;
import com.google.android.gms.ads.AdError;
import com.google.android.gms.ads.FullScreenContentCallback;
import com.google.android.gms.ads.rewarded.RewardedAd;

/** Settles the bridge call on early dismissal as well as earned dismissal. */
@CapacitorPlugin(name = "RewardedBridge")
public class RewardedBridgePlugin extends Plugin {
    private PluginCall pending;
    private RewardedAd showing;
    private boolean earned;

    @PluginMethod
    public void showRewardVideoAd(PluginCall call) {
        if (getActivity() == null || getActivity().isFinishing() || getActivity().isDestroyed()) {
            call.reject("Android activity unavailable"); return;
        }
        getActivity().runOnUiThread(() -> {
            if (pending != null) { call.reject("Rewarded ad already presenting"); return; }
            String id = call.getString("adId", AdRewardExecutor.lastPreparedAdId);
            RewardedAd ad = id == null ? null : AdRewardExecutor.preparedAds.remove(id);
            if (id != null && id.equals(AdRewardExecutor.lastPreparedAdId)) AdRewardExecutor.lastPreparedAdId = null;
            if (ad == null) { call.reject("Rewarded ad not prepared"); return; }
            pending = call; showing = ad; earned = false;
            ad.setFullScreenContentCallback(new FullScreenContentCallback() {
                @Override public void onAdDismissedFullScreenContent() {
                    if (pending == null) return;
                    notifyListeners("onRewardedVideoAdDismissed", new JSObject());
                    finish(null);
                }
                @Override public void onAdFailedToShowFullScreenContent(AdError error) {
                    if (pending == null) return;
                    notifyListeners("onRewardedVideoAdFailedToShow", new JSObject().put("code", error.getCode()));
                    finish(error.getMessage());
                }
            });
            try {
                ad.show(getActivity(), reward -> {
                    if (pending == null || earned) return;
                    earned = true;
                    notifyListeners("onRewardedVideoAdReward", new JSObject().put("amount", reward.getAmount()).put("type", reward.getType()));
                });
            } catch (RuntimeException error) { finish(error.getMessage()); }
        });
    }

    private void finish(String error) {
        PluginCall call = pending; pending = null;
        if (showing != null) showing.setFullScreenContentCallback(null);
        showing = null;
        if (call == null) return;
        if (error == null) call.resolve(new JSObject().put("earned", earned));
        else call.reject(error);
        earned = false;
    }

    @Override protected void handleOnDestroy() {
        finish("Android activity destroyed");
        super.handleOnDestroy();
    }
}
