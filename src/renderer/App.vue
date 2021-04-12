<template >
  <a-layout>
    <a-layout-header :style="{ position: 'fixed', zIndex: 1, width: '100%' }">
      <navigator />
    </a-layout-header>
    <a-layout-content :style="{ padding: '0 50px', marginTop: '64px' }">
      <router-view> </router-view>
    </a-layout-content>
    <a-layout-footer :style="{ textAlign: 'center' }">
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
.logo {
  height: 31px;
  line-height: 31px;
  color: #fff;
  margin: 16px 24px 16px 0;
  float: left;
}
.logo h3.ant-typography{
  color:#fff
}
.site-layout .site-layout-background {
  background: #fff;
}

[data-theme='dark'] .site-layout .site-layout-background {
  background: #141414;
}
</style>
