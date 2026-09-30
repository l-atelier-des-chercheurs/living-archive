<template>
  <portal to="destination">
    <div
      class="_contributeModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contribute-modal-title"
      @click.self="$emit('close')"
    >
      <div class="_contributeModal--inner">
        <button
          type="button"
          class="u-button u-button_icon _contributeModal--close"
          :title="$t('close')"
          @click="$emit('close')"
        >
          <b-icon icon="x-lg" :label="$t('close')" />
        </button>

        <header class="_contributeModal--header">
          <SlashLogo class="_contributeModal--logo" />
          <h1 id="contribute-modal-title" class="_contributeModal--title">
            {{ folder_title || $t("untitled_folder") }}
          </h1>
          <p v-if="connected_as" class="_contributeModal--user">
            <span
              class="_contributeModal--userColor"
              :style="{ backgroundColor: connected_as.color }"
            />
            {{ connected_as.name }}
          </p>
          <p class="_contributeModal--lead">
            {{ $t("contribute_modal_lead") }}
          </p>
        </header>

        <div class="_contributeModal--actions">
          <DropMenuPanel
            class="_contributeModal--panel"
            :folder_path="folder_path"
            :additional_meta="additional_meta"
            :show_labels="true"
            :stacked="true"
            @close="$emit('close')"
          />
        </div>
      </div>
    </div>
  </portal>
</template>

<script>
import DropMenuPanel from "@/components/slash/DropMenuPanel.vue";
import SlashLogo from "@/components/nav/SlashLogo.vue";

export default {
  name: "ContributeModal",
  components: {
    DropMenuPanel,
    SlashLogo,
  },
  props: {
    folder_title: {
      type: String,
      default: "",
    },
    folder_path: {
      type: String,
      required: true,
    },
    additional_meta: {
      type: Object,
      default: () => ({}),
    },
  },
};
</script>

<style lang="scss" scoped>
._contributeModal {
  --gate-bg: var(--c-slash-blue, var(--c-bleuvert));
  --gate-fg: var(--c-slash-mint, #e5ffdb);
  --gate-accent: var(--c-slash-burgundy, var(--c-rouge));

  position: fixed;
  inset: 0;
  z-index: 9400;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: calc(var(--spacing) * 2);
  padding-bottom: calc(var(--spacing) * 2 + env(safe-area-inset-bottom, 0px));
  background: color-mix(in srgb, var(--gate-bg) 72%, transparent);
  color: var(--gate-fg);
  animation: contributeReveal 0.35s cubic-bezier(0.19, 1, 0.22, 1);
  backdrop-filter: blur(2px);
}

._contributeModal--close {
  position: absolute;
  top: calc(var(--spacing));
  right: calc(var(--spacing));
  color: var(--gate-fg);
  z-index: 1;

  &:hover,
  &:focus-visible {
    background: color-mix(in srgb, var(--gate-fg) 15%, transparent);
  }
}

._contributeModal--inner {
  position: relative;
  width: 100%;
  max-width: 24rem;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 2);
  padding: calc(var(--spacing) * 1.75);
  background: var(--gate-bg);
  color: var(--gate-fg);
  box-shadow: 0 12px 40px color-mix(in srgb, black 25%, transparent);
}

._contributeModal--header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--spacing));
}

._contributeModal--logo {
  width: clamp(5.5rem, 22vw, 7.5rem);
  height: auto;
  color: var(--gate-fg);
}

._contributeModal--title {
  margin: 0;
  font-size: clamp(1.75rem, 6vw, 2.25rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--gate-fg);
  word-break: break-word;
}

._contributeModal--user {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  margin: 0;
  font-size: var(--sl-font-size-medium);
  font-weight: 600;
  color: color-mix(in srgb, var(--gate-fg) 90%, transparent);
}

._contributeModal--userColor {
  display: inline-block;
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 50%;
  flex-shrink: 0;
}

._contributeModal--lead {
  margin: 0;
  font-size: var(--sl-font-size-normal);
  line-height: 1.45;
  color: color-mix(in srgb, var(--gate-fg) 80%, transparent);
}

._contributeModal--actions {
  width: 100%;
}

._contributeModal--panel {
  width: 100%;

  ::v-deep ._dropMenu--btn {
    background: var(--gate-fg);
    color: var(--gate-accent);
    font-weight: 700;
    font-size: var(--sl-font-size-medium);
    border: none;
    border-radius: 0;

    &:hover,
    &:focus-visible {
      background: white;
      color: var(--gate-accent);
    }
  }

  ::v-deep ._dropMenu--icon {
    font-size: 1.35rem;
    line-height: 0;
  }
}

@keyframes contributeReveal {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
