module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  css: ['./src/index.css', './src/styles/essential.css'],
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
  safelist: [
    /^bg-/,
    /^text-/,
    /^border-/,
    /^hover:/,
    /^dark:/,
    /^focus:/,
    /^sm:/,
    /^md:/,
    /^lg:/,
    /^xl:/,
    /^2xl:/,
    /^grid-cols-/,
    /^col-span-/,
    /^gap-/,
    /^p-/,
    /^m-/,
    /^rounded-/,
    /^shadow-/,
    /^flex-/,
    /^items-/,
    /^justify-/,
    /^w-/,
    /^h-/,
    /^max-w-/,
    /^max-h-/,
    /^min-w-/,
    /^min-h-/,
    /^font-/,
    /^transform-/,
    /^transition-/,
    /^duration-/,
    /^ease-/,
    /^opacity-/,
    /^z-/,
    /^overflow-/,
    /^whitespace-/,
    /^tracking-/,
    /^leading-/,
    /^cursor-/,
    /^outline-/,
    /^ring-/,
    /^fill-/,
    /^stroke-/,
    /^animate-/,
    /^invisible/,
    /^visible/,
    /^block/,
    /^inline-block/,
    /^inline-flex/,
    /^flex/,
    /^grid/,
    /^hidden/,
    /^relative/,
    /^absolute/,
    /^fixed/,
    /^sticky/,
    /^static/,
  ]
}; 