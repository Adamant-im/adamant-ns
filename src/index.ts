import { main } from './main.js'

main().catch(async (e) => {
  console.error(e)
  process.exit(1)
})
