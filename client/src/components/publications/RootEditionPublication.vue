<template>
  <div class="_rootEdition">
    <SiteHeader />

    <div class="_rootEdition--topbar">
      <div class="_rootEdition--titleRow">
        <TitleField
          :field_name="'title'"
          :label="$t('title')"
          :show_label="false"
          :content="publication.title"
          :path="publication.$path"
          :tag="'h1'"
          :maxlength="60"
          :required="true"
          :can_edit="can_edit"
        />
        <span v-if="template_label" class="_rootEdition--template">
          {{ template_label }}
        </span>
      </div>

      <div class="_rootEdition--btnRow">
        <StatusTag
          v-if="can_edit"
          :status="publication.$status || 'public'"
          :status_options="['public', 'private']"
          :path="publication.$path"
          :can_edit="can_edit"
        />
        <button
          v-if="can_edit"
          type="button"
          class="u-buttonLink"
          @click="toggleSettings"
        >
          <b-icon icon="gear" :aria-label="$t('settings')" />
          {{ $t("settings") }}
        </button>
        <DropDown :right="true">
          <template slot="trigger">
            <b-icon icon="box-arrow-up-right" />
            {{ $t("share") }}
          </template>
          <div v-if="can_edit">
            <button
              type="button"
              class="u-buttonLink"
              @click="show_export_pdf_modal = true"
            >
              <b-icon icon="save2-fill" />
              {{ $t("export") }}
            </button>
          </div>
          <div v-if="share_url">
            <button
              type="button"
              class="u-buttonLink"
              @click="show_qr_code_modal = true"
            >
              <div part="base" class="icon" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-qr-code"
                  viewBox="0 0 16 16"
                >
                  <path d="M2 2h2v2H2V2Z"></path>
                  <path d="M6 0v6H0V0h6ZM5 1H1v4h4V1ZM4 12H2v2h2v-2Z"></path>
                  <path d="M6 10v6H0v-6h6Zm-5 1v4h4v-4H1Zm11-9h2v2h-2V2Z"></path>
                  <path
                    d="M10 0v6h6V0h-6Zm5 1v4h-4V1h4ZM8 1V0h1v2H8v2H7V1h1Zm0 5V4h1v2H8ZM6 8V7h1V6h1v2h1V7h5v1h-4v1H7V8H6Zm0 0v1H2V8H1v1H0V7h3v1h3Zm10 1h-1V7h1v2Zm-1 0h-1v2h2v-1h-1V9Zm-4 0h2v1h-1v1h-1V9Zm2 3v-1h-1v1h-1v1H9v1h3v-2h1Zm0 0h3v1h-2v1h-1v-2Zm-4-1v1h1v-2H7v1h2Z"
                  ></path>
                  <path d="M7 12h1v3h4v1H7v-4Zm9 2v2h-3v-1h2v-1h1Z"></path>
                </svg>
              </div>
              {{ $t("direct_link") }}
            </button>
          </div>
        </DropDown>
        <button
          v-if="can_edit"
          type="button"
          class="u-buttonLink _rootEdition--removeBtn"
          @click="$emit('remove')"
        >
          <b-icon icon="trash" />
          {{ $t("remove") }}
        </button>
      </div>

      <ExportPubliModal
        v-if="show_export_pdf_modal"
        :modal_title="$t('export_publi', { name: publication.title })"
        :publication="publication"
        :pane_infos="pane_infos"
        :can_save_to_project="false"
        @close="show_export_pdf_modal = false"
      />
      <SharePublication
        v-if="show_qr_code_modal"
        :share_url="share_url"
        :publication_path="publication.$path"
        :is_public="publication.$public === true"
        :can_edit="can_edit"
        @close="show_qr_code_modal = false"
      />
    </div>

    <div class="_rootEdition--content">
      <EditionTemplate
        :publication="publication"
        :pane_infos="pane_infos"
        :can_edit="can_edit"
        @updatePane="$emit('updatePane', $event)"
      />
    </div>
  </div>
</template>
<script>
import {
  getTemplateConfig,
  publicationSlugFromPath,
} from "@/utils/folderPublications.js";
import SiteHeader from "@/components/nav/SiteHeader.vue";
import { resolveAppPublicOrigin } from "@/utils/app_public_url.js";

export default {
  props: {
    publication: Object,
    pane_infos: Object,
    can_edit: Boolean,
  },
  components: {
    SiteHeader,
    EditionTemplate: () =>
      import("@/components/publications/templates/EditionTemplate.vue"),
    ExportPubliModal: () =>
      import("@/components/publications/ExportPubliModal.vue"),
    SharePublication: () =>
      import("@/components/publications/SharePublication.vue"),
  },
  data() {
    return {
      show_export_pdf_modal: false,
      show_qr_code_modal: false,
    };
  },
  computed: {
    template_label() {
      const config = getTemplateConfig(this.publication?.template);
      return config ? this.$t(config.label_key) : "";
    },
    public_url() {
      const publication_slug = publicationSlugFromPath(this.publication?.$path);
      if (!publication_slug) return "";
      return this.$router.resolve({
        name: "PublicPublication",
        params: { publication_slug },
      }).href;
    },
    share_url() {
      if (!this.public_url) return "";
      return resolveAppPublicOrigin() + this.public_url;
    },
  },
  methods: {
    toggleSettings() {
      this.$eventHub.$emit("publication.settings.toggle");
    },
  },
};
</script>
<style lang="scss" scoped>
._rootEdition {
  position: absolute;
  inset: 0;
  display: flex;
  flex-flow: column nowrap;
  background: var(--body-bg, white);
  overflow: hidden;
}


._rootEdition--topbar {
  flex: 0 0 auto;
  display: flex;
  flex-flow: row wrap;
  justify-content: space-between;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  padding: calc(var(--spacing) / 2);
  border-bottom: 1px solid var(--border-color, var(--c-gris));
  background: white;
}

._rootEdition--titleRow {
  display: flex;
  align-items: center;
  gap: calc(var(--spacing) / 2);
  min-width: 0;
}

._rootEdition--template {
  color: var(--c-gris_fonce);
  font-size: var(--sl-font-size-small);
  white-space: nowrap;
}

._rootEdition--btnRow {
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-end;
  align-items: center;
  gap: calc(var(--spacing) / 1);
}

._rootEdition--removeBtn {
  color: var(--c-rouge);
}

._rootEdition--content {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
}
</style>
