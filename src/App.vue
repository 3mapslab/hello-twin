<template>
  <div id="app">
    <HelloTwin />
  </div>
</template>

<script>
import HelloTwin from "./components/HelloTwin.vue";

export default {
  name: "App",
  components: {
    HelloTwin,
  },
};
</script>

<style>
html,
body,
#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
}
</style>
