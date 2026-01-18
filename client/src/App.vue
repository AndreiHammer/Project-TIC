<template>
  <v-app>
    <v-main>
      <router-view v-slot="{ Component }">
        <keep-alive :include="['ProductsList']">
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
#app {
  font-family: 'Roboto', sans-serif;
}
</style>