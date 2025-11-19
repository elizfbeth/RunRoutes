<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
    @click.self="$emit('close')"
    role="dialog"
    aria-modal="true"
    aria-labelledby="share-modal-title"
  >
    <div class="bg-white rounded-lg max-w-lg w-full p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 id="share-modal-title" class="text-xl font-semibold text-gray-900">
          Share Route
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 hover:text-gray-600 transition"
          aria-label="Close share modal"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <!-- Direct Link -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Direct Link
          </label>
          <div class="flex gap-2">
            <input
              ref="linkInput"
              type="text"
              :value="shareUrl"
              readonly
              class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
              aria-label="Shareable route link"
            />
            <button
              @click="copyLink"
              class="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700 transition flex items-center gap-2"
              :aria-label="copied ? 'Link copied' : 'Copy link to clipboard'"
            >
              <svg v-if="!copied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              {{ copied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <!-- Social Sharing -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Share On
          </label>
          <div class="flex gap-3">
            <button
              @click="shareOnTwitter"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              aria-label="Share on Twitter"
            >
              <svg class="w-5 h-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
              Twitter
            </button>
            <button
              @click="shareOnFacebook"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              aria-label="Share on Facebook"
            >
              <svg class="w-5 h-5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
            <button
              @click="shareOnEmail"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition"
              aria-label="Share via email"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </button>
          </div>
        </div>

        <!-- Embed Code (Optional) -->
        <div v-if="showEmbed">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Embed Code
          </label>
          <div class="relative">
            <textarea
              ref="embedInput"
              :value="embedCode"
              readonly
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-xs font-mono"
              aria-label="Embed code for route"
            ></textarea>
            <button
              @click="copyEmbed"
              class="absolute top-2 right-2 px-3 py-1 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50 transition"
              :aria-label="embedCopied ? 'Embed code copied' : 'Copy embed code'"
            >
              {{ embedCopied ? 'Copied!' : 'Copy' }}
            </button>
          </div>
        </div>

        <button
          v-if="!showEmbed"
          @click="showEmbed = true"
          class="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Show embed code
        </button>
      </div>

      <div class="mt-6 flex justify-end">
        <button
          @click="$emit('close')"
          class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          Close
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  route: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const linkInput = ref(null)
const embedInput = ref(null)
const copied = ref(false)
const embedCopied = ref(false)
const showEmbed = ref(false)

// Generate share URL
const shareUrl = computed(() => {
  const baseUrl = window.location.origin
  return `${baseUrl}/routes/${props.route.id}`
})

// Generate embed code
const embedCode = computed(() => {
  return `<iframe src="${shareUrl.value}?embed=true" width="100%" height="600" frameborder="0" style="border:0" allowfullscreen></iframe>`
})

// Share text
const shareText = computed(() => {
  return `Check out this ${props.route.distance}km route: ${props.route.route_name}`
})

// Copy link to clipboard
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    // Fallback for older browsers
    linkInput.value?.select()
    document.execCommand('copy')
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  }
}

// Copy embed code
const copyEmbed = async () => {
  try {
    await navigator.clipboard.writeText(embedCode.value)
    embedCopied.value = true
    setTimeout(() => {
      embedCopied.value = false
    }, 2000)
  } catch (err) {
    embedInput.value?.select()
    document.execCommand('copy')
    embedCopied.value = true
    setTimeout(() => {
      embedCopied.value = false
    }, 2000)
  }
}

// Share on Twitter
const shareOnTwitter = () => {
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText.value)}&url=${encodeURIComponent(shareUrl.value)}`
  window.open(url, '_blank', 'width=550,height=420')
}

// Share on Facebook
const shareOnFacebook = () => {
  const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl.value)}`
  window.open(url, '_blank', 'width=550,height=420')
}

// Share via Email
const shareOnEmail = () => {
  const subject = encodeURIComponent(`Check out this route: ${props.route.route_name}`)
  const body = encodeURIComponent(`${shareText.value}\n\n${shareUrl.value}`)
  window.location.href = `mailto:?subject=${subject}&body=${body}`
}
</script>

