<template>
  <div
    v-if="!$api.connected && is_visible"
    class="_disconnectModal"
    role="status"
    :title="$t('connection_lost_in')"
  >
    <span class="_disconnectModal--dot" aria-hidden="true" />
    <span class="_disconnectModal--label">
      {{ $t("connection_lost_short") }}
      <span v-if="!is_reconnecting" class="_disconnectModal--countdown">
        · {{ reconnecting_in }}s
      </span>
    </span>

    <button
      type="button"
      class="_disconnectModal--retry"
      :disabled="is_reconnecting"
      @click="reconnectSocket"
    >
      <LoaderSpinner v-if="is_reconnecting" class="_spinner" />
      <template v-else>{{ $t("retry") }}</template>
    </button>

    <a
      v-if="
        failed_attempts >= 3 && $root.app_infos.instance_meta.contactmail
      "
      class="_disconnectModal--contact"
      :href="'mailto:' + $root.app_infos.instance_meta.contactmail"
      :title="
        $t('if_issues_contact') + $root.app_infos.instance_meta.contactmail
      "
      target="_blank"
    >
      <b-icon icon="envelope" :label="$t('if_issues_contact')" />
    </a>
  </div>
</template>
<script>
// Short drops (phone locked, tab in background) reconnect on their own:
// only show the badge once we've been offline for a little while.
const SHOW_AFTER_MS = 3000;

export default {
  props: {},
  components: {},
  data() {
    return {
      reconnecting_in: 4,
      subsequent_reconnection_delay: 10,

      is_reconnecting: false,
      is_visible: false,
      failed_attempts: 0,
      countdown: undefined,
    };
  },
  async created() {
    this.show_timer = setTimeout(() => {
      this.is_visible = true;
    }, SHOW_AFTER_MS);

    // try to reconnect first
    this.$api.reconnectSocket();
    await new Promise((r) => setTimeout(r, 1000));

    (this.countdown = async () => {
      if (this.reconnecting_in > 1) this.reconnecting_in--;
      else await this.reconnectSocket();
      if (!this.$api.connected) window.setTimeout(this.countdown, 1000);
    })();
  },
  mounted() {},
  beforeDestroy() {
    clearTimeout(this.show_timer);
    window.clearTimeout(this.countdown);
  },
  watch: {
    "$api.connected": function () {
      if (this.$api.connected) this.$emit("close");
    },
  },
  computed: {},
  methods: {
    async reconnectSocket() {
      this.is_reconnecting = true;
      this.$api.reconnectSocket();

      await new Promise((r) => setTimeout(r, 1000));
      this.is_reconnecting = false;
      if (!this.$api.connected) this.failed_attempts++;
      this.reconnecting_in = this.subsequent_reconnection_delay;
    },
  },
};
</script>
<style lang="scss" scoped>
._disconnectModal {
  position: fixed;
  // bottom-left holds the canvas minimap
  right: var(--fixed-ui-margins, 0.75rem);
  // pages with a fixed bottom bar (postcard) publish its height
  bottom: calc(
    var(--fixed-ui-margins, 0.75rem) +
      max(var(--fixed-bottom-bar-height, 0px), env(safe-area-inset-bottom, 0px))
  );
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  max-width: calc(100vw - 2 * var(--fixed-ui-margins, 0.75rem));
  padding: calc(var(--spacing) / 4) calc(var(--spacing) / 4)
    calc(var(--spacing) / 4) calc(var(--spacing) / 1.5);
  border-radius: 2rem;
  background: color-mix(in srgb, #262626 88%, transparent);
  color: white;
  font-size: var(--sl-font-size-small);
  line-height: 1.2;
  box-shadow: 0 2px 12px color-mix(in srgb, black 20%, transparent);
  animation: disconnectIn 0.3s ease-out;
}

._disconnectModal--dot {
  flex-shrink: 0;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--c-orange, #ff9a3c);
  animation: disconnectPulse 1.6s ease-in-out infinite;
}

._disconnectModal--label {
  white-space: nowrap;
}

._disconnectModal--countdown {
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

._disconnectModal--retry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.5rem;
  min-height: 1.75rem;
  padding: 0 calc(var(--spacing) / 1.5);
  border: none;
  border-radius: 2rem;
  background: color-mix(in srgb, white 18%, transparent);
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: color-mix(in srgb, white 30%, transparent);
  }
  &:disabled {
    cursor: default;
  }
}

._disconnectModal--contact {
  display: inline-flex;
  padding: 0 calc(var(--spacing) / 2);
  color: inherit;
  opacity: 0.7;

  &:hover {
    opacity: 1;
  }
}

._spinner {
  position: relative;
  display: inline-block;
  width: 1rem;
  height: 1rem;
  background-color: transparent;

  ::v-deep ._spinner {
    width: 0.9rem;
    height: 0.9rem;
  }
}

@keyframes disconnectIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

@keyframes disconnectPulse {
  50% {
    opacity: 0.35;
  }
}
</style>
