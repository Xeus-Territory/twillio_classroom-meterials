<template>
  <div class="default">
    <Navbar />
    <main class="main">
      <slot class="slot-main" />
    </main>
  </div>
</template>

<script>
import Navbar from "@/components/Navbar.vue";
export default {
  components: { Navbar },
};
</script>

<style lang="scss" scoped>
body {
  margin: 0;
  padding: 0;
  width: 100vw;
  height: 100vh;
  background-color: red !important;
}
</style>
