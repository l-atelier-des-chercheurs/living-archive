<template>
  <div class="_publicPublication">
    <component :is="'style'">
      {{ print_page_css }}
    </component>

    <div v-if="is_loading" class="u-divCentered">
      <LoaderSpinner />
    </div>
    <div v-else-if="load_error" class="_publicPublication--error">
      <span class="u-warning" v-html="$t('error:') + ' ' + load_error" />
    </div>
    <PostcardView
      v-else-if="publication.template === 'postcard'"
      :key="$route.params.publication_slug"
    />
    <div
      v-else-if="publication.template === 'edition'"
      class="_publicPublication is--consult"
      :class="{ 'is--export': is_export }"
    >
      <header v-if="!is_export" class="_consult--header">
        <SiteBrand :link_home="true" :compact="true" />
      </header>

      <div class="_consult--body">
        <EditionExport
          :publication="publication"
          :default_view_mode="'book'"
        />
      </div>

      <div v-if="!is_export" class="_consult--actions">
        <div v-if="can_browse" class="_consult--browse">
          <button
            type="button"
            class="_consult--btn is--icon"
            :disabled="!previous_slug"
            :title="$t('previous')"
            @click="goToPublication(previous_slug)"
          >
            <b-icon icon="arrow-left" :label="$t('previous')" />
          </button>
          <span class="_consult--count">
            {{ sibling_index + 1 }} / {{ sibling_slugs.length }}
          </span>
          <button
            type="button"
            class="_consult--btn is--icon"
            :disabled="!next_slug"
            :title="$t('next')"
            @click="goToPublication(next_slug)"
          >
            <b-icon icon="arrow-right" :label="$t('next')" />
          </button>
        </div>
        <PostcardShareMenu
          trigger_class="_consult--btn"
          :show_file_actions="false"
          :title="publication.title || ''"
          :share_url="share_url"
        />
        <router-link
          v-if="can_edit_publication"
          class="_consult--btn"
          :to="{
            name: 'RootPublication',
            params: { publication_slug: $route.params.publication_slug },
          }"
        >
          <b-icon icon="pencil" />
          {{ $t("edit") }}
        </router-link>
        <button
          v-if="can_edit_publication"
          type="button"
          class="_consult--btn"
          @click="show_remove_menu = true"
        >
          <b-icon icon="trash" />
          {{ $t("remove") }}
        </button>
      </div>

      <RemoveMenu2
        v-if="show_remove_menu && publication.$path"
        :path="publication.$path"
        :modal_title="$t('remove_publication', { name: publication.title })"
        :modal_expl="$t('remove_publication_expl')"
        :success_notification="$t('publication_was_removed')"
        @close="show_remove_menu = false"
        @removedSuccessfully="onPublicationRemoved"
      />
    </div>
    <div v-else class="_publicPublication--error">
      <span class="u-warning">{{ $t("page_failed_to_load") }}</span>
    </div>
  </div>
</template>
<script>
import DynamicTitle from "@/mixins/DynamicTitle.js";
import SiteBrand from "@/components/nav/SiteBrand.vue";
import PostcardShareMenu from "@/components/slash/PostcardShareMenu.vue";
import {
  getRootPublicationPath,
  getRootPublicationsPath,
  browsePublicationSlugs,
} from "@/utils/folderPublications.js";

export default {
  name: "PublicPublicationView",
  mixins: [DynamicTitle],
  components: {
    PostcardView: () => import("@/views/PostcardView.vue"),
    EditionExport: () =>
      import("@/components/publications/edition/EditionExport.vue"),
    SiteBrand,
    PostcardShareMenu,
  },
  data() {
    return {
      publication: null,
      is_loading: true,
      load_error: "",
      show_remove_menu: false,
      sibling_slugs: [],
    };
  },
  async created() {
    await this.loadPublication();
  },
  watch: {
    "$route.params.publication_slug"() {
      this.show_remove_menu = false;
      this.loadPublication();
    },
  },
  computed: {
    publication_path() {
      return getRootPublicationPath(this.$route.params.publication_slug);
    },
    print_page_css() {
      if (this.publication?.template !== "edition") return "";
      return `@page { margin: 0mm; }`;
    },
    can_edit_publication() {
      if (this.publication?.template !== "edition") return false;
      if (this.$route.query?.superadmintoken) return false;
      const token_path = this.editor_token_path;
      if (!token_path) return false;
      const instance_admins = this.$root.app_infos?.instance_meta?.$admins;
      if (
        instance_admins === "everyone" ||
        (Array.isArray(instance_admins) && instance_admins.includes(token_path))
      ) {
        return true;
      }
      if (this.publication.$admins === "everyone") return true;
      return (
        Array.isArray(this.publication.$admins) &&
        this.publication.$admins.includes(token_path)
      );
    },
    editor_token_path() {
      if (this.$api.tokenpath?.token_path) return this.$api.tokenpath.token_path;
      try {
        const raw = localStorage.getItem("tokenpath");
        if (!raw) return "";
        return JSON.parse(raw).token_path || "";
      } catch (err) {
        return "";
      }
    },
    is_export() {
      return Boolean(this.$route.query?.superadmintoken);
    },
    share_url() {
      const publication_slug = this.$route.params.publication_slug;
      if (!publication_slug) return "";
      const resolved = this.$router.resolve({
        name: "PublicPublication",
        params: { publication_slug },
      });
      try {
        return new URL(resolved.href, window.location.origin).href;
      } catch (err) {
        return resolved.href;
      }
    },
    sibling_index() {
      return this.sibling_slugs.indexOf(this.$route.params.publication_slug);
    },
    can_browse() {
      return this.sibling_index !== -1 && this.sibling_slugs.length > 1;
    },
    previous_slug() {
      return this.sibling_slugs[this.sibling_index - 1] || "";
    },
    next_slug() {
      return this.sibling_slugs[this.sibling_index + 1] || "";
    },
  },
  methods: {
    async loadPublication() {
      this.is_loading = true;
      this.load_error = "";
      try {
        const publication = await this.$api.getPublicFolder({
          path: this.publication_path,
          superadmintoken: this.$route.query?.superadmintoken,
        });
        if (!publication?.$path) {
          const err = new Error("folder_not_public");
          err.code = "folder_not_public";
          throw err;
        }
        this.publication = publication;
        if (publication.title) this.updateDocumentTitle(publication.title);
        if (publication.template === "edition" && !this.is_export) {
          this.loadSiblingPublications();
        }
      } catch (err) {
        const code = err?.code || err?.message;
        this.load_error =
          code === "folder_not_public"
            ? this.$t("folder_not_public")
            : code || this.$t("page_failed_to_load");
      } finally {
        this.is_loading = false;
        this.$root.is_loading = false;
      }
    },
    async loadSiblingPublications() {
      const needs_general_password =
        this.$root.app_infos?.instance_meta?.has_general_password === true &&
        !this.$api.general_password &&
        !localStorage.getItem("general_password");
      if (needs_general_password) return;
      try {
        if (!this.$api.general_password) {
          this.$api.general_password =
            localStorage.getItem("general_password") || "";
          this.$api.setAuthorizationHeader();
        }
        const publications = await this.$api.getFolders({
          path: getRootPublicationsPath(),
        });
        this.sibling_slugs = browsePublicationSlugs(publications);
      } catch (err) {
        this.sibling_slugs = [];
      }
    },
    goToPublication(slug) {
      if (!slug) return;
      this.$router.push({
        name: "PublicPublication",
        params: { publication_slug: slug },
      });
    },
    onPublicationRemoved() {
      this.show_remove_menu = false;
      this.$router.push({ name: "Accueil" });
    },
  },
};
</script>
<style lang="scss" scoped>
._publicPublication {
  min-height: 100%;
  background: white;
}

._publicPublication--error {
  padding: calc(var(--spacing) * 2);
  text-align: center;
  max-width: 86ch;
  margin: 0 auto;
}

._publicPublication.is--consult {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  padding: calc(var(--spacing) * 2);
  padding-bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

._publicPublication.is--export {
  min-height: 0;
  padding: 0;
}

._consult--header {
  --site-brand-color: var(--c-slash-burgundy, #87221d);
  flex-shrink: 0;
  margin-bottom: calc(var(--spacing) * 1.5);
}

._consult--body {
  flex: 1 1 auto;
  min-height: 0;

  ::v-deep ._editionExport,
  ::v-deep ._viewContent {
    height: 100%;
  }
}

._consult--actions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: safe center;
  gap: 0.5rem;
  padding: 0.75rem clamp(1rem, 4vw, 2rem)
    calc(0.75rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid color-mix(in srgb, var(--c-slash-blue, #4980c8) 18%, white);
  background: #fff;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.06);
}

._consult--browse {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-right: 0.5rem;
}

._consult--count {
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  color: #5a5a5a;
}
</style>
<style lang="scss">
._consult--actions ._consult--btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid color-mix(in srgb, var(--c-slash-burgundy, #87221d) 35%, white);
  border-radius: 999px;
  background: #fff;
  color: var(--c-slash-burgundy, #87221d);
  font-family: "Rubik", "Helvetica Neue", sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}

._consult--actions ._consult--btn.is--icon {
  padding: 0.35rem;
}

._consult--actions ._consult--btn:hover,
._consult--actions ._consult--btn:focus-visible {
  outline: none;
  border-color: var(--c-slash-burgundy, #87221d);
  background: color-mix(in srgb, var(--c-slash-mint, #e5ffdb) 55%, white);
}

._consult--actions ._consult--btn:disabled {
  opacity: 0.4;
  cursor: default;
}

// Fixed-height ancestors and the scrolling ._viewContent--content clip
// the printed booklet to its first page.
@media print {
  html,
  body,
  #app {
    height: auto !important;
    min-height: 0 !important;
  }
  ._publicPublication {
    ._editionExport,
    ._viewContent,
    ._viewContent--content {
      position: static !important;
      height: auto !important;
      overflow: visible !important;
    }

    ._consult--header,
    ._consult--actions,
    ._publicPublication--edit {
      display: none !important;
    }
  }
}
</style>
