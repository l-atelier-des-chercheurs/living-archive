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
    <PostcardView v-else-if="publication.template === 'postcard'" />
    <EditionExport
      v-else-if="publication.template === 'edition'"
      :publication="publication"
      :default_view_mode="'book'"
    />
    <div v-else class="_publicPublication--error">
      <span class="u-warning">{{ $t("page_failed_to_load") }}</span>
    </div>
  </div>
</template>
<script>
import DynamicTitle from "@/mixins/DynamicTitle.js";
import { getRootPublicationPath } from "@/utils/folderPublications.js";

export default {
  name: "PublicPublicationView",
  mixins: [DynamicTitle],
  components: {
    PostcardView: () => import("@/views/PostcardView.vue"),
    EditionExport: () =>
      import("@/components/publications/edition/EditionExport.vue"),
  },
  data() {
    return {
      publication: null,
      is_loading: true,
      load_error: "",
    };
  },
  async created() {
    await this.loadPublication();
  },
  computed: {
    publication_path() {
      return getRootPublicationPath(this.$route.params.publication_slug);
    },
    print_page_css() {
      if (this.publication?.template !== "edition") return "";
      return `@page { margin: 0mm; }`;
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
</style>
<style lang="scss">
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
  }
}
</style>
