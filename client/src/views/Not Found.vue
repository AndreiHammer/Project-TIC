<template>
  <v-container>
    <v-row align="center" justify="center" class="fill-height">
      <v-col cols="12" class="text-center">
        <h1 class="text-h1">404</h1>
        <p class="text-h5 mb-4">Page Not Found</p>
        <v-btn color="primary" to="/" variant="outlined">
          Go Home
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'NotFound',
}
</script>

<style scoped>
.fill-height {
  min-height: 70vh;
}
</style>

