<template>
  <div
    class="_postcard"
    :class="{
      'is--share': is_share_view,
      'is--compose': !is_share_view && step === 'form',
      'is--composeWide': !is_share_view && step === 'form' && is_wide_layout,
    }"
  >
    <header v-if="!is_share_view" class="_postcard--header">
      <a class="_postcard--brand" href="/" aria-label="Slash">
        <SlashLogo class="_postcard--logo" />
      </a>
      <div class="_postcard--headerText">
        <h1 class="_postcard--title">
          {{ publication_title || "Postcard" }}
        </h1>
        <p class="_postcard--lead">
          {{
            step === "form"
              ? "Tap the photo, the stamp, or the lines."
              : "Here’s your card. Export, share, or edit it."
          }}
        </p>
      </div>
    </header>

    <header v-else class="_postcard--shareHeader">
      <SiteBrand :link_home="true" />
    </header>

    <div
      class="_postcard--shell"
      :class="{
        'is--share': is_share_view,
        'is--compose': !is_share_view && step === 'form',
      }"
    >
      <div v-if="is_loading" class="_postcard--status">Loading…</div>
      <div v-else-if="load_error" class="_postcard--alert is--danger" role="alert">
        <b-icon icon="exclamation-octagon" />
        <span>{{ load_error }}</span>
      </div>

      <!-- Step 1: the card is the form -->
      <div
        v-else-if="!is_share_view && step === 'form'"
        class="_postcard--compose"
      >
        <form class="_postcard--form" @submit.prevent="generateCard">
          <input
            ref="image_input"
            class="_postcard--fileInput"
            type="file"
            accept="image/*"
            @change="onImageChange"
          />
          <input
            ref="audio_input"
            class="_postcard--fileInput"
            type="file"
            accept="audio/*"
            @change="onAudioChange"
          />

          <div
            class="_postcard--card is--editable"
            :style="card_preview_style"
            aria-label="Postcard"
          >
            <button
              type="button"
              class="_postcard--imagePane is--hit"
              :disabled="
                is_generating ||
                (!is_draft_mode && !publication) ||
                is_uploading_image
              "
              :title="image_file_name || 'Add an image'"
              @click="openImagePicker"
            >
              <img
                v-if="image_url"
                class="_postcard--image"
                :src="image_url"
                alt=""
              />
              <span v-else class="_postcard--zoneHint">
                <b-icon icon="image" />
                Add an image
              </span>
              <span v-if="image_url && !is_uploading_image" class="_postcard--zoneHint is--overlay">
                Change
              </span>
              <b-icon
                v-if="is_uploading_image"
                icon="arrow-repeat"
                class="_spinner _postcard--zoneSpinner"
              />
            </button>

            <div class="_postcard--rightPane">
              <div class="_postcard--stampRow">
                <button
                  v-if="!has_audio"
                  type="button"
                  class="_postcard--stamp is--empty"
                  :disabled="
                    is_generating ||
                    (!is_draft_mode && !publication) ||
                    is_uploading_audio
                  "
                  title="Add a sound"
                  @click="openAudioPicker"
                >
                  <b-icon
                    :icon="is_uploading_audio ? 'arrow-repeat' : 'soundwave'"
                    :class="{ _spinner: is_uploading_audio }"
                  />
                </button>
                <button
                  v-else
                  type="button"
                  class="_postcard--stamp"
                  :class="{ 'is--playing': is_audio_playing }"
                  :aria-label="is_audio_playing ? 'Stop audio' : 'Play audio'"
                  @click="onStampClick"
                >
                  <span
                    v-if="is_audio_playing"
                    class="_postcard--stopBtn"
                    aria-hidden="true"
                  >
                    <span class="_postcard--stopIcon"></span>
                  </span>
                  <img
                    v-else-if="active_qr_url"
                    class="_postcard--qr"
                    :src="active_qr_url"
                    alt=""
                  />
                </button>
                <button
                  v-if="has_audio"
                  type="button"
                  class="_postcard--zoneLink"
                  :disabled="is_generating || is_uploading_audio"
                  @click="openAudioPicker"
                >
                  Change
                </button>
              </div>

              <label class="_postcard--rules is--editable">
                <textarea
                  class="_postcard--cardText"
                  :value="postcard_text"
                  :maxlength="text_max_length"
                  :rows="text_line_count"
                  :disabled="is_generating"
                  aria-label="Text"
                  placeholder="Write on the card…"
                  @input="onTextInput"
                ></textarea>
              </label>
            </div>
          </div>

          <div class="_postcard--zoneLinks">
            <button
              type="button"
              class="_postcard--zoneLink"
              :disabled="
                is_generating || !accessible_folders.length || is_uploading_image
              "
              aria-label="Image from a folder"
              @click="openFolderMediaModal('image')"
            >
              <b-icon icon="image" />
              Image from a folder
            </button>
            <button
              type="button"
              class="_postcard--zoneLink"
              :disabled="
                is_generating || !accessible_folders.length || is_uploading_audio
              "
              aria-label="Sound from a folder"
              @click="openFolderMediaModal('audio')"
            >
              <b-icon icon="soundwave" />
              Sound from a folder
            </button>
            <span class="_postcard--counter">
              {{ postcard_text.length }} / {{ text_max_length }}
            </span>
          </div>

          <div
            v-if="form_error"
            class="_postcard--alert is--warning"
            role="alert"
          >
            <b-icon icon="exclamation-triangle" />
            <span>{{ form_error }}</span>
          </div>

          <div class="_postcard--formFooter">
            <div class="_postcard--formActions">
            <button
              v-if="is_draft_mode"
              type="button"
              class="_postcard--deleteBtn"
              :disabled="is_generating"
              @click="goHome"
            >
              <b-icon icon="x-lg" />
              {{ $t("cancel") }}
            </button>
            <button
              v-else-if="can_edit && publication && publication.$path"
              type="button"
              class="_postcard--deleteBtn"
              @click="show_remove_menu = true"
            >
              <b-icon icon="trash" />
              {{ $t("remove") }}
            </button>
            <button
              class="_postcard--primary"
              type="submit"
              :disabled="!can_generate || is_saving || is_generating"
            >
              <b-icon
                v-if="is_saving && !is_generating"
                icon="arrow-repeat"
                class="_spinner"
              />
              <b-icon v-else-if="!is_generating" icon="card-image" />
              {{
                is_generating
                  ? `${generation_progress}% — ${generation_status}`
                  : "Generate card"
              }}
            </button>
            </div>
            <div
              v-if="is_generating"
              class="_postcard--progress"
              role="progressbar"
              :aria-valuenow="generation_progress"
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                class="_postcard--progressBar"
                :style="{ width: generation_progress + '%' }"
              />
            </div>
          </div>
        </form>
      </div>

      <!-- Step 2 / share view: generated card -->
      <div v-else class="_postcard--result">
        <p v-if="!is_share_view" class="_postcard--step">Step 2 · Your card</p>

        <div
          class="_postcard--card"
          :style="card_preview_style"
          aria-label="Postcard"
        >
          <div class="_postcard--imagePane">
            <img
              v-if="image_url"
              class="_postcard--image"
              :src="image_url"
              alt=""
            />
            <div v-else class="_postcard--imagePlaceholder">Image</div>
          </div>

          <div class="_postcard--rightPane">
            <button
              v-if="has_audio"
              type="button"
              class="_postcard--stamp"
              :class="{ 'is--playing': is_audio_playing }"
              :aria-label="is_audio_playing ? 'Stop audio' : 'Play audio'"
              @click="onStampClick"
            >
              <span
                v-if="is_audio_playing"
                class="_postcard--stopBtn"
                aria-hidden="true"
              >
                <span class="_postcard--stopIcon"></span>
              </span>
              <img
                v-else-if="active_qr_url"
                class="_postcard--qr"
                :src="active_qr_url"
                alt=""
              />
            </button>

            <div class="_postcard--rules">
              <div
                v-for="(line, index) in preview_text_lines"
                :key="'rule-' + index"
                class="_postcard--rule"
              >
                <span class="_postcard--ruleText">{{ line }}</span>
              </div>
            </div>
          </div>
        </div>

        <p v-if="!is_share_view" class="_postcard--mark">Slash/</p>

        <div v-if="!is_share_view" class="_postcard--actions">
          <PostcardShareMenu
            class="_postcard--shareMenu"
            trigger_class="_postcard--primary"
            :title="publication_title"
            :share_url="share_url"
            :share_file="share_file"
            :is_preparing="is_preparing_share"
            :is_busy="is_exporting"
            :disabled="!can_export || is_exporting"
            @open="prepareShareFile"
            @downloadImage="exportPrint(1)"
            @downloadSheet="exportPrint(4)"
          />
        </div>

        <div
          v-if="export_error"
          class="_postcard--alert is--danger"
          role="alert"
        >
          <b-icon icon="exclamation-octagon" />
          <span>{{ export_error }}</span>
        </div>
      </div>

      <div
        v-if="
          !is_share_view &&
          !is_loading &&
          !load_error &&
          step !== 'form' &&
          show_cancel_or_remove
        "
        class="_postcard--dangerZone"
      >
        <button
          v-if="can_edit && publication && publication.$path"
          type="button"
          class="_postcard--deleteBtn"
          @click="show_remove_menu = true"
        >
          <b-icon icon="trash" />
          {{ $t("remove") }}
        </button>
      </div>
    </div>

    <div v-if="is_share_view" class="_postcard--shareActions">
      <div v-if="can_browse_postcards" class="_postcard--browse">
        <button
          type="button"
          class="_postcard--editBtn is--icon"
          :disabled="!previous_postcard_slug"
          :title="$t('previous')"
          @click="goToPostcard(previous_postcard_slug)"
        >
          <b-icon icon="arrow-left" :label="$t('previous')" />
        </button>
        <span class="_postcard--browseCount">
          {{ sibling_index + 1 }} / {{ sibling_postcard_slugs.length }}
        </span>
        <button
          type="button"
          class="_postcard--editBtn is--icon"
          :disabled="!next_postcard_slug"
          :title="$t('next')"
          @click="goToPostcard(next_postcard_slug)"
        >
          <b-icon icon="arrow-right" :label="$t('next')" />
        </button>
      </div>
      <PostcardShareMenu
        v-if="!is_loading && !load_error"
        trigger_class="_postcard--editBtn"
        :title="publication_title"
        :share_url="share_url"
        :share_file="share_file"
        :is_preparing="is_preparing_share"
        :is_busy="is_exporting"
        :disabled="!can_export || is_exporting"
        @open="prepareShareFile"
        @downloadImage="exportPrint(1)"
        @downloadSheet="exportPrint(4)"
      />
      <button
        v-if="can_edit && publication && publication.$path"
        type="button"
        class="_postcard--editBtn"
        @click="show_remove_menu = true"
      >
        <b-icon icon="trash" />
        {{ $t("remove") }}
      </button>
    </div>

    <RemoveMenu2
      v-if="show_remove_menu && publication?.$path"
      :path="publication.$path"
      :modal_title="
        $t('remove_publication', {
          name: publication_title || $t('template_postcard'),
        })
      "
      :modal_expl="$t('remove_postcard_expl')"
      :success_notification="$t('publication_was_removed')"
      @close="show_remove_menu = false"
      @removedSuccessfully="onPostcardRemoved"
    />

    <audio
      v-if="audio_url"
      ref="card_audio"
      class="_postcard--cardAudio"
      :src="audio_url"
      preload="auto"
      @ended="onCardAudioEnded"
      @pause="onCardAudioPaused"
    />

    <PickMediaFromFolder
      v-if="!is_share_view && folder_media_modal_type"
      :media_type="folder_media_modal_type"
      :folders="accessible_folders"
      @pickMedia="onFolderMediaPicked"
      @close="closeFolderMediaModal"
    />
  </div>
</template>

<script>
import QRCodeStyling from "qr-code-styling";
import SlashLogo from "@/components/nav/SlashLogo.vue";
import SiteBrand from "@/components/nav/SiteBrand.vue";
import PickMediaFromFolder from "@/components/slash/PickMediaFromFolder.vue";
import PostcardShareMenu from "@/components/slash/PostcardShareMenu.vue";
import {
  getRootPublicationsPath,
  getRootPublicationPath,
  filePathToSourceMedia,
  sourceMediasToPaths,
  titleFromPostcardText,
  buildPublicationCreateMeta,
  browsePublicationSlugs,
} from "@/utils/folderPublications.js";

const QR_PLACEHOLDER_URL =
  "https://slash.local/postcard/audio-placeholder";

/** Slash orange play disc as SVG data URL — baked into the QR by qr-code-styling */
const PLAY_ICON_DATA_URL =
  "data:image/svg+xml," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <circle cx="32" cy="32" r="32" fill="#ff5829"/>
      <path d="M26 18v28l22-14z" fill="#e5ffdb"/>
    </svg>
  `.trim());

/** Export resolution: ~12 px per mm */
const PX_PER_MM = 12;
/** A6 landscape postcard: 148×105 mm */
const EXPORT_WIDTH = Math.round(148 * PX_PER_MM);
const EXPORT_HEIGHT = Math.round(105 * PX_PER_MM);
/** A4 landscape sheet for 2×2 cards: 297×210 mm */
const PRINT_A4_WIDTH = Math.round(297 * PX_PER_MM);
const PRINT_A4_HEIGHT = Math.round(210 * PX_PER_MM);
const COVER_WIDTH = 2000;
const COVER_HEIGHT = 1420;

const TEXT_LINE_COUNT = 8;
const CHARS_PER_LINE = 28;
const TEXT_MAX_LENGTH = TEXT_LINE_COUNT * CHARS_PER_LINE;
const PREVIEW_WIDE_MQ = "(min-width: 960px)";

export default {
  name: "PostcardView",
  components: {
    SlashLogo,
    SiteBrand,
    PickMediaFromFolder,
    PostcardShareMenu,
  },
  data() {
    return {
      step: "form",
      publication: null,
      is_loading: true,
      load_error: "",
      is_saving: false,
      is_uploading_image: false,
      is_uploading_audio: false,
      folders: [],
      image_url: "",
      image_file_name: "",
      image_media_path: "",
      audio_url: "",
      audio_file_name: "",
      audio_media_path: "",
      postcard_text: "",
      folder_media_modal_type: "",
      qr_simple_url: "",
      qr_play_url: "",
      is_exporting: false,
      share_file: null,
      is_preparing_share: false,
      is_generating: false,
      is_audio_playing: false,
      form_error: "",
      export_error: "",
      text_line_count: TEXT_LINE_COUNT,
      text_max_length: TEXT_MAX_LENGTH,
      show_remove_menu: false,
      pending_image_file: null,
      pending_audio_file: null,
      generation_progress: 0,
      generation_status: "",
      preview_open: false,
      is_wide_layout: false,
      preview_mq: null,
      sibling_postcard_slugs: [],
    };
  },
  computed: {
    is_share_view() {
      return this.$route.name === "PublicPublication";
    },
    sibling_index() {
      return this.sibling_postcard_slugs.indexOf(this.publication_slug);
    },
    can_browse_postcards() {
      return this.sibling_index !== -1 && this.sibling_postcard_slugs.length > 1;
    },
    previous_postcard_slug() {
      return this.sibling_postcard_slugs[this.sibling_index - 1] || "";
    },
    next_postcard_slug() {
      return this.sibling_postcard_slugs[this.sibling_index + 1] || "";
    },
    is_draft_mode() {
      return this.$route.name === "PostcardNew";
    },
    show_cancel_or_remove() {
      return this.is_draft_mode || this.can_edit;
    },
    can_edit() {
      if (this.is_draft_mode) return Boolean(this.connected_as);
      if (!this.publication) return false;
      if (
        typeof this.canLoggedinEditFolder === "function" &&
        this.connected_as
      ) {
        return this.canLoggedinEditFolder({ folder: this.publication });
      }
      return this.tokenPathCanEdit(this.publication);
    },
    publication_slug() {
      if (this.is_draft_mode) {
        return this.publication?.$path?.split("/").pop() || "";
      }
      return this.$route.params.publication_slug || "";
    },
    publication_path() {
      return getRootPublicationPath(this.publication_slug);
    },
    publication_title() {
      if (!this.is_share_view) {
        return titleFromPostcardText(this.postcard_text, {
          fallback: this.publication?.title || this.$t("template_postcard"),
        });
      }
      return this.publication?.title || this.$t("template_postcard");
    },
    share_url() {
      if (!this.publication_slug) return "";
      const resolved = this.$router.resolve({
        name: "PublicPublication",
        params: { publication_slug: this.publication_slug },
      });
      try {
        return new URL(resolved.href, window.location.origin).href;
      } catch (err) {
        return resolved.href;
      }
    },
    accessible_folders() {
      return (this.folders || []).filter((folder) =>
        this.canLoggedinSeeFolder({ folder })
      );
    },
    has_audio() {
      return Boolean(this.audio_url || this.audio_media_path);
    },
    active_qr_url() {
      return this.has_audio ? this.qr_play_url : "";
    },
    can_generate() {
      return Boolean(this.image_url);
    },
    can_export() {
      return Boolean(this.image_url);
    },
    card_preview_style() {
      return {
        aspectRatio: "148 / 105",
      };
    },
    preview_text_lines() {
      return this.wrapTextToLines(
        this.postcard_text,
        CHARS_PER_LINE,
        TEXT_LINE_COUNT
      );
    },
    current_source_medias() {
      const medias = [];
      if (this.image_media_path) {
        const source = filePathToSourceMedia(this.image_media_path);
        if (source) medias.push(source);
      }
      if (this.audio_media_path) {
        const source = filePathToSourceMedia(this.audio_media_path);
        if (source) medias.push(source);
      }
      return medias;
    },
  },
  async created() {
    if (this.is_share_view) {
      this.prepareShareSession();
    }
    if (this.is_draft_mode) {
      await this.bootstrapDraft();
    } else {
      await this.loadPublication();
    }
    if (this.is_share_view) {
      this.step = "card";
      this.loadSiblingPostcards();
    }
  },
  mounted() {
    this.initPreviewLayout();
    if (this.is_share_view) {
      window.addEventListener("keydown", this.onShareKeydown);
    }
  },
  watch: {
    has_audio() {
      this.buildQrVariants();
    },
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.onShareKeydown);
    this.teardownPreviewLayout();
    this.stopStampAudio();
    if (
      !this.is_share_view &&
      this.publication_path &&
      this.isRoomJoined(this.publication_path)
    ) {
      this.$api.leave({ room: this.publication_path });
    }
    this.revokeObjectUrl(this.image_url);
    this.revokeObjectUrl(this.audio_url);
    this.revokeObjectUrl(this.qr_simple_url);
    this.revokeObjectUrl(this.qr_play_url);
  },
  methods: {
    initPreviewLayout() {
      if (typeof window === "undefined" || !window.matchMedia) return;
      this.preview_mq = window.matchMedia(PREVIEW_WIDE_MQ);
      this.onPreviewMqChange(this.preview_mq);
      if (this.preview_mq.addEventListener) {
        this.preview_mq.addEventListener("change", this.onPreviewMqChange);
      } else if (this.preview_mq.addListener) {
        this.preview_mq.addListener(this.onPreviewMqChange);
      }
    },
    teardownPreviewLayout() {
      if (!this.preview_mq) return;
      if (this.preview_mq.removeEventListener) {
        this.preview_mq.removeEventListener("change", this.onPreviewMqChange);
      } else if (this.preview_mq.removeListener) {
        this.preview_mq.removeListener(this.onPreviewMqChange);
      }
      this.preview_mq = null;
    },
    onPreviewMqChange(event) {
      const matches =
        typeof event?.matches === "boolean"
          ? event.matches
          : Boolean(this.preview_mq?.matches);
      const was_wide = this.is_wide_layout;
      this.is_wide_layout = matches;
      if (matches) {
        this.preview_open = true;
      } else if (was_wide) {
        this.preview_open = false;
      }
    },
    openPreview() {
      this.preview_open = true;
    },
    closePreview() {
      this.preview_open = false;
    },
    prepareShareSession() {
      // Public CP URLs must work without general password / FullUI init.
      this.$root.is_loading = false;
      try {
        // the API is password-gated: needed to browse cards and delete one
        this.$api.general_password =
          localStorage.getItem("general_password") || "";
        const raw = localStorage.getItem("tokenpath");
        if (raw) {
          const { token, token_path } = JSON.parse(raw);
          if (token && token_path) {
            this.$api.tokenpath.token = token;
            this.$api.tokenpath.token_path = token_path;
          }
        }
      } catch (err) {
        console.warn("Postcard share session restore skipped", err);
      }
      this.$api.setAuthorizationHeader();
    },
    async loadSiblingPostcards() {
      const needs_general_password =
        this.$root.app_infos?.instance_meta?.has_general_password === true &&
        !this.$api.general_password;
      if (needs_general_password) return;
      try {
        const publications = await this.$api.getFolders({
          path: getRootPublicationsPath(),
        });
        this.sibling_postcard_slugs = browsePublicationSlugs(publications);
      } catch (err) {
        this.sibling_postcard_slugs = [];
      }
    },
    goToPostcard(slug) {
      if (!slug) return;
      this.stopStampAudio();
      this.$router.push({
        name: "PublicPublication",
        params: { publication_slug: slug },
      });
    },
    onShareKeydown(event) {
      if (!this.can_browse_postcards || this.show_remove_menu) return;
      const target = event.target;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      )
        return;
      if (event.key === "ArrowLeft") this.goToPostcard(this.previous_postcard_slug);
      else if (event.key === "ArrowRight")
        this.goToPostcard(this.next_postcard_slug);
    },
    tokenPathCanEdit(folder) {
      if (!folder) return false;
      try {
        const raw = localStorage.getItem("tokenpath");
        if (!raw) return false;
        const { token_path } = JSON.parse(raw);
        if (!token_path) return false;
        if (folder.$admins === "everyone") return true;
        return (
          Array.isArray(folder.$admins) && folder.$admins.includes(token_path)
        );
      } catch (err) {
        return false;
      }
    },
    isRoomJoined(room) {
      if (typeof this.$api?.isRoomSubscribed === "function") {
        return this.$api.isRoomSubscribed(room);
      }
      return Array.isArray(this.$api?.rooms_joined)
        ? this.$api.rooms_joined.includes(room)
        : false;
    },
    mediaLabel(file) {
      if (!file) return "";
      const caption = (file.caption || "").replace(/<[^>]+>/g, "").trim();
      if (caption) return caption;
      const filename = file.$path?.split("/").pop() || "Untitled";
      return filename.replace(/\.meta\.txt$/, "");
    },
    mediaPreviewUrl(file) {
      if (!file?.$path || !file?.$media_filename) return "";
      if (typeof this.makeMediaFilePath === "function") {
        return this.makeMediaFilePath({
          $path: file.$path,
          $media_filename: file.$media_filename,
        });
      }
      const parent = file.$path.substring(0, file.$path.lastIndexOf("/"));
      return "/" + parent + "/" + file.$media_filename;
    },
    guessMediaKindFromFilename(filename) {
      const name = String(filename || "").toLowerCase();
      if (/\.(png|jpe?g|gif|webp|avif|bmp|svg)$/.test(name)) return "image";
      if (/\.(mp3|wav|ogg|m4a|aac|flac|webm)$/.test(name)) return "audio";
      return "";
    },
    mediaKindOf(file) {
      if (file?.$type === "image" || file?.$type === "audio") return file.$type;
      // .webp/.avif uploaded before the server knew them are typed "other"
      if (!file?.$type || file.$type === "other")
        return this.guessMediaKindFromFilename(file?.$media_filename);
      return "";
    },
    async bootstrapDraft() {
      this.is_loading = true;
      this.load_error = "";
      this.publication = null;
      try {
        if (!this.connected_as) {
          this.$eventHub.$emit("login.openModal");
        }
        this.folders = await this.$api
          .getFolders({ path: "folders" })
          .catch(() => []);
      } catch (err) {
        console.error(err);
        this.load_error = err?.message || "Could not start postcard draft.";
      } finally {
        this.is_loading = false;
      }
    },
    async loadPublication() {
      this.is_loading = true;
      this.load_error = "";
      if (!this.publication_path) {
        this.load_error = "Publication not found.";
        this.is_loading = false;
        return;
      }

      try {
        if (this.is_share_view) {
          this.publication = await this.$api.getPublicFolder({
            path: this.publication_path,
          });
          if (!this.publication?.$path) {
            const err = new Error("folder_not_public");
            err.code = "folder_not_public";
            throw err;
          }
        } else {
          this.folders = await this.$api
            .getFolders({ path: "folders" })
            .catch(() => []);
          this.publication = await this.$api.getFolder({
            path: this.publication_path,
          });
          // a generated card (with cover) is frozen: only the share view remains
          if (this.publication?.$cover) {
            await this.$router.replace({
              name: "PublicPublication",
              params: { publication_slug: this.publication_slug },
            });
            return;
          }
          if (!this.isRoomJoined(this.publication_path)) {
            this.$api.join({ room: this.publication_path });
          }
        }
        this.postcard_text = this.publication.message || "";
        if (this.is_share_view) {
          this.hydrateSourceMediasPublic();
        } else {
          await this.hydrateSourceMedias();
        }
      } catch (err) {
        console.error(err);
        const code = err?.code || err?.message;
        if (code === "folder_not_public") {
          this.load_error = this.$t("folder_not_public");
        } else {
          this.load_error =
            code || "Could not load this publication.";
        }
        this.publication = null;
      } finally {
        this.is_loading = false;
      }

      try {
        await this.buildQrVariants();
      } catch (err) {
        console.error("Postcard QR rebuild failed", err);
      }
    },
    hydrateSourceMediasPublic() {
      const files = Array.isArray(this.publication?.$files)
        ? this.publication.$files
        : [];
      const files_by_path = {};
      for (const file of files) {
        if (file?.$path) files_by_path[file.$path] = file;
      }

      const paths = sourceMediasToPaths(
        this.publication?.source_medias,
        this.publication?.$path || ""
      );

      // Prefer explicit source_medias (correct after audio/image replacements).
      if (paths.length) {
        for (const path of paths) {
          if (!path) continue;
          const from_files = files_by_path[path];
          if (from_files) {
            const from_files_kind = this.mediaKindOf(from_files);
            if (from_files_kind === "image" && !this.image_media_path) {
              this.applyLoadedMedia("image", from_files);
            } else if (from_files_kind === "audio" && !this.audio_media_path) {
              this.applyLoadedMedia("audio", from_files);
            }
            continue;
          }

          const meta_filename = path.split("/").pop() || "";
          const media_filename = meta_filename.replace(/\.meta\.txt$/, "");
          const parent = path.substring(0, path.lastIndexOf("/"));
          if (!media_filename || !parent) continue;

          const kind = this.guessMediaKindFromFilename(media_filename);
          if (kind === "image" && !this.image_media_path) {
            this.image_media_path = path;
            this.image_file_name = media_filename;
            this.image_url = "/" + parent + "/" + media_filename;
          } else if (kind === "audio" && !this.audio_media_path) {
            this.audio_media_path = path;
            this.audio_file_name = media_filename;
            this.audio_url = "/" + parent + "/" + media_filename;
          }
        }
        return;
      }

      // Legacy fallback: no source_medias — first image/audio in folder.
      for (const file of files) {
        const kind = this.mediaKindOf(file);
        if (kind === "image" && !this.image_media_path) {
          this.applyLoadedMedia("image", file);
        } else if (kind === "audio" && !this.audio_media_path) {
          this.applyLoadedMedia("audio", file);
        }
      }
    },
    async hydrateSourceMedias() {
      const paths = sourceMediasToPaths(
        this.publication?.source_medias,
        this.publication?.$path || ""
      );
      for (const path of paths) {
        try {
          const file = await this.$api.getFolder({ path });
          const kind = this.mediaKindOf(file);
          if (kind === "image" && !this.image_media_path) {
            this.applyLoadedMedia("image", file);
          } else if (kind === "audio" && !this.audio_media_path) {
            this.applyLoadedMedia("audio", file);
          }
        } catch (err) {
          console.warn("Missing postcard media", path, err);
        }
      }
    },
    applyLoadedMedia(kind, file) {
      if (!file?.$path) return;
      const preview = this.mediaPreviewUrl(file);
      const label = this.mediaLabel(file);
      if (kind === "image") {
        this.revokeObjectUrl(this.image_url);
        this.pending_image_file = null;
        this.image_media_path = file.$path;
        this.image_file_name = label;
        this.image_url = preview;
      } else if (kind === "audio") {
        this.revokeObjectUrl(this.audio_url);
        this.pending_audio_file = null;
        this.audio_media_path = file.$path;
        this.audio_file_name = label;
        this.audio_url = preview;
      }
    },
    openFolderMediaModal(media_type) {
      if (!this.accessible_folders.length) return;
      this.folder_media_modal_type = media_type;
    },
    closeFolderMediaModal() {
      this.folder_media_modal_type = "";
    },
    async onFolderMediaPicked(file) {
      const kind = this.folder_media_modal_type;
      if (!kind || !file?.$path) return;
      this.applyLoadedMedia(kind, file);
      this.form_error = "";
      this.export_error = "";
      this.closeFolderMediaModal();
      if (!this.is_draft_mode) {
        try {
          await this.persistMeta();
        } catch (err) {
          console.error(err);
          this.form_error =
            err?.message || "Could not save the media selection.";
        }
      }
    },
    async uploadMediaFile(kind, file, { onProgress } = {}) {
      if (!file || !this.publication?.$path) {
        this.form_error = "Publication not loaded.";
        return;
      }

      const uploading_key =
        kind === "image" ? "is_uploading_image" : "is_uploading_audio";
      this[uploading_key] = true;
      this.form_error = "";

      try {
        const { uploaded_meta, meta_filename } = await this.$api.uploadFile({
          path: this.publication.$path,
          filename: file.name,
          file,
          onProgress,
        });
        const meta_path =
          uploaded_meta?.$path ||
          (meta_filename
            ? `${this.publication.$path}/${meta_filename}`
            : "");
        if (!meta_path) {
          throw new Error("Upload returned no media path.");
        }
        if (kind === "image") {
          this.image_media_path = meta_path;
          this.pending_image_file = null;
        } else {
          this.audio_media_path = meta_path;
          this.pending_audio_file = null;
        }
      } catch (err) {
        console.error(err);
        this.form_error =
          err?.message || "Upload failed. Please try again.";
        throw err;
      } finally {
        this[uploading_key] = false;
      }
    },
    async persistMediaSelection() {
      if (this.is_draft_mode || !this.publication?.$path) return;
      await this.persistMeta();
    },
    setGenerationProgress(percent, status) {
      this.generation_progress = Math.max(
        0,
        Math.min(100, Math.round(percent))
      );
      this.generation_status = status || "";
    },
    async createPublicationFolder() {
      if (!this.connected_as?.$path) {
        const err = new Error("login_required");
        err.code = "login_required";
        throw err;
      }
      const title = titleFromPostcardText(this.postcard_text, {
        fallback: this.$t("template_postcard"),
      });
      const additional_meta = buildPublicationCreateMeta({
        title,
        template_key: "postcard",
        at_root: true,
        admin_path: this.connected_as.$path,
        requested_slug: `postcard-${Date.now()}`,
      });
      const slug = await this.$api.createFolder({
        path: getRootPublicationsPath(),
        additional_meta,
      });
      const path = getRootPublicationPath(slug);
      this.publication = await this.$api.getFolder({ path });
      if (!this.isRoomJoined(path)) {
        this.$api.join({ room: path });
      }
      return slug;
    },
    async persistMeta() {
      if (!this.publication?.$path) return;
      this.is_saving = true;
      try {
        const source_medias = this.current_source_medias;
        const title = titleFromPostcardText(this.postcard_text, {
          fallback: this.$t("template_postcard"),
        });
        await this.$api.updateMeta({
          path: this.publication.$path,
          new_meta: {
            title,
            message: this.postcard_text,
            source_medias,
            $public: true,
          },
        });
        this.$set(this.publication, "title", title);
        this.$set(this.publication, "message", this.postcard_text);
        this.$set(this.publication, "source_medias", source_medias);
        this.$set(this.publication, "$public", true);
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        this.is_saving = false;
      }
    },
    async generateCard() {
      this.form_error = "";
      if (!this.can_generate) {
        this.form_error = "Add an image to generate the card.";
        return;
      }
      if (this.is_uploading_image || this.is_uploading_audio) {
        this.form_error = "Wait until file uploads are finished.";
        return;
      }
      if (this.is_generating) return;

      this.is_generating = true;
      this.setGenerationProgress(0, this.$t("postcard_progress_starting"));
      try {
        if (this.is_draft_mode) {
          await this.generateFromDraft();
        } else {
          this.setGenerationProgress(40, this.$t("postcard_progress_saving"));
          await this.persistMeta();
          this.setGenerationProgress(70, this.$t("postcard_progress_cover"));
          await this.uploadPostcardCover();
          this.setGenerationProgress(100, this.$t("postcard_progress_done"));
          await this.$router.replace({
            name: "PublicPublication",
            params: { publication_slug: this.publication_slug },
          });
        }
        this.export_error = "";
      } catch (err) {
        console.error(err);
        if (
          this.is_draft_mode &&
          this.publication?.$path &&
          this.publication_slug
        ) {
          try {
            await this.$router.replace({
              name: "Postcard",
              params: { publication_slug: this.publication_slug },
            });
          } catch (nav_err) {
            console.warn(nav_err);
          }
        }
        if (err?.code === "login_required") {
          this.$eventHub.$emit("login.openModal");
          this.form_error = this.$t("login");
        } else {
          this.form_error =
            err?.message || "Could not save the postcard.";
        }
      } finally {
        this.is_generating = false;
        this.generation_progress = 0;
        this.generation_status = "";
      }
    },
    async generateFromDraft() {
      this.setGenerationProgress(8, this.$t("postcard_progress_creating"));
      const slug = await this.createPublicationFolder();

      if (this.pending_image_file) {
        this.setGenerationProgress(20, this.$t("postcard_progress_image"));
        await this.uploadMediaFile("image", this.pending_image_file, {
          onProgress: (event) => {
            if (!event?.total) return;
            const ratio = event.loaded / event.total;
            this.setGenerationProgress(
              20 + ratio * 30,
              this.$t("postcard_progress_image")
            );
          },
        });
      } else if (!this.image_media_path) {
        throw new Error("Add an image to generate the card.");
      }

      if (this.pending_audio_file) {
        this.setGenerationProgress(55, this.$t("postcard_progress_audio"));
        await this.uploadMediaFile("audio", this.pending_audio_file, {
          onProgress: (event) => {
            if (!event?.total) return;
            const ratio = event.loaded / event.total;
            this.setGenerationProgress(
              55 + ratio * 15,
              this.$t("postcard_progress_audio")
            );
          },
        });
      }

      this.setGenerationProgress(75, this.$t("postcard_progress_saving"));
      await this.persistMeta();

      this.setGenerationProgress(85, this.$t("postcard_progress_cover"));
      await this.buildQrVariants();
      await this.uploadPostcardCover();

      this.setGenerationProgress(98, this.$t("postcard_progress_done"));
      await this.$router.replace({
        name: "PublicPublication",
        params: { publication_slug: slug },
      });
      this.setGenerationProgress(100, this.$t("postcard_progress_done"));
    },
    onStampClick() {
      if (!this.has_audio) return;
      this.toggleStampAudio();
    },
    openShareUrl() {
      if (!this.share_url) return;
      window.open(this.share_url, "_blank", "noopener,noreferrer");
    },
    goHome() {
      this.$router.push({ name: "Accueil" });
    },
    onPostcardRemoved() {
      this.show_remove_menu = false;
      this.goHome();
    },
    getCardAudioEl() {
      return this.$refs.card_audio || null;
    },
    stopStampAudio() {
      const audio_el = this.getCardAudioEl();
      if (audio_el) {
        audio_el.pause();
        audio_el.currentTime = 0;
      }
      this.is_audio_playing = false;
    },
    async toggleStampAudio() {
      if (!this.has_audio || !this.audio_url) return;
      const audio_el = this.getCardAudioEl();
      if (!audio_el) return;

      if (this.is_audio_playing) {
        this.stopStampAudio();
        return;
      }

      try {
        audio_el.currentTime = 0;
        await audio_el.play();
        this.is_audio_playing = true;
      } catch (err) {
        console.error(err);
        this.is_audio_playing = false;
      }
    },
    onCardAudioEnded() {
      this.is_audio_playing = false;
    },
    onCardAudioPaused() {
      const audio_el = this.getCardAudioEl();
      if (!audio_el || audio_el.ended) return;
      if (audio_el.paused) {
        this.is_audio_playing = false;
      }
    },
    async buildQrVariants() {
      this.revokeObjectUrl(this.qr_simple_url);
      this.revokeObjectUrl(this.qr_play_url);
      this.qr_simple_url = "";
      this.qr_play_url = "";

      if (!this.has_audio) return;

      const with_play = await this.generateQrBlob({ with_play: true });
      this.qr_play_url = with_play ? URL.createObjectURL(with_play) : "";
    },
    async generateQrBlob({ with_play }) {
      try {
        const options = {
          width: 512,
          height: 512,
          type: "canvas",
          data: this.share_url || QR_PLACEHOLDER_URL,
          margin: 8,
          qrOptions: {
            errorCorrectionLevel: with_play ? "H" : "M",
          },
          dotsOptions: {
            color: "#1a1a1a",
            type: "square",
          },
          cornersSquareOptions: {
            type: "square",
            color: "#1a1a1a",
          },
          cornersDotOptions: {
            type: "square",
            color: "#1a1a1a",
          },
          backgroundOptions: {
            color: "#ffffff",
          },
        };

        if (with_play) {
          options.image = PLAY_ICON_DATA_URL;
          options.imageOptions = {
            hideBackgroundDots: true,
            imageSize: 0.38,
            margin: 6,
            crossOrigin: "anonymous",
          };
        }

        const qr = new QRCodeStyling(options);
        const blob = await qr.getRawData("png");
        return blob || null;
      } catch (err) {
        console.error("Postcard QR generation failed", err);
        return null;
      }
    },
    revokeObjectUrl(url) {
      if (url && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    },
    openImagePicker() {
      this.$refs.image_input && this.$refs.image_input.click();
    },
    openAudioPicker() {
      this.$refs.audio_input && this.$refs.audio_input.click();
    },
    async onImageChange(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      this.revokeObjectUrl(this.image_url);
      this.image_file_name = file.name;
      this.image_url = URL.createObjectURL(file);
      this.image_media_path = "";
      this.form_error = "";
      this.export_error = "";
      if (this.is_draft_mode) {
        this.pending_image_file = file;
        return;
      }
      this.pending_image_file = null;
      try {
        await this.uploadMediaFile("image", file);
        await this.persistMediaSelection();
      } catch (err) {
        // form_error already set
      }
    },
    async onAudioChange(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      this.revokeObjectUrl(this.audio_url);
      this.audio_file_name = file.name;
      this.audio_url = URL.createObjectURL(file);
      this.audio_media_path = "";
      this.form_error = "";
      if (this.is_draft_mode) {
        this.pending_audio_file = file;
        return;
      }
      this.pending_audio_file = null;
      try {
        await this.uploadMediaFile("audio", file);
        await this.persistMediaSelection();
      } catch (err) {
        // form_error already set
      }
    },
    onTextInput(event) {
      const value = event.target.value || "";
      this.postcard_text =
        value.length > this.text_max_length
          ? value.slice(0, this.text_max_length)
          : value;
    },
    wrapTextToLines(text, chars_per_line, max_lines) {
      const lines = [];
      const raw = (text || "").replace(/\r\n/g, "\n");
      const paragraphs = raw.split("\n");

      for (let p = 0; p < paragraphs.length; p++) {
        const paragraph = paragraphs[p];
        if (paragraph === "" && p < paragraphs.length - 1) {
          if (lines.length < max_lines) lines.push("");
          continue;
        }

        const words = paragraph.split(/\s+/).filter(Boolean);
        let current = "";

        for (const word of words) {
          const candidate = current ? current + " " + word : word;
          if (candidate.length <= chars_per_line) {
            current = candidate;
          } else {
            if (current) {
              lines.push(current);
              if (lines.length >= max_lines) {
                return lines;
              }
            }
            if (word.length > chars_per_line) {
              let rest = word;
              while (rest.length > chars_per_line) {
                lines.push(rest.slice(0, chars_per_line));
                if (lines.length >= max_lines) return lines;
                rest = rest.slice(chars_per_line);
              }
              current = rest;
            } else {
              current = word;
            }
          }
        }

        if (current) {
          lines.push(current);
          if (lines.length >= max_lines) return lines;
        }
      }

      while (lines.length < max_lines) {
        lines.push("");
      }
      return lines.slice(0, max_lines);
    },
    loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        if (src && !src.startsWith("blob:")) {
          img.crossOrigin = "anonymous";
        }
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    },
    drawCoverImage(ctx, img, x, y, w, h) {
      const scale = Math.max(w / img.width, h / img.height);
      const sw = w / scale;
      const sh = h / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    },
    async renderPostcardCanvas({ width, height }) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);

      const half = width / 2;
      const pad = Math.round(height * 0.045);

      const photo = await this.loadImage(this.image_url);
      this.drawCoverImage(ctx, photo, 0, 0, half, height);

      ctx.fillStyle = "#4980c8";
      ctx.fillRect(half - 2, 0, 3, height);

      let rules_top = pad;

      if (this.has_audio) {
        const stamp_size = Math.round(height * 0.28);
        const stamp_x = width - pad - stamp_size;
        const stamp_y = pad;

        ctx.fillStyle = "#fff";
        ctx.strokeStyle = "#87221d";
        ctx.lineWidth = Math.max(2, Math.round(height * 0.004));
        ctx.fillRect(stamp_x, stamp_y, stamp_size, stamp_size);
        ctx.strokeRect(
          stamp_x + 0.5,
          stamp_y + 0.5,
          stamp_size - 1,
          stamp_size - 1
        );

        if (this.active_qr_url) {
          const qr_img = await this.loadImage(this.active_qr_url);
          const qr_inset = Math.round(stamp_size * 0.06);
          ctx.drawImage(
            qr_img,
            stamp_x + qr_inset,
            stamp_y + qr_inset,
            stamp_size - qr_inset * 2,
            stamp_size - qr_inset * 2
          );
        }

        rules_top = stamp_y + stamp_size + pad * 0.9;
      }

      const rules_bottom = height - pad;
      const rules_left = half + pad;
      const rules_right = width - pad;
      const rules_width = rules_right - rules_left;
      const line_gap = (rules_bottom - rules_top) / TEXT_LINE_COUNT;
      const font_size = Math.round(line_gap * 0.55);

      ctx.fillStyle = "#1a1a1a";
      ctx.font = `${font_size}px "Rubik", "Helvetica Neue", sans-serif`;
      ctx.textBaseline = "alphabetic";

      const lines = this.preview_text_lines;
      for (let i = 0; i < TEXT_LINE_COUNT; i++) {
        const y = rules_top + line_gap * (i + 1);
        ctx.strokeStyle = "rgba(73, 128, 200, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rules_left, y);
        ctx.lineTo(rules_right, y);
        ctx.stroke();

        const line = lines[i] || "";
        if (line) {
          ctx.fillStyle = "#1a1a1a";
          ctx.fillText(line, rules_left, y - line_gap * 0.22, rules_width);
        }
      }

      return canvas;
    },
    canvasToPngFile(canvas, filename) {
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error("PNG generation failed"));
            return;
          }
          resolve(new File([blob], filename, { type: "image/png" }));
        }, "image/png");
      });
    },
    async uploadPostcardCover() {
      if (!this.publication?.$path || !this.image_url) return;
      if (this.has_audio && !this.active_qr_url) {
        await this.buildQrVariants();
      }
      const canvas = await this.renderPostcardCanvas({
        width: COVER_WIDTH,
        height: COVER_HEIGHT,
      });
      const slug = this.publication_slug || "carte";
      const file = await this.canvasToPngFile(
        canvas,
        `carte-postale-${slug}-cover.png`
      );
      await this.$api.updateCover({
        path: this.publication.$path,
        new_cover_data: file,
      });
    },
    async renderExportCardCanvas() {
      if (this.has_audio && !this.active_qr_url) {
        await this.buildQrVariants();
      }
      return this.renderPostcardCanvas({
        width: EXPORT_WIDTH,
        height: EXPORT_HEIGHT,
      });
    },
    async prepareShareFile() {
      if (!this.can_export || this.is_preparing_share) return;
      this.is_preparing_share = true;
      this.export_error = "";
      try {
        const card_canvas = await this.renderExportCardCanvas();
        const slug = this.publication_slug || "carte";
        this.share_file = await this.canvasToPngFile(
          card_canvas,
          `carte-postale-${slug}-a6.png`
        );
      } catch (err) {
        console.error(err);
        this.export_error = "Export failed. Try again with another image.";
      } finally {
        this.is_preparing_share = false;
      }
    },
    async exportPrint(copies) {
      const print_copies = copies === 4 ? 4 : 1;
      if (!this.can_export || this.is_exporting) return;

      this.is_exporting = true;
      this.export_error = "";

      try {
        const card_canvas = await this.renderExportCardCanvas();
        const slug = this.publication_slug || "carte";
        let download_canvas = card_canvas;
        let filename = `carte-postale-${slug}-a6.png`;

        if (print_copies === 4) {
          download_canvas = this.composePrintSheet4(card_canvas);
          filename = `carte-postale-${slug}-a4x4.png`;
        }

        const data_url = download_canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = filename;
        link.href = data_url;
        link.click();
      } catch (err) {
        console.error(err);
        this.export_error = "Export failed. Try again with another image.";
      } finally {
        this.is_exporting = false;
      }
    },
    composePrintSheet4(card_canvas) {
      const sheet = document.createElement("canvas");
      sheet.width = PRINT_A4_WIDTH;
      sheet.height = PRINT_A4_HEIGHT;
      const ctx = sheet.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, sheet.width, sheet.height);

      const offset_x = Math.floor((PRINT_A4_WIDTH - EXPORT_WIDTH * 2) / 2);
      const offset_y = Math.floor((PRINT_A4_HEIGHT - EXPORT_HEIGHT * 2) / 2);
      const positions = [
        [offset_x, offset_y],
        [offset_x + EXPORT_WIDTH, offset_y],
        [offset_x, offset_y + EXPORT_HEIGHT],
        [offset_x + EXPORT_WIDTH, offset_y + EXPORT_HEIGHT],
      ];
      positions.forEach(([x, y]) => {
        ctx.drawImage(card_canvas, x, y);
      });

      // Thin blue cut guides between the 4 cards
      const mid_x = offset_x + EXPORT_WIDTH;
      const mid_y = offset_y + EXPORT_HEIGHT;
      const right = offset_x + EXPORT_WIDTH * 2;
      const bottom = offset_y + EXPORT_HEIGHT * 2;
      ctx.strokeStyle = "#4980c8";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mid_x + 0.5, offset_y);
      ctx.lineTo(mid_x + 0.5, bottom);
      ctx.moveTo(offset_x, mid_y + 0.5);
      ctx.lineTo(right, mid_y + 0.5);
      ctx.stroke();

      return sheet;
    },
  },
};
</script>

<style>
/* Isolated postcard page — Slash brand, mobile-first steps */
._postcard {
  --c-slash-blue: #4980c8;
  --c-slash-mint: #e5ffdb;
  --c-slash-burgundy: #87221d;
  --c-slash-orange: #ff5829;
  --pc-ink: #262626;
  --pc-muted: #5a5a5a;
  --pc-paper: #fff;
  --pc-rule: rgba(73, 128, 200, 0.4);
  --pc-font: "Rubik", "Helvetica Neue", sans-serif;
  --pc-radius: 0.75rem;
  --pc-field-border: color-mix(in srgb, var(--c-slash-blue) 35%, white);
  --pc-focus-ring: 0 0 0 3px
    color-mix(in srgb, var(--c-slash-blue) 25%, transparent);

  box-sizing: border-box;
  min-height: 100vh;
  min-height: 100dvh;
  margin: 0;
  padding: 1.25rem clamp(1rem, 4vw, 2rem) 2rem;
  background-color: #fff;
  background-image:
    linear-gradient(
      115deg,
      transparent 0%,
      transparent 46%,
      color-mix(in srgb, var(--c-slash-mint) 55%, transparent) 46%,
      color-mix(in srgb, var(--c-slash-mint) 55%, transparent) 54%,
      transparent 54%
    ),
    radial-gradient(
      ellipse at 0% 0%,
      color-mix(in srgb, var(--c-slash-blue) 14%, transparent),
      transparent 42%
    ),
    radial-gradient(
      ellipse at 100% 10%,
      color-mix(in srgb, var(--c-slash-orange) 12%, transparent),
      transparent 38%
    );
  color: var(--pc-ink);
  font-family: var(--pc-font);
  max-width: 100vw;
  overflow-x: clip;
}

._postcard *,
._postcard *::before,
._postcard *::after {
  box-sizing: border-box;
}

._postcard--header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.85rem 1.25rem;
  max-width: 28rem;
  margin: 0 auto 1.25rem;
}

._postcard.is--composeWide ._postcard--header {
  max-width: min(100%, 104rem);
}

._postcard--brand {
  display: block;
  color: var(--c-slash-burgundy);
  text-decoration: none;
  flex: 0 0 auto;
}

._postcard--brand:hover {
  color: var(--c-slash-blue);
}

._postcard--logo {
  display: block;
  width: clamp(7.5rem, 18vw, 9.5rem);
  height: auto;
}

._postcard--headerText {
  flex: 1 1 10rem;
  min-width: 0;
}

._postcard--title {
  margin: 0 0 0.25rem;
  font-size: clamp(1.4rem, 5vw, 1.85rem);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--c-slash-burgundy);
}

._postcard--lead {
  margin: 0;
  color: var(--pc-muted);
  font-size: 0.92rem;
  line-height: 1.4;
}

._postcard--shell {
  max-width: 28rem;
  margin: 0 auto;
}

._postcard--shell.is--compose {
  max-width: min(100%, 104rem);
}

._postcard--compose {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
}

._postcard--form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  padding: 0;
  background: transparent;
  border: 0;
}

._postcard--formFields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

._postcard--formFooter {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

._postcard--formActions {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  ._postcard--deleteBtn {
    flex: 0 0 auto;
  }

  ._postcard--primary {
    flex: 1 1 auto;
    width: auto;
  }
}

._postcard--previewBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  padding: 0.55rem 0.85rem;
  border: 1px solid color-mix(in srgb, var(--c-slash-burgundy) 35%, white);
  border-radius: 999px;
  background: #fff;
  color: var(--c-slash-burgundy);
  font-family: var(--pc-font);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);

  .b-icon {
    font-size: 1.05rem;
  }
}

._postcard--previewBtn:hover,
._postcard--previewBtn:focus-visible {
  outline: none;
  border-color: var(--c-slash-burgundy);
  background: color-mix(in srgb, var(--c-slash-mint) 55%, white);
}

._postcard--previewPane {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

._postcard--previewPane.is--overlay {
  position: fixed;
  inset: 0;
  z-index: 30;
  padding: 1rem 1rem 6.5rem;
  background: color-mix(in srgb, #fff 92%, var(--c-slash-mint));
  overflow: auto;
  animation: postcardPreviewIn 0.25s cubic-bezier(0.19, 1, 0.22, 1);
}

._postcard--previewToolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

._postcard--previewLabel {
  color: var(--c-slash-burgundy);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

._postcard--dangerZone.is--inline {
  margin-top: 0.25rem;
  padding-top: 0.75rem;
  border-top: 1px solid color-mix(in srgb, var(--c-slash-burgundy) 18%, white);
}

@keyframes postcardPreviewIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

._postcard.is--share {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: calc(var(--spacing) * 2);
  padding-bottom: calc(4.75rem + env(safe-area-inset-bottom, 0px));
  min-height: 100vh;
  box-sizing: border-box;
}

._postcard--shareHeader {
  --site-brand-color: var(--c-slash-burgundy);
  width: 100%;
  margin: 0 0 calc(var(--spacing) * 1.5);
  padding: calc(var(--spacing)) 0;
  flex-shrink: 0;
}

._postcard--shareActions {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: safe center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem clamp(1rem, 4vw, 2rem)
    calc(0.75rem + env(safe-area-inset-bottom, 0px));
  overflow-x: auto;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  border-top: 1px solid color-mix(in srgb, var(--c-slash-blue) 18%, white);
  background: #fff;
  box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.06);

  ._postcard--editBtn {
    flex: 0 0 auto;
  }
}

._postcard--editBtn.is--icon {
  padding: 0.35rem;
}

._postcard--browse {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.4rem;
  margin-right: 0.5rem;
}

._postcard--browseCount {
  flex: 0 0 auto;
  font-family: var(--pc-font);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  color: var(--pc-muted);
}

._postcard--shell.is--share {
  --pc-card-reserved-height: 18rem;
  width: min(100%, 64rem);
  max-width: min(100%, 64rem);
  margin: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

._postcard--editBtn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.7rem;
  border: 1px solid color-mix(in srgb, var(--c-slash-burgundy) 35%, white);
  border-radius: 999px;
  background: #fff;
  color: var(--c-slash-burgundy);
  font-family: var(--pc-font);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  transition: transform 0.15s ease, border-color 0.15s ease,
    background-color 0.15s ease;

  .b-icon {
    font-size: 1rem;
  }
}

._postcard--editBtn:hover,
._postcard--editBtn:focus-visible {
  outline: none;
  transform: translateY(-1px);
  border-color: var(--c-slash-burgundy);
  background: color-mix(in srgb, var(--c-slash-mint) 55%, white);
}

._postcard--editBtn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

._postcard ._spinner {
  animation: postcardSpin 0.8s linear infinite;
}

@keyframes postcardSpin {
  to {
    transform: rotate(360deg);
  }
}

._postcard--status {
  padding: 1rem;
  color: var(--pc-muted);
  text-align: center;
}

._postcard--step {
  margin: 0 0 0.25rem;
  color: var(--c-slash-blue);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

._postcard--result {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

._postcard--field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.85rem;
  min-width: 0;
  max-width: 100%;
}

._postcard--label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  font-weight: 500;
  color: var(--c-slash-burgundy);
}

._postcard--counter {
  color: var(--c-slash-blue);
  font-weight: 400;
  font-variant-numeric: tabular-nums;
}

._postcard--fileInput {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

._postcard--pick {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  width: 100%;
  max-width: 100%;
  min-height: 1.875rem;
  padding: 0.25rem 0.75rem;
  overflow: hidden;
  border: 1px solid var(--pc-field-border);
  border-radius: var(--pc-radius);
  background: var(--c-slash-mint);
  color: var(--c-slash-burgundy);
  font-family: var(--pc-font);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  .b-icon {
    flex-shrink: 0;
    font-size: 1rem;
  }
}

._postcard--pick:hover:not(:disabled) {
  border-color: var(--c-slash-blue);
  background: color-mix(in srgb, var(--c-slash-mint) 70%, white);
}

._postcard--pickLabel {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

._postcard--fromFolder {
  align-self: flex-start;
  margin-top: 0.15rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--c-slash-blue);
  font-family: var(--pc-font);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.15em;
  cursor: pointer;
}

._postcard--fromFolder:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  text-decoration: none;
}

._postcard--audio {
  width: 100%;
  margin-top: 0.25rem;
  height: 2.25rem;
}

._postcard--textarea {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--pc-field-border);
  border-radius: var(--pc-radius);
  background: #fff;
  color: var(--pc-ink);
  font-family: var(--pc-font);
  font-size: 0.9rem;
  line-height: 1.45;
  resize: vertical;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

._postcard--textarea:focus {
  outline: none;
  border-color: var(--c-slash-blue);
  box-shadow: var(--pc-focus-ring);
}

._postcard--textarea:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

._postcard--primary,
._postcard--secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 2.5rem;
  padding: 0.4rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--pc-radius);
  font-family: var(--pc-font);
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;

  .b-icon {
    flex-shrink: 0;
    font-size: 1.1rem;
  }
}

._postcard--primary {
  background: var(--c-slash-orange);
  color: #fff;
}

._postcard--primary:hover:not(:disabled) {
  background: #ff6f47;
}

._postcard--primary:active:not(:disabled) {
  background: #d9441f;
}

._postcard--secondary {
  background: #fff;
  border-color: var(--pc-field-border);
  color: var(--pc-ink);
}

._postcard--secondary:hover:not(:disabled) {
  border-color: var(--c-slash-blue);
  background: color-mix(in srgb, var(--c-slash-mint) 40%, white);
}

._postcard--pick:focus-visible,
._postcard--primary:focus-visible,
._postcard--secondary:focus-visible {
  outline: none;
  box-shadow: var(--pc-focus-ring);
}

._postcard--pick:disabled,
._postcard--primary:disabled,
._postcard--secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

._postcard--alert {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.75rem 1rem;
  border: 1px solid color-mix(in srgb, var(--pc-alert-color) 30%, white);
  border-top: 3px solid var(--pc-alert-color);
  border-radius: var(--pc-radius);
  background: #fff;
  color: var(--pc-ink);
  font-size: 0.875rem;
  line-height: 1.4;

  .b-icon {
    flex-shrink: 0;
    margin-top: 0.1em;
    font-size: 1.15rem;
    color: var(--pc-alert-color);
  }
}

._postcard--alert.is--danger {
  --pc-alert-color: var(--c-slash-burgundy);
}

._postcard--alert.is--warning {
  --pc-alert-color: #d97706;
}

._postcard--progress {
  width: 100%;
  height: 0.45rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--c-slash-blue) 18%, white);
  overflow: hidden;
}

._postcard--progressBar {
  height: 100%;
  border-radius: inherit;
  background: var(--c-slash-orange);
  transition: width 0.2s ease;
}

._postcard--actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

._postcard--shareMenu {
  width: 100%;

  > ._postcard--primary {
    flex: 1;
  }
}

._postcard--dangerZone {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--c-slash-burgundy) 18%, white);
  display: flex;
  justify-content: center;
}

._postcard--deleteBtn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid color-mix(in srgb, var(--c-slash-burgundy) 40%, white);
  border-radius: 999px;
  background: transparent;
  color: var(--c-slash-burgundy);
  font-family: var(--pc-font);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease,
    background-color 0.15s ease;

  .b-icon {
    font-size: 1rem;
  }
}

._postcard--deleteBtn:hover,
._postcard--deleteBtn:focus-visible {
  outline: none;
  transform: translateY(-1px);
  border-color: var(--c-slash-burgundy);
  background: color-mix(in srgb, var(--c-slash-burgundy) 8%, white);
}

._postcard--card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  container-type: inline-size;
  width: 100%;
  /* fit the screen height too, so the whole card stays visible */
  max-width: min(
    100%,
    max(
      18rem,
      calc(
        (100dvh - var(--pc-card-reserved-height, 10rem)) * 148 / 105
      )
    )
  );
  margin-inline: auto;
  background: var(--pc-paper);
  border: 2px solid var(--c-slash-blue);
  box-shadow: 0 14px 36px
    color-mix(in srgb, var(--c-slash-blue) 18%, transparent);
  overflow: hidden;
}

._postcard--imagePane.is--hit {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  color: #fff;
  font: inherit;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }
}

._postcard--zoneHint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  color: var(--c-slash-mint);
  font-size: 0.85rem;
  letter-spacing: 0.04em;

  .b-icon {
    font-size: 1.75rem;
  }

  &.is--overlay {
    inset: auto 0 0.55rem;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0;

    &::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      z-index: -1;
      width: 5.5rem;
      height: 1.6rem;
      transform: translate(-50%, -50%);
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.45);
    }
  }
}

._postcard--zoneSpinner {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
  color: #fff;
  font-size: 1.25rem;
}

._postcard--stampRow {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 0.4rem;
}

._postcard--stamp.is--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  border-style: dashed;
  color: var(--c-slash-burgundy);
  font-size: 1.35rem;
  box-shadow: none;
}

._postcard--zoneLinks {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.75rem;
}

._postcard--zoneLink {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--c-slash-blue);
  font-family: var(--pc-font);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 0.15em;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

._postcard--rules.is--editable {
  container-type: size;
  position: relative;
}

._postcard--cardText {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  resize: none;
  overflow: hidden;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(12.5% - 1px),
    var(--pc-rule) calc(12.5% - 1px),
    var(--pc-rule) 12.5%
  );
  color: var(--pc-ink);
  font-family: var(--pc-font);
  font-size: max(0.55rem, 7cqh);
  line-height: 12.5cqh;
  caret-color: var(--c-slash-burgundy);

  &::placeholder {
    color: var(--pc-muted);
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    opacity: 0.7;
  }
}

._postcard--imagePane {
  position: relative;
  min-height: 0;
  background: var(--c-slash-blue);
}

._postcard--image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

._postcard--imagePlaceholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 10rem;
  color: var(--c-slash-mint);
  font-size: 0.85rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

._postcard--rightPane {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.65rem 0.7rem 0.8rem;
  min-width: 0;
  background: var(--pc-paper);
}

._postcard--stamp {
  position: relative;
  align-self: flex-end;
  width: 28%;
  min-width: 3rem;
  aspect-ratio: 1;
  padding: 0;
  margin: 0;
  background: #fff;
  border: 2px solid var(--c-slash-burgundy);
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
  color: inherit;
  font: inherit;
  cursor: pointer;
}

._postcard--stamp:hover,
._postcard--stamp:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--c-slash-orange) 45%, transparent);
}

._postcard--qr {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 4%;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

._postcard--stopBtn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: #fff;
}

._postcard--stopIcon {
  display: block;
  width: 34%;
  height: 34%;
  background: var(--c-slash-orange);
  border-radius: 2px;
}

._postcard--cardAudio {
  display: none;
}

._postcard--rules {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 0;
}

._postcard--rule {
  flex: 1;
  display: flex;
  align-items: flex-end;
  border-bottom: 1px solid var(--pc-rule);
  min-height: 0;
}

._postcard--ruleText {
  display: block;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: clip;
  font-size: clamp(0.5rem, 2.4vw, 0.72rem);
  font-size: max(0.5rem, 2.25cqi);
  line-height: 1.2;
  padding-bottom: 0.12em;
  color: var(--pc-ink);
}

._postcard--mark {
  margin: -0.25rem 0 0;
  text-align: right;
  color: var(--c-slash-burgundy);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

@media (max-width: 639px) {
  ._postcard.is--compose {
    padding-bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
  }

  ._postcard--formFooter {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 40;
    margin: 0;
    padding: 0.75rem clamp(1rem, 4vw, 2rem)
      calc(0.75rem + env(safe-area-inset-bottom, 0px));
    border-top: 1px solid color-mix(in srgb, var(--c-slash-blue) 18%, white);
    background: #fff;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.06);
  }
}

@media (min-width: 640px) {
  ._postcard--shell:not(.is--compose):not(.is--share) {
    --pc-card-reserved-height: 16rem;
    max-width: min(100%, 64rem);
  }

  ._postcard:not(.is--composeWide) ._postcard--header {
    max-width: 32rem;
  }

  ._postcard:not(.is--compose):not(.is--share) ._postcard--header {
    max-width: min(100%, 64rem);
  }

  ._postcard--actions {
    flex-direction: row;
  }

  ._postcard--primary,
  ._postcard--secondary {
    flex: 1;
  }
}
</style>
