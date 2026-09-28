<template>
  <div
    class="_euLogo"
    :class="`is--${variant}`"
    role="img"
    aria-label="Co-funded by the European Union"
  >
    <svg
      class="_euLogo--flag"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 40"
      aria-hidden="true"
    >
      <rect class="_euLogo--field" width="60" height="40" />
      <polygon
        v-for="(points, index) in star_polygons"
        :key="index"
        class="_euLogo--star"
        :points="points"
      />
    </svg>
    <span class="_euLogo--text">
      <span>Co-funded by</span>
      <span>the European Union</span>
    </span>
  </div>
</template>

<script>
export default {
  name: "EuLogo",
  props: {
    variant: {
      type: String,
      default: "color",
      validator: (value) => ["color", "mono"].includes(value),
    },
  },
  computed: {
    star_polygons() {
      const center_x = 30;
      const center_y = 20;
      const circle_radius = 40 / 3;
      const outer_radius = 40 / 18;
      const inner_radius = outer_radius * 0.382;

      return Array.from({ length: 12 }, (_, star_index) => {
        const angle = (star_index * Math.PI * 2) / 12;
        const star_x = center_x + circle_radius * Math.sin(angle);
        const star_y = center_y - circle_radius * Math.cos(angle);

        return Array.from({ length: 10 }, (_, point_index) => {
          const radius = point_index % 2 === 0 ? outer_radius : inner_radius;
          const point_angle = (point_index * Math.PI) / 5;
          const x = star_x + radius * Math.sin(point_angle);
          const y = star_y - radius * Math.cos(point_angle);
          return `${x.toFixed(3)},${y.toFixed(3)}`;
        }).join(" ");
      });
    },
  },
};
</script>

<style lang="scss" scoped>
._euLogo {
  display: inline-flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.6em;
  color: inherit;
  line-height: 1.15;
}

._euLogo--flag {
  display: block;
  flex-shrink: 0;
  height: 2.6em;
  width: auto;
}

._euLogo--field {
  fill: #003399;
}

._euLogo--star {
  fill: #ffcc00;
}

.is--mono {
  ._euLogo--field {
    fill: currentColor;
  }
  ._euLogo--star {
    fill: var(--eu-logo-star-color, var(--c-slash-blue, #4980c8));
  }
}

._euLogo--text {
  display: flex;
  flex-direction: column;
  font-size: 1em;
  font-weight: 500;
  white-space: nowrap;
}
</style>
