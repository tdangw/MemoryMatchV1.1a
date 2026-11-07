package com.memorymatch.adventure;

import android.os.CancellationSignal;
import androidx.core.content.ContextCompat;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.ClearCredentialStateRequest;
import androidx.credentials.exceptions.ClearCredentialException;
import androidx.credentials.exceptions.GetCredentialException;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "GoogleAccount")
public class GoogleAccountPlugin extends Plugin {
    private CancellationSignal cancellation;
    private PluginCall pending;

    @PluginMethod
    public void clearSession(PluginCall call) {
        CredentialManager.create(getContext()).clearCredentialStateAsync(new ClearCredentialStateRequest(), null,
            ContextCompat.getMainExecutor(getContext()), new CredentialManagerCallback<Void, ClearCredentialException>() {
                @Override public void onResult(Void result) { call.resolve(); }
                @Override public void onError(ClearCredentialException error) { call.reject("Google session could not be cleared", error); }
            });
    }

    @PluginMethod
    public void credential(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (pending != null) { call.reject("Google sign-in is already active"); return; }
            pending = call;
            cancellation = new CancellationSignal();
            GetCredentialRequest request = new GetCredentialRequest.Builder()
                .addCredentialOption(new GetSignInWithGoogleOption.Builder(getContext().getString(R.string.google_web_client_id)).build())
                .build();
            CredentialManager.create(getContext()).getCredentialAsync(getActivity(), request, cancellation,
                ContextCompat.getMainExecutor(getContext()), new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                    @Override public void onResult(GetCredentialResponse response) {
                        if (pending != call) return;
                        pending = null; cancellation = null;
                        try {
                            if (!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(response.getCredential().getType())) throw new IllegalArgumentException("Unexpected credential");
                            String token = GoogleIdTokenCredential.createFrom(response.getCredential().getData()).getIdToken();
                            JSObject result = new JSObject(); result.put("idToken", token); call.resolve(result);
                        } catch (Exception error) { call.reject("Invalid Google credential", error); }
                    }
                    @Override public void onError(GetCredentialException error) {
                        if (pending != call) return;
                        pending = null; cancellation = null;
                        call.reject("Google sign-in cancelled or unavailable", error);
                    }
                });
        });
    }
    @Override protected void handleOnDestroy() {
        PluginCall call = pending; pending = null;
        if (cancellation != null) { cancellation.cancel(); cancellation = null; }
        if (call != null) call.reject("Google sign-in interrupted");
    }
}
