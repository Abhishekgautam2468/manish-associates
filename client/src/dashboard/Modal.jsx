import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

// While any window is open the page behind it doesn't scroll. Counted, so a window opened from another one
// doesn't unlock the page when it closes. The scrollbar's width is kept as padding, so nothing jumps.
let openCount = 0
function lockPage() {
  if (openCount++ > 0) return
  const root = document.documentElement
  const bar = window.innerWidth - root.clientWidth
  root.style.overflow = 'hidden'
  if (bar > 0) root.style.paddingRight = `${bar}px`
}
function unlockPage() {
  if (--openCount > 0) return
  const root = document.documentElement
  root.style.overflow = ''
  root.style.paddingRight = ''
}

// tone colours the header icon: in, out, attn (pending/reminders), danger, or neutral.
// labelledBy: the content draws its own header (with that heading id) instead of the standard one.
function Modal({ title, description, icon, tone = 'neutral', onClose, children, size = 'md', labelledBy }) {
  const ref = useRef(null)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    const dialog = ref.current
    dialog.showModal()
    lockPage()
    return () => {
      dialog.close()
      unlockPage()
    }
  }, [])

  return (
    <dialog
      ref={ref}
      className={`modal modal--${size}`}
      aria-labelledby={labelledBy ?? titleId}
      aria-describedby={description && !labelledBy ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="modal__inner">
        {!labelledBy && (
          <header className="modal__head">
            {icon && (
              <span className={`modal__icon modal__icon--${tone}`} aria-hidden="true">
                {icon}
              </span>
            )}
            <div className="modal__heading">
              <h2 id={titleId} className="modal__title">
                {title}
              </h2>
              {description && (
                <p id={descId} className="modal__desc">
                  {description}
                </p>
              )}
            </div>
            <button type="button" className="icon-button modal__close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </header>
        )}
        {children}
      </div>
    </dialog>
  )
}

export default Modal
