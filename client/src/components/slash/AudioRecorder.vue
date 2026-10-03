<template>
  <BaseModal2 :title="$t('record_audio')" @close="$emit('close')">
    <div class="_audioRecorder">
      <button
        type="button"
        class="_audioRecorder--btn"
        :class="{ 'is--recording': is_recording }"
        :style="{ '--level': level }"
        :disabled="is_starting"
        @click="is_recording ? stopRecording() : startRecording()"
      >
        <b-icon
          :icon="is_recording ? 'stop-fill' : 'record-circle-fill'"
          :label="is_recording ? $t('stop_recording') : $t('start_recording')"
        />
      </button>
      <div class="_audioRecorder--status">
        <template v-if="is_recording">{{ formatted_duration }}</template>
        <template v-else>{{ $t("start_recording") }}</template>
      </div>
      <p v-if="error" class="_audioRecorder--error">{{ error }}</p>

      <div v-if="allow_import && !is_recording" class="_audioRecorder--import">
        <label :for="import_id" class="u-button u-button_small">
          <b-icon icon="file-earmark-music" />
          {{ $t("import_audio") }}
        </label>
        <input
          :id="import_id"
          type="file"
          class="_audioRecorder--fileInput"
          :accept="audio_accept"
          @change="onFileSelect"
        />
        <p v-if="is_ios" class="_audioRecorder--hint">
          {{ $t("ios_voice_memos_hint") }}
        </p>
      </div>
    </div>
  </BaseModal2>
</template>
<script>
import { AUDIO_ACCEPT, IS_IOS } from "@/utils/audioUtils.js";

// Ordered by playback compatibility: AAC in MP4 plays on every iOS/Android
// browser, WebM/Ogg are fallbacks for browsers that can't record MP4 (Firefox).
const MIME_CANDIDATES = [
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
];

export default {
  name: "AudioRecorder",
  props: {
    // Also offer picking an existing file, for callers with a single entry point
    allow_import: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      import_id: `_audioRecorder--file-${Math.random().toString(36).slice(2, 10)}`,
      audio_accept: AUDIO_ACCEPT,
      is_ios: IS_IOS,
      is_starting: false,
      is_recording: false,
      started_at: null,
      duration: 0,
      level: 0,
      error: null,
    };
  },
  beforeDestroy() {
    this.discard = true;
    if (this.recorder && this.recorder.state !== "inactive")
      this.recorder.stop();
    this.cleanup();
  },
  computed: {
    formatted_duration() {
      const s = Math.floor(this.duration / 1000);
      return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    },
  },
  methods: {
    async startRecording() {
      this.error = null;
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        this.error = this.$t("couldnt_load_getusermedia");
        return;
      }

      this.is_starting = true;
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
      } catch (err) {
        console.error(err);
        this.error = this.$t("couldnt_load_getusermedia");
        this.is_starting = false;
        return;
      }

      try {
        const mimeType = MIME_CANDIDATES.find(
          (t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)
        );
        this.recorder = new MediaRecorder(
          this.stream,
          mimeType ? { mimeType } : undefined
        );
        this.chunks = [];
        this.recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) this.chunks.push(e.data);
        };
        this.recorder.onstop = this.onRecorderStop;
        this.recorder.start();
      } catch (err) {
        console.error(err);
        this.error = this.$t("failed_to_start_recording");
        this.cleanup();
        this.is_starting = false;
        return;
      }

      this.startLevelMeter();
      this.started_at = Date.now();
      this.duration = 0;
      this.timer = setInterval(() => {
        this.duration = Date.now() - this.started_at;
      }, 250);
      this.is_recording = true;
      this.is_starting = false;
    },
    stopRecording() {
      if (this.recorder && this.recorder.state !== "inactive")
        this.recorder.stop();
      this.is_recording = false;
    },
    onRecorderStop() {
      const type = this.recorder.mimeType || this.chunks[0]?.type || "";
      const blob = new Blob(this.chunks, { type });
      this.cleanup();
      if (this.discard || blob.size === 0) return;

      const file = new File([blob], `audio-${+new Date()}.${this.extFor(type)}`, {
        type: blob.type,
      });
      this.$emit("file", file);
    },
    onFileSelect($event) {
      const file = $event.target.files && $event.target.files[0];
      $event.target.value = "";
      if (file) this.$emit("file", file);
    },
    extFor(type) {
      // Server types media by extension: .webm would be seen as video
      if (type.startsWith("audio/mp4")) return "m4a";
      if (type.includes("ogg")) return "ogg";
      return "weba";
    },
    startLevelMeter() {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.audio_ctx = new Ctx();
      // iOS may create it suspended since we're past the tap (getUserMedia await)
      if (this.audio_ctx.state === "suspended")
        this.audio_ctx.resume().catch(() => {});
      const source = this.audio_ctx.createMediaStreamSource(this.stream);
      const analyser = this.audio_ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        // Speech RMS sits around 0.02–0.2, stretch it to 0–1
        const target = Math.min(1, Math.sqrt(sum / data.length) * 6);
        // Fast attack, slow release so the color doesn't flicker
        this.level =
          target > this.level ? target : this.level * 0.9 + target * 0.1;
        this.raf = requestAnimationFrame(tick);
      };
      tick();
    },
    cleanup() {
      clearInterval(this.timer);
      cancelAnimationFrame(this.raf);
      if (this.audio_ctx) this.audio_ctx.close().catch(() => {});
      this.audio_ctx = null;
      if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
      this.level = 0;
      this.is_recording = false;
    },
  },
};
</script>
<style lang="scss" scoped>
._audioRecorder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--spacing));
  padding: calc(var(--spacing) * 2) 0;
}

._audioRecorder--btn {
  --level: 0;

  display: flex;
  align-items: center;
  justify-content: center;
  width: 6rem;
  height: 6rem;
  // Room for the volume ring, which box-shadow draws outside the layout
  margin: 1.5rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--c-gris_clair, #eee);
  color: var(--c-rouge, #e84a3c);
  font-size: 3.5rem;
  line-height: 0;
  cursor: pointer;

  // Volume ring: grows from a hairline to 1.5rem with the input level
  &.is--recording {
    box-shadow: 0 0 0 calc(2px + var(--level) * 1.5rem)
      color-mix(in srgb, var(--c-rouge, #e84a3c) 60%, transparent);
  }

  &:disabled {
    opacity: 0.5;
    cursor: wait;
  }
}

._audioRecorder--status {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

._audioRecorder--import {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  margin-top: calc(var(--spacing));
}

._audioRecorder--hint {
  margin: 0;
  max-width: 20rem;
  font-size: var(--sl-font-size-small);
  text-align: center;
  opacity: 0.8;
}

._audioRecorder--fileInput {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  pointer-events: none;
}

._audioRecorder--error {
  margin: 0;
  color: var(--c-rouge, #e84a3c);
  text-align: center;
}
</style>
