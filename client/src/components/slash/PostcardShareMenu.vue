<template>
  <div class="_pcShare">
    <button
      ref="trigger"
      type="button"
      :class="trigger_class"
      :disabled="disabled"
      :aria-expanded="is_open ? 'true' : 'false'"
      aria-haspopup="menu"
      @click="toggleMenu"
    >
      <b-icon
        :icon="is_busy ? 'arrow-repeat' : 'box-arrow-up'"
        :class="{ _spinner: is_busy }"
      />
      {{ $t("share") }}
    </button>

    <div
      v-if="is_open"
      ref="menu"
      class="_pcShare--menu"
      :class="'is--' + placement"
      :style="menu_style"
      role="menu"
    >
      <span class="_pcShare--arrow" :style="arrow_style" aria-hidden="true" />

      <div class="_pcShare--head">
        <div class="_pcShare--thumb">
          <img v-if="thumb_src" :src="thumb_src" alt="" />
          <b-icon v-else icon="card-image" />
        </div>
        <div class="_pcShare--headText">
          <strong class="_pcShare--title">{{ title }}</strong>
          <span class="_pcShare--subtitle">
            <template v-if="is_preparing">{{ $t("share_preparing") }}</template>
            <template v-else>
              {{ $t("share_png_image") }}
              <template v-if="file_size_label">· {{ file_size_label }}</template>
            </template>
          </span>
        </div>
      </div>

      <hr class="_pcShare--sep" />

      <button
        type="button"
        class="_pcShare--item"
        role="menuitem"
        @click="pick('downloadImage')"
      >
        <span class="_pcShare--icon"><b-icon icon="image" /></span>
        <span class="_pcShare--label">{{ $t("download_as_image") }}</span>
      </button>
      <button
        type="button"
        class="_pcShare--item"
        role="menuitem"
        @click="pick('downloadSheet')"
      >
        <span class="_pcShare--icon"><b-icon icon="grid" /></span>
        <span class="_pcShare--label">{{ $t("download_4_on_a4") }}</span>
      </button>

      <hr class="_pcShare--sep" />

      <template v-if="!show_manual_send">
        <button
          type="button"
          class="_pcShare--item"
          role="menuitem"
          :disabled="is_preparing"
          @click="sendNative"
        >
          <span class="_pcShare--icon is--send">
            <b-icon
              :icon="is_preparing ? 'arrow-repeat' : 'box-arrow-up-right'"
              :class="{ _spinner: is_preparing }"
            />
          </span>
          <span class="_pcShare--label">
            {{ $t("send_card") }}
            <small>{{ $t("send_card_hint") }}</small>
          </span>
        </button>
      </template>
      <template v-else>
        <a
          class="_pcShare--item"
          role="menuitem"
          :href="mailto_href"
          @click="closeMenu"
        >
          <span class="_pcShare--icon is--mail"><b-icon icon="envelope" /></span>
          <span class="_pcShare--label">{{ $t("email") }}</span>
        </a>
        <a
          class="_pcShare--item"
          role="menuitem"
          :href="sms_href"
          @click="closeMenu"
        >
          <span class="_pcShare--icon is--sms"><b-icon icon="chat-dots" /></span>
          <span class="_pcShare--label">{{ $t("send_by_sms") }}</span>
        </a>
        <button
          type="button"
          class="_pcShare--item"
          role="menuitem"
          :disabled="!share_url"
          @click="copyLink"
        >
          <span class="_pcShare--icon">
            <b-icon :icon="link_copied ? 'check2' : 'link-45deg'" />
          </span>
          <span class="_pcShare--label">
            {{ link_copied ? $t("share_link_copied") : $t("share_copy_link") }}
          </span>
        </button>
      </template>
    </div>
  </div>
</template>

<script>
const MENU_WIDTH = 288;
const VIEWPORT_MARGIN = 8;
const ARROW_GAP = 12;

export default {
  name: "PostcardShareMenu",
  props: {
    title: { type: String, default: "" },
    share_url: { type: String, default: "" },
    share_file: { type: [File, Blob], default: null },
    is_preparing: { type: Boolean, default: false },
    is_busy: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    trigger_class: { type: [String, Array, Object], default: "" },
  },
  data() {
    return {
      is_open: false,
      placement: "below",
      menu_left: 0,
      menu_top: 0,
      menu_bottom: 0,
      arrow_left: 0,
      thumb_src: "",
      native_share_failed: false,
      link_copied: false,
    };
  },
  computed: {
    can_native_share() {
      return (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      );
    },
    show_manual_send() {
      return !this.can_native_share || this.native_share_failed;
    },
    menu_style() {
      const style = { left: this.menu_left + "px", width: MENU_WIDTH + "px" };
      if (this.placement === "above") style.bottom = this.menu_bottom + "px";
      else style.top = this.menu_top + "px";
      return style;
    },
    arrow_style() {
      return { left: this.arrow_left + "px" };
    },
    file_size_label() {
      const size = this.share_file?.size;
      if (!size) return "";
      if (size < 1024 * 1024) return Math.round(size / 1024) + " KB";
      return (size / (1024 * 1024)).toFixed(1) + " MB";
    },
    share_text() {
      return [this.title, this.share_url].filter(Boolean).join(" — ");
    },
    mailto_href() {
      return (
        "mailto:?subject=" +
        encodeURIComponent(this.title) +
        "&body=" +
        encodeURIComponent(this.share_url)
      );
    },
    sms_href() {
      return "sms:?&body=" + encodeURIComponent(this.share_text);
    },
  },
  watch: {
    share_file: {
      immediate: true,
      handler(file) {
        this.revokeThumb();
        if (file) this.thumb_src = URL.createObjectURL(file);
      },
    },
  },
  beforeDestroy() {
    this.removeListeners();
    this.revokeThumb();
  },
  methods: {
    toggleMenu() {
      if (this.is_open) this.closeMenu();
      else this.openMenu();
    },
    openMenu() {
      this.is_open = true;
      this.native_share_failed = false;
      this.link_copied = false;
      this.updatePosition();
      this.addListeners();
      this.$emit("open");
      this.$nextTick(() => {
        const first = this.$refs.menu?.querySelector("._pcShare--item");
        first && first.focus({ preventScroll: true });
      });
    },
    closeMenu() {
      if (!this.is_open) return;
      this.is_open = false;
      this.removeListeners();
    },
    pick(event_name) {
      this.closeMenu();
      this.$emit(event_name);
    },
    updatePosition() {
      const trigger = this.$refs.trigger;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const center = rect.left + rect.width / 2;

      const width = Math.min(MENU_WIDTH, vw - VIEWPORT_MARGIN * 2);
      const left = Math.min(
        Math.max(center - width / 2, VIEWPORT_MARGIN),
        vw - width - VIEWPORT_MARGIN
      );
      this.menu_left = left;
      this.arrow_left = Math.min(Math.max(center - left, 18), width - 18);

      const space_below = vh - rect.bottom;
      this.placement = space_below < rect.top ? "above" : "below";
      this.menu_top = rect.bottom + ARROW_GAP;
      this.menu_bottom = vh - rect.top + ARROW_GAP;
    },
    addListeners() {
      document.addEventListener("pointerdown", this.onDocumentPointerDown, true);
      document.addEventListener("keydown", this.onDocumentKeydown);
      window.addEventListener("resize", this.updatePosition);
      window.addEventListener("scroll", this.updatePosition, true);
    },
    removeListeners() {
      document.removeEventListener(
        "pointerdown",
        this.onDocumentPointerDown,
        true
      );
      document.removeEventListener("keydown", this.onDocumentKeydown);
      window.removeEventListener("resize", this.updatePosition);
      window.removeEventListener("scroll", this.updatePosition, true);
    },
    onDocumentPointerDown(event) {
      if (this.$el.contains(event.target)) return;
      this.closeMenu();
    },
    onDocumentKeydown(event) {
      if (event.key === "Escape") {
        this.closeMenu();
        this.$refs.trigger && this.$refs.trigger.focus();
      }
    },
    async sendNative() {
      if (!this.can_native_share) {
        this.native_share_failed = true;
        return;
      }
      // navigator.share needs the click’s user activation: the file must
      // already be rendered, no await before this call.
      const data = { title: this.title, text: this.share_text };
      const files = this.share_file
        ? [
            this.share_file instanceof File
              ? this.share_file
              : new File([this.share_file], "postcard.png", {
                  type: "image/png",
                }),
          ]
        : null;
      if (files && navigator.canShare && navigator.canShare({ files })) {
        data.files = files;
      } else if (this.share_url) {
        data.url = this.share_url;
      }

      try {
        await navigator.share(data);
        this.closeMenu();
      } catch (err) {
        if (err?.name === "AbortError") return;
        console.warn("Native share unavailable", err);
        this.native_share_failed = true;
      }
    },
    async copyLink() {
      if (!this.share_url) return;
      try {
        await navigator.clipboard.writeText(this.share_url);
        this.link_copied = true;
      } catch (err) {
        console.warn("Copy link failed", err);
        window.prompt(this.$t("share_copy_link"), this.share_url);
      }
    },
    revokeThumb() {
      if (this.thumb_src) URL.revokeObjectURL(this.thumb_src);
      this.thumb_src = "";
    },
  },
};
</script>

<style>
._pcShare {
  display: inline-flex;
}

._pcShare--menu {
  position: fixed;
  z-index: 60;
  max-width: calc(100vw - 16px);
  padding: 0.6rem 0.4rem 0.45rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 0.85rem;
  background: rgba(58, 58, 60, 0.9);
  -webkit-backdrop-filter: blur(24px) saturate(160%);
  backdrop-filter: blur(24px) saturate(160%);
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.2);
  color: #f5f5f7;
  font-family: "Rubik", "Helvetica Neue", sans-serif;
  text-align: left;
  animation: pcShareIn 0.16s cubic-bezier(0.19, 1, 0.22, 1);
}

._pcShare--menu.is--above {
  transform-origin: bottom center;
}

._pcShare--menu.is--below {
  transform-origin: top center;
}

@keyframes pcShareIn {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

._pcShare--arrow {
  position: absolute;
  width: 14px;
  height: 14px;
  margin-left: -7px;
  background: inherit;
  border: inherit;
  transform: rotate(45deg);
}

._pcShare--menu.is--below ._pcShare--arrow {
  top: -7px;
  border-right: 0;
  border-bottom: 0;
}

._pcShare--menu.is--above ._pcShare--arrow {
  bottom: -7px;
  border-left: 0;
  border-top: 0;
}

._pcShare--head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0.6rem 0.35rem;
}

._pcShare--thumb {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.4rem;
  aspect-ratio: 148 / 105;
  overflow: hidden;
  border-radius: 3px;
  background: var(--c-slash-mint, #e5ffdb);
  color: var(--c-slash-blue, #4980c8);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

._pcShare--headText {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 0.1rem;
}

._pcShare--title {
  overflow: hidden;
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

._pcShare--subtitle {
  color: rgba(245, 245, 247, 0.7);
  font-size: 0.8rem;
}

._pcShare--sep {
  position: relative;
  margin: 0.4rem 0.6rem;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

._pcShare--item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.35rem 0.6rem;
  border: 0;
  border-radius: 0.4rem;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.92rem;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}

._pcShare--item:hover:not(:disabled),
._pcShare--item:focus-visible {
  outline: none;
  background: var(--c-slash-blue, #4980c8);
  color: #fff;
}

._pcShare--item:disabled {
  opacity: 0.55;
  cursor: progress;
}

._pcShare--icon {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 0.4rem;
  background: rgba(255, 255, 255, 0.14);
  font-size: 0.95rem;
}

._pcShare--icon.is--send {
  background: var(--c-slash-orange, #ff5829);
  color: #fff;
}

._pcShare--icon.is--mail {
  background: #3b8cf5;
  color: #fff;
}

._pcShare--icon.is--sms {
  background: #34c759;
  color: #fff;
}

._pcShare--label {
  display: flex;
  flex-direction: column;
  min-width: 0;

  small {
    color: rgba(245, 245, 247, 0.65);
    font-size: 0.72rem;
    line-height: 1.25;
  }
}

._pcShare--item:hover:not(:disabled) small,
._pcShare--item:focus-visible small {
  color: rgba(255, 255, 255, 0.85);
}

._pcShare ._spinner {
  animation: pcShareSpin 0.8s linear infinite;
}

@keyframes pcShareSpin {
  to {
    transform: rotate(360deg);
  }
}
</style>
