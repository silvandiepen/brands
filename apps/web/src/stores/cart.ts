import { computed, ref } from 'vue'

const STORAGE_KEY = 'ob-cart'

function readCart(): string[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

const cart = ref<string[]>(typeof window === 'undefined' ? [] : readCart())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart.value))
}

export function useCart() {
  function add(brandId: string) {
    if (cart.value.includes(brandId)) return
    cart.value = [...cart.value, brandId]
    persist()
  }

  function remove(brandId: string) {
    cart.value = cart.value.filter(id => id !== brandId)
    persist()
  }

  function clear() {
    cart.value = []
    persist()
  }

  return {
    cart,
    count: computed(() => cart.value.length),
    add,
    remove,
    clear,
  }
}
