<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import AppNavbar from './components/AppNavbar.vue'
import AppMobileNavigation from './components/AppMobileNavigation.vue'
import AppBreadcrumb from './components/AppBreadcrumb.vue'
import AppPageContainer from './components/AppPageContainer.vue'
import AppToastContainer from '@/shared/components/feedback/AppToastContainer.vue'
import AppConfirmDialog from '@/shared/components/feedback/AppConfirmDialog.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col bg-[#F5F7FA] text-[#1F2937]">
    <!-- Application Header (Logo, Brand Title, User Profile Menu, Mobile Hamburger) -->
    <AppHeader />

    <!-- Horizontal Navigation Bar (Desktop Only) -->
    <div class="hidden lg:block">
      <AppNavbar />
    </div>

    <!-- Responsive Mobile Drawer Navigation -->
    <AppMobileNavigation />

    <!-- Dynamic Breadcrumb Trail -->
    <AppBreadcrumb />

    <!-- Main Content Area with Page Container -->
    <main class="flex-1 w-full">
      <AppPageContainer>
        <RouterView />
      </AppPageContainer>
    </main>

    <!-- Global Footer -->
    <footer
      class="border-t border-[#D9E0E7] bg-white text-[#64748B] py-3 text-center text-xs mt-auto"
    >
      <div
        class="w-full max-w-[1920px] mx-auto px-3 sm:px-5 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-2"
      >
        <span>
          &copy; {{ new Date().getFullYear() }} Impact Furniture ERP v2. All rights reserved.
        </span>
        <span class="text-[11px] text-slate-400">
          Enterprise ERP System — Sprint 1 Design System Foundation
        </span>
      </div>
    </footer>

    <!-- Global Teleported Modals / Feedback -->
    <AppToastContainer />
    <AppConfirmDialog />
  </div>
</template>
