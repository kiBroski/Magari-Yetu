import * as migration_20260829_130004_initial_schema from './20260829_130004_initial_schema'
import * as migration_20260830_230000_listing_and_crsp_specs from './20260830_230000_listing_and_crsp_specs'
import * as migration_20260830_231000_private_dealer_verification_documents from './20260830_231000_private_dealer_verification_documents'
import * as migration_20260904_000000_align_crsp_with_kra_source from './20260904_000000_align_crsp_with_kra_source'

export const migrations = [
  {
    up: migration_20260829_130004_initial_schema.up,
    down: migration_20260829_130004_initial_schema.down,
    name: '20260829_130004_initial_schema',
  },
  {
    up: migration_20260830_230000_listing_and_crsp_specs.up,
    down: migration_20260830_230000_listing_and_crsp_specs.down,
    name: '20260830_230000_listing_and_crsp_specs',
  },
  {
    up: migration_20260830_231000_private_dealer_verification_documents.up,
    down: migration_20260830_231000_private_dealer_verification_documents.down,
    name: '20260830_231000_private_dealer_verification_documents',
  },
  {
    up: migration_20260904_000000_align_crsp_with_kra_source.up,
    down: migration_20260904_000000_align_crsp_with_kra_source.down,
    name: '20260904_000000_align_crsp_with_kra_source',
  },
]