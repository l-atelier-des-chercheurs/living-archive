// Only formats that play natively on iOS and Android browsers from the last
// ~5 years (Safari 14+, Chrome 90+). Extensions are what iOS's picker filters
// on, MIME types are what Android pickers filter on.
export const AUDIO_ACCEPT = [
  ".mp3",
  ".m4a",
  ".aac",
  ".wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/wav",
  "audio/x-wav",
].join(",");

export const IS_IOS =
  /iP(hone|ad|od)/.test(navigator.userAgent) ||
  // iPadOS reports itself as a Mac
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
