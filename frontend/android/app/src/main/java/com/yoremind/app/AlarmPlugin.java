package com.yoremind.app;

import android.content.Intent;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AlarmPlugin")
public class AlarmPlugin extends Plugin {

    @PluginMethod
    public void triggerAlarm(PluginCall call) {
        String taskTitle = call.getString("taskTitle", "YoRemind 提醒");
        String sound = call.getString("sound", "alarm_default");

        Intent intent = new Intent(getContext(), AlarmActivity.class);
        intent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK |
            Intent.FLAG_ACTIVITY_CLEAR_TOP |
            Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        intent.putExtra("taskTitle", taskTitle);
        intent.putExtra("sound", sound);
        getContext().startActivity(intent);

        call.resolve();
    }
}
