import type { CollectionConfig } from 'payload'
import sharp from 'sharp'

// Watermarks every uploaded photo before Payload writes it to storage —
// worth doing given how easily listing photos get lifted by scrapers (the
// same kind of scraper this project's owner has personally built against
// Cheki/PigiaMe for an earlier project).
//
// Flagging honestly: this hooks into `beforeOperation` and reads the raw
// upload off `req.file.data`, which is the documented shape for Payload's
// upload-handling internals as of Payload 3 — but it hasn't been run
// against a live instance in this environment (no way to test file uploads
// without a running Postgres + dev server here). If `req.file` turns out to
// expose the buffer under a different property in your installed version,
// this is the one line to fix.
async function watermarkUpload({ req, operation }: { req: any; operation: string }) {
  if (operation !== 'create' || !req.file?.data || !req.file?.mimetype?.startsWith('image/')) return
  try {
    const { width, height } = await sharp(req.file.data).metadata()
    if (!width || !height) return
    const fontSize = Math.max(14, Math.round(width * 0.025))
    const watermarkSvg = Buffer.from(`
      <svg width="${width}" height="${height}">
        <text x="${width - 12}" y="${height - 12}" text-anchor="end"
          font-family="sans-serif" font-size="${fontSize}" fill="white" fill-opacity="0.65"
          stroke="black" stroke-opacity="0.35" stroke-width="1">magariyetu.co.ke</text>
      </svg>
    `)
    req.file.data = await sharp(req.file.data).composite([{ input: watermarkSvg, gravity: 'southeast' }]).toBuffer()
  } catch (err) {
    // Never block an upload just because watermarking failed.
    console.warn('[media] watermarking failed, storing original image:', err)
  }
}

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    // staticDir is now purely the local-dev fallback. The Vercel Blob
    // storage plugin registered in payload.config.ts takes over
    // automatically whenever BLOB_READ_WRITE_TOKEN is set — verified against
    // the plugin's own type definitions, it disables itself and falls back
    // to this local path when the token is absent, so no environment-
    // specific branching is needed here. The watermark hook above runs in
    // beforeOperation, which fires before Payload's upload-handling takes
    // over storage — so the buffer reaching either local disk or Blob
    // storage is always the watermarked version, regardless of which one is
    // active.
    staticDir: '../public/media',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800, height: 600, position: 'centre' },
      { name: 'full', width: 1600, height: undefined },
    ],
    mimeTypes: ['image/*', 'application/pdf'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin' || user.role === 'moderator') return true
      return { uploadedBy: { equals: user.id } }
    },
  },
  fields: [
    { name: 'alt', type: 'text' },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      access: { update: ({ req: { user } }) => user?.role === 'admin' || user?.role === 'moderator' },
      admin: { position: 'sidebar' },
    },
  ],
  hooks: {
    beforeOperation: [watermarkUpload],
    beforeChange: [
      ({ data, req }) => {
        if (req.user && !data.uploadedBy) data.uploadedBy = req.user.id
        return data
      },
    ],
  },
}
