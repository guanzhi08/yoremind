import { registerPlugin } from "@capacitor/core";

// Native plugin — no web implementation (only called on native path)
const AlarmPlugin = registerPlugin("AlarmPlugin");

export default AlarmPlugin;
