"use client"

import * as React from "react"
import { nanoid } from 'nanoid'
import { create } from 'zustand'

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

interface ToastStore {
  toasts: ToasterToast[]
  addToast: (toast: Omit<ToasterToast, "id">) => string
  updateToast: (id: string, toast: Partial<ToasterToast>) => void
  dismissToast: (id?: string) => void
  removeToast: (id?: string) => void
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) return
  
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    useToastStore.getState().removeToast(toastId)
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = nanoid()
    set((state) => ({
      toasts: [{ ...toast, id }, ...state.toasts].slice(0, TOAST_LIMIT),
    }))
    return id
  },
  updateToast: (id, toast) =>
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, ...toast } : t
      ),
    })),
  dismissToast: (id) => {
    if (id) {
      addToRemoveQueue(id)
    } else {
      useToastStore.getState().toasts.forEach((toast) => {
        addToRemoveQueue(toast.id)
      })
    }
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id || id === undefined ? { ...t, open: false } : t
      ),
    }))
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: id ? state.toasts.filter((t) => t.id !== id) : [],
    })),
}))

function toast(props: Omit<ToasterToast, "id">) {
  const { addToast, dismissToast, updateToast } = useToastStore.getState()
  
  const id = addToast({
    ...props,
    open: true,
    onOpenChange: (open) => {
      if (!open) dismissToast(id)
    },
  })

  return {
    id,
    dismiss: () => dismissToast(id),
    update: (props: Partial<ToasterToast>) => updateToast(id, props),
  }
}

function useToast() {
  const store = useToastStore()
  
  return {
    ...store,
    toast,
    dismiss: store.dismissToast,
  }
}

export { useToast, toast }
