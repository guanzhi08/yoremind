package com.yoremind.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AlarmPlugin")
public class AlarmPlugin extends Plugin {

    static final String CHANNEL_ID = "yoremind_alarm";
    private static final int ALARM_NOTIF_ID = 77001;

    @Override
    public void load() {
        createAlarmChannel();
    }

    private void createAlarmChannel() {
        NotificationChannel ch = new NotificationChannel(
            CHANNEL_ID,
            "YoRemind 鬧鐘",
            NotificationManager.IMPORTANCE_HIGH
        );
        ch.setDescription("位置觸發的全螢幕提醒");
        ch.enableLights(true);
        ch.enableVibration(true);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        ch.setBypassDnd(true);
        NotificationManager nm = getContext().getSystemService(NotificationManager.class);
        if (nm != null) nm.createNotificationChannel(ch);
    }

    // ─── triggerAlarm ──────────────────────────────────────────────────────────
    // Uses setFullScreenIntent so Android handles the activity launch,
    // which works from background / screen-off on all API levels.

    @PluginMethod
    public void triggerAlarm(PluginCall call) {
        String taskTitle = call.getString("taskTitle", "YoRemind 提醒");
        String sound = call.getString("sound", "alarm_default");

        // Android 14+: need explicit USE_FULL_SCREEN_INTENT grant
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            NotificationManager nm = getContext().getSystemService(NotificationManager.class);
            if (nm != null && !nm.canUseFullScreenIntent()) {
                openFullScreenIntentSettings();
                call.reject("FULL_SCREEN_INTENT_REQUIRED");
                return;
            }
        }

        // Build PendingIntent pointing at AlarmActivity
        Intent alarmIntent = new Intent(getContext(), AlarmActivity.class);
        alarmIntent.putExtra("taskTitle", taskTitle);
        alarmIntent.putExtra("sound", sound);
        alarmIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT
            | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? PendingIntent.FLAG_IMMUTABLE : 0);
        PendingIntent fullScreenPI = PendingIntent.getActivity(
            getContext(), ALARM_NOTIF_ID, alarmIntent, piFlags);

        // High-priority notification with full-screen intent
        // → system shows the full-screen activity OR a HUD heads-up notification
        NotificationCompat.Builder nb = new NotificationCompat.Builder(getContext(), CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("📍 YoRemind 提醒")
            .setContentText(taskTitle)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setFullScreenIntent(fullScreenPI, true)
            .setContentIntent(fullScreenPI)
            .setAutoCancel(true);

        try {
            NotificationManagerCompat.from(getContext()).notify(ALARM_NOTIF_ID, nb.build());
            call.resolve();
        } catch (SecurityException e) {
            call.reject("NOTIFICATION_PERMISSION_DENIED", e);
        }
    }

    // ─── Full-screen intent permission helpers (Android 14+) ──────────────────

    @PluginMethod
    public void checkFullScreenPermission(PluginCall call) {
        boolean granted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            NotificationManager nm = getContext().getSystemService(NotificationManager.class);
            granted = nm != null && nm.canUseFullScreenIntent();
        }
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestFullScreenPermission(PluginCall call) {
        openFullScreenIntentSettings();
        call.resolve();
    }

    private void openFullScreenIntentSettings() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
    }
}
