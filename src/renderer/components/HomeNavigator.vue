<template>
  <div class="logo">
    <a-typography-title :level="3">生活账</a-typography-title>
  </div>
  <a-menu
    mode="horizontal"
    v-model:selectedKeys="selectedKeys"
    :style="{ lineHeight: '64px' }"
  >
    <a-menu-item key="1">
      <router-link class="clickable" replace to="/">首页</router-link>
    </a-menu-item>
    <a-menu-item key="2">
      <router-link class="clickable" replace to="/about">关于</router-link>
    </a-menu-item>
    <a-sub-menu>
      <template #title>
        <span class="submenu-title-wrapper">
          <setting-outlined />
          设置
        </span>
      </template>
      <a-menu-item key="3">
        <router-link class="clickable" replace to="/accounts">账户设置</router-link>
      </a-menu-item>
    </a-sub-menu>
  </a-menu>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

export default defineComponent({
  components: {
  },
  setup() {
    return {
      selectedKeys: ref<string[]>(['1'])
    }
  }
})
</script>

<style scoped>
.logo {
  height: 31px;
  line-height: 31px;
  margin: 16px 24px 16px 0;
  float: left;
  padding-left: 50px;
}
</style>
