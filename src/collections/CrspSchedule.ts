
import type { CollectionConfig } from 'payload'


export const CrspSchedule: CollectionConfig = {
  slug: 'crsp-schedule',

  admin: {
    useAsTitle: 'model',
    defaultColumns: [
      'make',
      'model',
      'modelNumber',
      'sourceGroup',
      'crspValueKes',
      'verified',
    ],
  },

  access: {
    // CRSP data is required by the public import-duty calculator.
    read: () => true,

    create: ({ req: { user } }) =>
      user?.role === 'admin' || user?.role === 'moderator',

    update: ({ req: { user } }) =>
      user?.role === 'admin' || user?.role === 'moderator',

    delete: ({ req: { user } }) => user?.role === 'admin',
  },

  fields: [
    {
      name: 'make',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Make/manufacturer exactly as supplied by the KRA CRSP source.',
      },
    },

    {
      name: 'model',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description:
          'Vehicle, motorcycle, tractor or grader model exactly as supplied by the KRA CRSP source.',
      },
    },

    {
      name: 'modelNumber',
      type: 'text',
      admin: {
        description:
          'KRA model number where supplied by the source schedule.',
      },
    },

    {
      name: 'transmission',
      type: 'text',
      admin: {
        description:
          'Transmission exactly as supplied by the KRA source, for example AT, 6MT or CVT.',
      },
    },

    {
      name: 'driveConfiguration',
      type: 'text',
      admin: {
        description:
          'Drive configuration where supplied, for example 2WD, 4WD, AWD, FWD or RWD.',
      },
    },

    {
      name: 'engineCapacityText',
      type: 'text',
      admin: {
        description:
          'Original KRA engine-capacity value preserved as text. This supports values such as 3000, 399 and 63 kWh.',
      },
    },

    {
      name: 'engineCc',
      type: 'number',
      admin: {
        description:
          'Numeric engine capacity in cc, populated only when the KRA source value is a numeric cc value.',
      },
    },

    {
      name: 'bodyType',
      type: 'text',
      admin: {
        description:
          'Body type where supplied by the KRA motor-vehicle schedule, for example SUV or HATCHBACK.',
      },
    },

    {
      name: 'gvwKg',
      type: 'number',
      admin: {
        description:
          'Gross vehicle weight in kilograms where supplied by the KRA source.',
      },
    },

    {
      name: 'seatingCapacity',
      type: 'number',
      admin: {
        description:
          'Seating capacity where supplied by the KRA source.',
      },
    },

    {
      name: 'fuelType',
      type: 'text',
      admin: {
        description:
          'Fuel value exactly as supplied by the KRA source, such as GASOLINE, DIESEL, HYBRID or ELECTRIC.',
      },
    },

    {
      name: 'sourceGroup',
      type: 'select',
      required: true,
      index: true,
      options: [
        {
          label: 'Motor vehicles',
          value: 'motor-vehicle',
        },
        {
          label: 'Motorcycles',
          value: 'motorcycle',
        },
        {
          label: 'Tractors & graders',
          value: 'tractor-grader',
        },
      ],
      admin: {
        description:
          'The actual CRSP source-sheet family. These values correspond to the three vehicle-data sheets in the July 2025 KRA workbook.',
      },
    },

    {
      name: 'crspValueKes',
      type: 'number',
      required: true,
      index: true,
      admin: {
        description:
          'Current Retail Selling Price (CRSP) in Kenyan shillings, as supplied by the KRA source.',
      },
    },

    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description:
          'True when this row has been imported from or directly verified against the official KRA CRSP source.',
      },
    },

    {
      name: 'sourceNote',
      type: 'text',
      admin: {
        position: 'sidebar',
        description:
          'Source/provenance note, including the KRA workbook and source sheet used for this record.',
      },
    },
  ],
}
