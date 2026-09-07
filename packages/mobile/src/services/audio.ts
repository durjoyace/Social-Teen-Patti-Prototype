import { Audio } from "expo-av";
import { usePreferences } from "../stores/preferences";
export async function playTurn() {
  if (!usePreferences.getState().sound) return;
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/turn.wav"),
      { shouldPlay: true, volume: 0.4 },
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) void sound.unloadAsync();
    });
  } catch {
    /* Sound must not prevent a turn. */
  }
}
