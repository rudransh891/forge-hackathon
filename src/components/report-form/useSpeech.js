import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Voice input through the browser's own recogniser.
 *
 * Chrome, Edge and Safari ship SpeechRecognition; Firefox does not. The audio
 * is transcribed by the browser — nothing is uploaded to us — and the text is
 * handed back so the form can put it in the description. The language follows
 * the interface language.
 */
export function useSpeech(lang, onText) {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const recognition = useRef(null)
  const handler = useRef(onText)
  handler.current = onText

  useEffect(() => {
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) return undefined

    const instance = new Ctor()
    instance.continuous = true
    instance.interimResults = false
    instance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN'
    instance.onresult = (event) => {
      let text = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        if (event.results[index].isFinal) text += event.results[index][0].transcript
      }
      if (text.trim()) handler.current(text.trim())
    }
    instance.onerror = (event) => {
      setError(event.error === 'not-allowed' ? 'Microphone permission was denied.' : '')
      setListening(false)
    }
    instance.onend = () => setListening(false)

    recognition.current = instance
    setSupported(true)

    return () => {
      try {
        instance.abort()
      } catch {
        /* already stopped */
      }
      recognition.current = null
    }
  }, [lang])

  const toggle = useCallback(() => {
    const instance = recognition.current
    if (!instance) return
    if (listening) {
      instance.stop()
      setListening(false)
      return
    }
    setError('')
    try {
      instance.start()
      setListening(true)
    } catch {
      setListening(false)
    }
  }, [listening])

  return { supported, listening, error, toggle }
}
