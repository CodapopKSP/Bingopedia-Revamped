export type CuratedArticle = string | { title: string; url?: string }

export interface CuratedCategory {
  name: string
  articleCount: number
  group?: string
  articles: CuratedArticle[]
}

/**
 * Extracts the title from a CuratedArticle, handling both string and object formats.
 * 
 * CuratedArticle can be either:
 * - A string (the article title)
 * - An object with a `title` property
 * 
 * @param article - The curated article (string or object)
 * @returns The article title as a string
 */
export function getCuratedArticleTitle(article: CuratedArticle): string {
  return typeof article === 'string' ? article : article.title
}

export interface CuratedGroup {
  name: string
  maxPerGame: number
}

/**
 * Groups configuration as stored in JSON (object format).
 * Key is group name, value contains maxPerGame and categories.
 */
export interface CuratedGroupsConfig {
  [groupName: string]: {
    maxPerGame: number
    categories: string[]
  }
}

export interface CuratedArticlesPayload {
  generatedAt: string
  totalCategories: number
  totalArticles: number
  groups: CuratedGroupsConfig // Object format, not array
  categories: CuratedCategory[]
}


