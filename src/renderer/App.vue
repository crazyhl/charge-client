<template >
  <a-layout :style="{background: '#fff'}">
    <a-layout-header :style="{ position: 'fixed', zIndex: 1, width: '100%', background: '#fff', padding: '0' }">
      <navigator />
    </a-layout-header>
    <a-layout-content :style="{ padding: '0 50px', marginTop: '80px' }">
      <router-view> </router-view>
    </a-layout-content>
    <a-layout-footer :style="{ textAlign: 'center', background: '#fff' }">
      生活账 ©2021-{{currentYear}} Created by <a href="https://www.cimple.ink" target="_blank">M1ralce.Hao</a>
    </a-layout-footer>
  </a-layout>
</template>

<script lang=ts>
import { defineComponent, ref } from 'vue'
import directive from '/@/directives/sample'
import Navigator from '/@/components/HomeNavigator.vue'

export default defineComponent({
  components: {
    Navigator
  },
  directives: {
    directive
  },
  setup() {
    return {
      currentYear: ref(new Date().getFullYear())
    }
  }
})
</script>

<style>
</style>
