// JARVIS V8 — Background music controller

import { log, logOK, logError, logWarning } from "./logger.js";

const DEFAULT_PLAYLIST = [
  { name: "Thunderstruck", file: "music/thunderstruck.mp3" },
  { name: "Shoot to Thrill", file: "music/shoot-to-thrill.mp3" }
];

export function createMusicController({ playlist = DEFAULT_PLAYLIST, duckFactor = 0.18 } = {}) {
  const player = new Audio();
  player.preload = "auto";
  player.playsInline = true;
  player.setAttribute("playsinline", "");

  let audioContext = null;
  let source = null;
  let gain = null;
  let index = -1;
  let enabled = false;
  let volume = 0.04;

  const setGain = (value) => {
    if (!gain || !audioContext) return;
    const now = audioContext.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setTargetAtTime(Math.max(0, Math.min(1, value)), now, 0.05);
  };

  const initAudio = () => {
    if (audioContext) {
      if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
      return;
    }
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      source = audioContext.createMediaElementSource(player);
      gain = audioContext.createGain();
      source.connect(gain);
      gain.connect(audioContext.destination);
      setGain(volume);
      logOK("🎚️ Contrôle volume musique activé.");
    } catch (error) {
      logError(`Audio Web indisponible : ${error.message}`);
    }
  };

  const apply = (ducked = false) => setGain(ducked ? volume * duckFactor : volume);

  const play = async (trackIndex = index < 0 ? 0 : index) => {
    if (!playlist.length) return false;
    initAudio();
    if (audioContext?.state === "suspended") await audioContext.resume().catch(() => {});

    index = ((trackIndex % playlist.length) + playlist.length) % playlist.length;
    const track = playlist[index];
    player.src = track.file;
    player.load();
    enabled = true;

    try {
      await player.play();
      apply(false);
      logOK(`🎵 Lecture fond : ${track.name}`);
      return true;
    } catch {
      logWarning("🎵 Lecture bloquée : appui utilisateur requis.");
      return false;
    }
  };

  player.addEventListener("ended", () => {
    if (enabled) play(index + 1);
  });

  return {
    player,
    async toggle() {
      initAudio();
      if (!player.src) return play(0);
      if (player.paused) {
        enabled = true;
        await player.play().catch(() => {});
        apply(false);
      } else {
        player.pause();
      }
    },
    next: () => play(index + 1),
    previous: () => play(index - 1),
    stop() {
      enabled = false;
      player.pause();
      player.currentTime = 0;
      apply(false);
    },
    setVolume(percent) {
      volume = Math.max(0, Math.min(1, Number(percent) / 100));
      apply(false);
    },
    duck() { if (enabled) apply(true); },
    restore() { if (enabled) apply(false); },
    getTrack() { return index >= 0 ? playlist[index] : null; },
    getVolume() { return volume; }
  };
}
