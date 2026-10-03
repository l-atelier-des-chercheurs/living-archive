<template>
  <portal to="destination">
    <div
      class="_gateScreen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-gate-title"
    >
      <button
        type="button"
        class="u-button u-button_icon _gateScreen--close"
        :title="$t('close')"
        @click="$emit('close')"
      >
        <b-icon icon="x-lg" :label="$t('close')" />
      </button>

      <div class="_gateScreen--inner">
        <header class="_gateScreen--header">
          <SlashLogo class="_gateScreen--logo" />
          <h1 id="login-gate-title" class="_gateScreen--title">
            <template v-if="is_logged_in">{{ connected_as.name }}</template>
            <template v-else>{{ $t("hello_slashers") }}</template>
          </h1>
          <p v-if="!is_logged_in" class="_gateScreen--subtitle">
            {{ $t("login_modal_description") }}
          </p>
          <p v-if="is_logged_in && connected_as_group" class="_gateScreen--subtitle">
            {{ connected_as_group }}
          </p>
        </header>

        <div v-if="!is_logged_in" class="_gateScreen--body">
          <div class="_gateScreen--field _gateScreen--dodoc">
            <LoginAs v-if="mode === 'login'" :authors="sorted_authors" />
            <template v-else>
              <button
                type="button"
                class="u-buttonLink _gateScreen--link"
                @click="mode = 'login'"
              >
                <b-icon icon="arrow-left-short" />
                {{ $t("back") }}
              </button>
              <CreateAuthor />
            </template>
          </div>

          <button
            v-if="mode === 'login'"
            type="button"
            class="u-buttonLink _gateScreen--link"
            @click="mode = 'create'"
          >
            {{ $t("create_account") }}
          </button>
        </div>

        <template v-else>
          <div class="_gateScreen--body">
            <div class="_gateScreen--field">
              <ColorInput
                :label="$t('color')"
                :value="connected_as.color"
                :allow_transparent="false"
                :can_toggle="false"
                :default_value="suggested_colors[0]"
                :default_colors="suggested_colors"
                @save="updateConnectedAs({ color: $event })"
              />
            </div>
          </div>
          <div class="_gateScreen--actions">
            <button type="button" class="u-button u-button_red" @click="logout()">
              {{ $t("logout") }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </portal>
</template>
<script>
import randomcolor from "randomcolor";
import SlashLogo from "@/components/nav/SlashLogo.vue";
import LoginAs from "@/adc-core/author/LoginAs.vue";
import CreateAuthor from "@/adc-core/author/CreateAuthor.vue";

export default {
  props: {},
  components: {
    SlashLogo,
    LoginAs,
    CreateAuthor,
  },
  data() {
    return {
      mode: "login",
      authors: [],
    };
  },
  async created() {
    await this.fetchAuthors();
  },
  watch: {
    // LoginAs is unmounted as soon as connected_as is set, before it can emit
    // loggedIn: close here so the user stays on the page they logged in from
    is_logged_in(now, before) {
      if (now && !before) this.onLoggedIn();
    },
  },
  computed: {
    is_logged_in() {
      return !!this.connected_as;
    },
    connected_as_group() {
      const g = this.connected_as?.group;
      return Array.isArray(g) && g.length ? g.join(", ") : "";
    },
    suggested_colors() {
      return randomcolor({
        luminosity: "light",
        count: 25,
      });
    },
    sorted_authors() {
      return this.authors
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
    },
  },
  methods: {
    async fetchAuthors() {
      try {
        this.authors = await this.$api.getFolders({ path: "authors" });
      } catch (e) {
        console.error("Failed to fetch authors", e);
      }
    },
    onLoggedIn() {
      this.$alertify.success(this.$t("login"));
      this.$emit("close");
    },
    async logout() {
      if (this.$api.tokenpath.token_path) {
        await this.$api.logoutFromFolder();
      }
      this.$alertify.success(this.$t("logout"));
    },
    async updateConnectedAs(meta) {
      await this.$api.updateMeta({
        path: this.connected_as.$path,
        new_meta: meta,
      });
    },
  },
};
</script>
<style lang="scss" scoped>
._gateScreen {
  --gate-bg: var(--c-slash-blue, var(--c-bleuvert));
  --gate-fg: var(--c-slash-mint, #e5ffdb);
  --gate-accent: var(--c-slash-burgundy, var(--c-rouge));

  position: fixed;
  inset: 0;
  z-index: 9500;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: auto;
  padding: calc(var(--spacing) * 2);
  background: var(--gate-bg);
  color: var(--gate-fg);
  animation: gateReveal 0.45s cubic-bezier(0.19, 1, 0.22, 1);
}

._gateScreen--close {
  position: absolute;
  top: calc(var(--spacing) * 1.25);
  right: calc(var(--spacing) * 1.25);
  color: var(--gate-fg);
  z-index: 1;

  &:hover,
  &:focus-visible {
    background: color-mix(in srgb, var(--gate-fg) 15%, transparent);
  }
}

._gateScreen--inner {
  width: 100%;
  max-width: 28rem;
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing) * 2);
}

._gateScreen--header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: calc(var(--spacing) * 1.25);
}

._gateScreen--logo {
  width: clamp(7.5rem, 18vw, 9.5rem);
  height: auto;
  color: var(--gate-fg);
}

._gateScreen--title {
  margin: 0;
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
  color: var(--gate-fg);
}

._gateScreen--subtitle {
  margin: 0;
  font-size: var(--sl-font-size-normal);
  line-height: 1.5;
  color: color-mix(in srgb, var(--gate-fg) 85%, transparent);
}

._gateScreen--body {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing));
}

._gateScreen--field {
  .u-label {
    color: color-mix(in srgb, var(--gate-fg) 80%, transparent);
  }

  .u-input,
  select {
    background: color-mix(in srgb, var(--gate-fg) 12%, transparent);
    color: var(--gate-fg);
    border-color: transparent;

    &:hover {
      background: color-mix(in srgb, var(--gate-fg) 18%, transparent);
    }

    &:focus {
      background: color-mix(in srgb, var(--gate-fg) 18%, transparent);
      border-color: var(--gate-fg);
    }

    option,
    optgroup {
      color: var(--c-noir);
      background: white;
    }
  }

  ::v-deep .u-label,
  ::v-deep label {
    color: color-mix(in srgb, var(--gate-fg) 80%, transparent);
  }
}

._gateScreen--link {
  align-self: flex-start;
  color: var(--gate-fg);
}

._gateScreen--dodoc {
  ::v-deep input,
  ::v-deep select,
  ::v-deep textarea {
    background: color-mix(in srgb, var(--gate-fg) 12%, transparent);
    color: var(--gate-fg);
    border-color: transparent;

    &:hover,
    &:focus {
      background: color-mix(in srgb, var(--gate-fg) 18%, transparent);
    }

    &:focus {
      border-color: var(--gate-fg);
    }

    &::placeholder {
      color: color-mix(in srgb, var(--gate-fg) 55%, transparent);
    }
  }

  ::v-deep option,
  ::v-deep optgroup {
    color: var(--c-noir);
    background: white;
  }

  ::v-deep fieldset,
  ::v-deep legend,
  ::v-deep .u-instructions,
  ::v-deep a {
    color: var(--gate-fg);
  }

  ::v-deep .u-button_bleuvert {
    background: var(--gate-fg);
    color: var(--gate-accent);
    font-weight: 600;
  }

  ::v-deep .u-buttonLink,
  ::v-deep .u-warning {
    color: var(--gate-fg);
  }
}

._gateScreen--actions {
  display: flex;
  justify-content: flex-start;
  gap: calc(var(--spacing) / 2);
}

._gateScreen--cta {
  background: var(--gate-fg);
  color: var(--gate-accent);
  font-weight: 600;
  padding: calc(var(--spacing) / 2) calc(var(--spacing) * 1.25);

  &:hover,
  &:focus-visible {
    &:not([disabled]) {
      background: white;
      color: var(--gate-accent);
    }
  }

  &[disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

@keyframes gateReveal {
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
