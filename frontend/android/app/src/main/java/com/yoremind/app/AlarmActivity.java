package com.yoremind.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class AlarmActivity extends Activity {

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        applyWindowFlags();
        acquireWakeLock();

        String taskTitle = getIntent().getStringExtra("taskTitle");
        String sound = getIntent().getStringExtra("sound");
        if (taskTitle == null) taskTitle = "YoRemind 提醒";
        if (sound == null) sound = "alarm_default";

        buildUI(taskTitle);
        playSound(sound);
    }

    private void applyWindowFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            //noinspection deprecation
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON
        );
    }

    private void acquireWakeLock() {
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null) {
            //noinspection deprecation
            wakeLock = pm.newWakeLock(
                PowerManager.SCREEN_BRIGHT_WAKE_LOCK | PowerManager.ACQUIRE_CAUSES_WAKEUP,
                "yoremind:alarm_wakelock"
            );
            wakeLock.acquire(5 * 60 * 1000L);
        }
    }

    private void buildUI(String taskTitle) {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.parseColor("#6366f1"));
        root.setPadding(dpToPx(32), dpToPx(80), dpToPx(32), dpToPx(60));

        // Pin icon
        TextView icon = new TextView(this);
        icon.setText("📍");
        icon.setTextSize(64);
        icon.setGravity(Gravity.CENTER);

        // App label
        TextView appLabel = new TextView(this);
        appLabel.setText("YoRemind");
        appLabel.setTextSize(16);
        appLabel.setTextColor(Color.parseColor("#c7d2fe"));
        appLabel.setGravity(Gravity.CENTER);
        appLabel.setPadding(0, dpToPx(12), 0, dpToPx(4));

        // Task title
        TextView titleView = new TextView(this);
        titleView.setText(taskTitle);
        titleView.setTextSize(28);
        titleView.setTextColor(Color.WHITE);
        titleView.setTypeface(null, Typeface.BOLD);
        titleView.setGravity(Gravity.CENTER);
        titleView.setPadding(0, dpToPx(4), 0, dpToPx(10));

        // Subtitle
        TextView subtitle = new TextView(this);
        subtitle.setText("你已進入目標範圍！");
        subtitle.setTextSize(16);
        subtitle.setTextColor(Color.parseColor("#e0e7ff"));
        subtitle.setGravity(Gravity.CENTER);
        subtitle.setPadding(0, 0, 0, dpToPx(60));

        // Dismiss button
        Button btn = new Button(this);
        btn.setText("✅  我知道了");
        btn.setTextSize(18);
        btn.setTextColor(Color.parseColor("#6366f1"));
        btn.setTypeface(null, Typeface.BOLD);
        GradientDrawable btnBg = new GradientDrawable();
        btnBg.setColor(Color.WHITE);
        btnBg.setCornerRadius(dpToPx(16));
        btn.setBackground(btnBg);
        btn.setPadding(dpToPx(32), dpToPx(18), dpToPx(32), dpToPx(18));
        LinearLayout.LayoutParams btnParams = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );
        btn.setLayoutParams(btnParams);
        btn.setOnClickListener(v -> dismiss());

        root.addView(icon);
        root.addView(appLabel);
        root.addView(titleView);
        root.addView(subtitle);
        root.addView(btn);
        setContentView(root);
    }

    private void playSound(String soundName) {
        try {
            int resId;
            switch (soundName) {
                case "alarm_gentle":  resId = R.raw.alarm_gentle;  break;
                case "alarm_urgent":  resId = R.raw.alarm_urgent;  break;
                default:              resId = R.raw.alarm_default; break;
            }
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build());
            mediaPlayer.setDataSource(this,
                Uri.parse("android.resource://" + getPackageName() + "/" + resId));
            mediaPlayer.setLooping(true);
            mediaPlayer.setVolume(1.0f, 1.0f);
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void dismiss() {
        stopSound();
        releaseWakeLock();
        finish();
    }

    private void stopSound() {
        if (mediaPlayer != null) {
            try { mediaPlayer.stop(); } catch (Exception ignored) {}
            mediaPlayer.release();
            mediaPlayer = null;
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            wakeLock = null;
        }
    }

    private int dpToPx(int dp) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(dp * density);
    }

    @Override
    public void onBackPressed() {
        // Block back — must tap dismiss button
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        stopSound();
        releaseWakeLock();
    }
}
