package com.memorymatch.adventure;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginHandle;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.community.admob.AdMob;

/** Orders native banner creation/destruction with the Android view lifecycle. */
@CapacitorPlugin(name = "BannerBridge")
public class BannerBridgePlugin extends Plugin {
    @PluginMethod
    public void showBanner(PluginCall call) { dispatch(call, true); }

    @PluginMethod
    public void removeBanner(PluginCall call) { dispatch(call, false); }

    private void dispatch(PluginCall call, boolean show) {
        if (getActivity() == null || getActivity().isFinishing() || getActivity().isDestroyed()) {
            call.reject("Android activity unavailable");
            return;
        }
        getActivity().runOnUiThread(() -> {
            PluginHandle handle = getBridge().getPlugin("AdMob");
            if (handle == null || !(handle.getInstance() instanceof AdMob)) {
                call.reject("AdMob plugin unavailable");
                return;
            }
            AdMob ads = (AdMob) handle.getInstance();
            if (show) ads.showBanner(call);
            else ads.removeBanner(call);
        });
    }
}
