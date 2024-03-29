import { defineConfig, isDev } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from '@schemas/_index'
import { sanityTheme } from 'sanity.theme'

export default defineConfig({
  name: 'default',
  title: 'Sanity Content Studio',
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: 'production',
  plugins: [deskTool(), ...(isDev ? [visionTool()] : [])],
  schema: {
    types: schemaTypes
  },
  theme: sanityTheme
})
