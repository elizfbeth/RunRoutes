<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <Navbar />
    <router-view />
  </div>
</template>

<script setup>
import Navbar from './components/Navbar.vue'
</script>

<style>
/* Global styles are handled by Tailwind CSS via index.css */
</style>

