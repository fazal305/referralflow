export default function handler(req, res) {
  const configured = Boolean(
    process.env.DATABASE_URL &&
      process.env.SESSION_SECRET &&
      process.env.ADMIN_EMAIL &&
      process.env.ADMIN_PASSWORD_HASH,
  )
  res.status(200).json({ ok: configured })
}
