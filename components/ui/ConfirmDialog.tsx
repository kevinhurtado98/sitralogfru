'use client'

import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { motion, AnimatePresence, type Variants } from 'motion/react'

interface Props {
  open:          boolean
  onOpenChange:  (open: boolean) => void
  title:         string
  description:   string
  confirmLabel?: string
  cancelLabel?:  string
  variant?:      'danger' | 'default'
  loading?:      boolean
  onConfirm:     () => void
}

const overlay: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.18 } },
  exit:   { opacity: 0, transition: { duration: 0.15 } },
}

const dialog: Variants = {
  hidden: { opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 8px)' },
  show:   { opacity: 1, scale: 1,    x: '-50%', y: '-50%', transition: { type: 'spring' as const, stiffness: 380, damping: 28 } },
  exit:   { opacity: 0, scale: 0.95, x: '-50%', y: 'calc(-50% + 4px)', transition: { duration: 0.15 } },
}

export function ConfirmDialog({
  open, onOpenChange,
  title, description,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  variant      = 'default',
  loading      = false,
  onConfirm,
}: Props) {
  const isDanger = variant === 'danger'

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <AlertDialog.Portal forceMount>
            {/* Overlay */}
            <AlertDialog.Overlay asChild forceMount>
              <motion.div
                variants={overlay} initial="hidden" animate="show" exit="exit"
                style={{
                  position: 'fixed', inset: 0,
                  background: 'rgba(0,0,0,0.4)',
                  zIndex: 200,
                }}
              />
            </AlertDialog.Overlay>

            {/* Content */}
            <AlertDialog.Content asChild forceMount>
              <motion.div
                variants={dialog} initial="hidden" animate="show" exit="exit"
                style={{
                  position: 'fixed',
                  top: '50%', left: '50%',
                  zIndex: 201,
                  background: 'var(--bg)',
                  borderRadius: 'var(--rl)',
                  boxShadow: '0 8px 40px rgba(0,0,0,0.16), 0 1px 3px rgba(0,0,0,0.08)',
                  border: '1px solid var(--bl)',
                  padding: '24px 24px 20px',
                  width: 400,
                  maxWidth: 'calc(100vw - 32px)',
                  outline: 'none',
                }}
              >
                <AlertDialog.Title style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)', margin: '0 0 8px' }}>
                  {title}
                </AlertDialog.Title>
                <AlertDialog.Description style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.6, margin: '0 0 22px' }}>
                  {description}
                </AlertDialog.Description>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <AlertDialog.Cancel asChild>
                    <button className="btn" disabled={loading}>{cancelLabel}</button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action asChild>
                    <button
                      className={`btn ${isDanger ? '' : 'btn-p'}`}
                      onClick={onConfirm}
                      disabled={loading}
                      style={isDanger ? {
                        background: 'var(--red)',
                        borderColor: 'var(--red)',
                        color: '#fff',
                        opacity: loading ? 0.6 : 1,
                      } : { opacity: loading ? 0.6 : 1 }}
                    >
                      {loading ? 'Procesando...' : confirmLabel}
                    </button>
                  </AlertDialog.Action>
                </div>
              </motion.div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        )}
      </AnimatePresence>
    </AlertDialog.Root>
  )
}
