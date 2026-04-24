/**
 * Gera o hash bcrypt da senha do admin.
 * Uso: node scripts/generate-hash.mjs SuaSenhaAqui
 */
import bcrypt from 'bcryptjs'

const password = process.argv[2]

if (!password) {
  console.error('Uso: node scripts/generate-hash.mjs <senha>')
  process.exit(1)
}

const hash = await bcrypt.hash(password, 12)
console.log('\n✅ Adicione ao .env.local:\n')
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`)
console.log('(Você pode remover ADMIN_PASSWORD depois)\n')
