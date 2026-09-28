import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Accueil",
    component: () => import("@/views/SlashHomeView.vue"),
  },
  {
    path: "/@",
    name: "Tous les auteurs",
    component: () => import("@/views/AuthorsView.vue"),
  },
  {
    path: "/@:author_slug",
    name: "Auteur",
    component: () => import("@/views/AuthorView.vue"),
  },
  {
    path: "/_ui",
    name: "UI (dev only)",
    component: () => import("@/views/UIView.vue"),
  },
  {
    // route to display a single media with caption/credits and
    // with qr scan option, and to generate preview for PDF and STL server-side
    path: "/_previewmedia",
    name: "Preview media",
    meta: {
      /* do not load full UI */
      static: true,
    },
    component: () => import("@/views/PreviewMedia.vue"),
  },
  {
    path: "/reset-password",
    name: "Reset Password",
    component: () => import("@/views/ResetPasswordView.vue"),
  },
  {
    path: "/postcard/new",
    name: "PostcardNew",
    component: () => import("@/views/PostcardView.vue"),
  },
  {
    path: "/postcard/:publication_slug/view",
    name: "PostcardShare",
    meta: {
      static: true,
    },
    component: () => import("@/views/PostcardView.vue"),
  },
  {
    path: "/postcard/:publication_slug",
    name: "Postcard",
    component: () => import("@/views/PostcardView.vue"),
  },
  {
    path: "/postcard",
    redirect: { name: "PostcardNew" },
  },
  {
    path: "/publications/:publication_slug",
    name: "RootPublication",
    component: () => import("@/views/RootPublicationView.vue"),
  },
  {
    path: "/legal",
    name: "Legal",
    meta: {
      static: true,
    },
    component: () => import("@/views/LegalView.vue"),
    props: { page: "legal" },
  },
  {
    path: "/privacy",
    name: "Privacy",
    meta: {
      static: true,
    },
    component: () => import("@/views/LegalView.vue"),
    props: { page: "privacy" },
  },
  {
    path: "/f/:folder_slug",
    name: "Folder",
    component: () => import("@/views/SlashHomeView.vue"),
  },
  {
    // keeps old /:folder_slug links (shared URLs, QR codes, prints) working
    path: "/:folder_slug",
    redirect: (to) => ({
      name: "Folder",
      params: { folder_slug: to.params.folder_slug },
      query: to.query,
      hash: to.hash,
    }),
  },
  {
    path: "*",
    name: "NotFound",
    component: () => import("@/views/NotFound.vue"),
  },
];

const router = new VueRouter({
  mode: "history",
  base: "/",
  routes,
  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve, reject) => {
      // only if changing page and not just query or hash
      if (to.path !== from.path) {
        setTimeout(() => {
          if (savedPosition) {
            return resolve(savedPosition);
          } else {
            return resolve({ x: 0, y: 0 });
          }
        }, 150);
      }
    });
  },
});

// Static routes render without FullUI (no auth init, no socket): entering the
// full app from one must be a fresh page load so init runs from scratch.
router.beforeEach((to, from, next) => {
  const leaves_static =
    from.matched.length > 0 && from.meta?.static === true;
  if (leaves_static && to.meta?.static !== true) {
    window.location.assign(to.fullPath);
    return next(false);
  }
  next();
});

export default router;
