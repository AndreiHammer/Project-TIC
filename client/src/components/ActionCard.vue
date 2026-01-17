<template>
  <v-card class="action-card" :class="{ 'action-card--disabled': disabled }" hover :disabled="disabled"
    @click="handleClick" elevation="3">
    <v-card-text class="pa-6">
      <div class="d-flex align-center mb-4">
        <v-avatar :color="avatarColor" :size="avatarSize" class="mr-4">
          <v-icon :icon="icon" :size="iconSize"></v-icon>
        </v-avatar>
        <div>
          <h3 class="text-h5 font-weight-bold">{{ title }}</h3>
          <p v-if="subtitle" class="text-medium-emphasis mb-0">{{ subtitle }}</p>
        </div>
      </div>

      <v-divider v-if="showDivider" class="mb-4"></v-divider>

      <p v-if="description" class="text-body-1 mb-4">
        {{ description }}
      </p>

      <v-list v-if="features && features.length" density="compact" class="bg-transparent">
        <v-list-item v-for="(feature, index) in features" :key="index">
          <v-icon :icon="feature.completed ? 'mdi-check-circle' : 'mdi-clock-outline'"
            :color="feature.completed ? 'success' : 'grey'" size="small" class="mr-2"></v-icon>
          {{ feature.text }}
        </v-list-item>
      </v-list>

      <slot></slot>
    </v-card-text>

    <v-card-actions v-if="showButton" class="pa-4">
      <v-btn :color="buttonColor" block variant="tonal" :size="buttonSize" :disabled="disabled">
        {{ buttonText }}
        <v-icon v-if="buttonIcon" :icon="buttonIcon" end></v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'ActionCard',
  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },

    icon: {
      type: String,
      required: true,
    },
    avatarColor: {
      type: String,
      default: 'primary',
    },
    avatarSize: {
      type: [String, Number],
      default: 64,
    },
    iconSize: {
      type: [String, Number],
      default: 36,
    },

    features: {
      type: Array,
      default: () => [],
    },

    showButton: {
      type: Boolean,
      default: true,
    },
    buttonText: {
      type: String,
      default: 'View',
    },
    buttonColor: {
      type: String,
      default: 'primary',
    },
    buttonSize: {
      type: String,
      default: 'large',
    },
    buttonIcon: {
      type: String,
      default: 'mdi-arrow-right',
    },

    showDivider: {
      type: Boolean,
      default: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['click'],
  methods: {
    handleClick() {
      if (!this.disabled) {
        this.$emit('click')
      }
    },
  },
}
</script>

<style scoped>
.action-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;
}

.action-card:hover:not(.action-card--disabled) {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.action-card--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>