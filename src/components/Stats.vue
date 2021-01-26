<template><div ref="stats"></div></template>

<script>
import Stats from "stats-js";

export default {
  data() {
    return {
      stats: new Stats(),
    };
  },
  methods: {
    animateStats() {
      this.stats.begin();
      this.stats.end();
      requestAnimationFrame(this.animateStats);
    },
  },
  mounted() {
    this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    this.$refs.stats.appendChild(this.stats.dom);
    requestAnimationFrame(this.animateStats);
  },
};
</script>