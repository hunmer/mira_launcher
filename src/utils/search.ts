// 搜索算法工具函数
// 包含关键词搜索、拼音搜索、模糊匹配等功能

export interface SearchableItem {
    id: string
    name: string
    description?: string
    category?: string
    tags?: string[]
    path?: string
    icon?: string
    type?: string
    [key: string]: any
}

export interface SearchOptions {
    fuzzyMatch?: boolean
    pinyinSearch?: boolean
    caseSensitive?: boolean
    maxResults?: number
    searchFields?: string[]
    boost?: {
        name?: number
        description?: number
        tags?: number
    }
}

export interface SearchResult extends SearchableItem {
    score: number
    matchedFields: string[]
    highlightRanges: { field: string; start: number; end: number }[]
}

// 简单的拼音映射表（用于基础拼音搜索）
const pinyinMap: Record<string, string> = {
  '应': 'ying',
  '用': 'yong',
  '程': 'cheng',
  '序': 'xu',
  '设': 'she',
  '置': 'zhi',
  '文': 'wen',
  '件': 'jian',
  '图': 'tu',
  '片': 'pian',
  '音': 'yin',
  '乐': 'le',
  '视': 'shi',
  '频': 'pin',
  '浏': 'liu',
  '览': 'lan',
  '器': 'qi',
  '编': 'bian',
  '辑': 'ji',
  '游': 'you',
  '戏': 'xi',
  '工': 'gong',
  '具': 'ju',
  '系': 'xi',
  '统': 'tong',
  '网': 'wang',
  '络': 'luo',
  '通': 'tong',
  '信': 'xin',
  '办': 'ban',
  '公': 'gong',
  '学': 'xue',
  '习': 'xi',
  '开': 'kai',
  '发': 'fa',
  '安': 'an',
  '全': 'quan',
  '娱': 'yu',
  '社': 'she',
  '交': 'jiao',
}

/**
 * 简单拼音转换
 */
export const getPinyin = (text: string): string => {
  return text.split('').map(char => pinyinMap[char] || char).join('')
}

/**
 * 拼音搜索匹配
 */
export const pinyinSearch = (text: string, query: string): boolean => {
  const pinyin = getPinyin(text).toLowerCase()
  const queryLower = query.toLowerCase()

  // 完整拼音匹配
  if (pinyin.includes(queryLower)) return true

  // 拼音首字母匹配
  const pinyinInitials = text.split('').map(char => {
    const py = pinyinMap[char]
    return py ? py[0] : char
  }).join('').toLowerCase()

  return pinyinInitials.includes(queryLower)
}

/**
 * 模糊匹配算法
 */
export const fuzzyMatch = (text: string, query: string): boolean => {
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()
  let textIndex = 0

  for (const char of queryLower) {
    textIndex = textLower.indexOf(char, textIndex)
    if (textIndex === -1) return false
    textIndex++
  }
  return true
}

/**
 * 计算匹配得分
 */
export const calculateScore = (
  item: SearchableItem,
  query: string,
  options: SearchOptions = {},
): number => {
  const queryLower = query.toLowerCase()
  let score = 0
  const boost = options.boost || { name: 10, description: 5, tags: 3 }

  // 名称匹配
  if (item.name) {
    const nameLower = item.name.toLowerCase()
    if (nameLower === queryLower) {
      score += 100 * (boost.name || 10)
    } else if (nameLower.startsWith(queryLower)) {
      score += 50 * (boost.name || 10)
    } else if (nameLower.includes(queryLower)) {
      score += 20 * (boost.name || 10)
    } else if (pinyinSearch(item.name, query)) {
      score += 15 * (boost.name || 10)
    } else if (fuzzyMatch(item.name, query)) {
      score += 10 * (boost.name || 10)
    }
  }

  // 描述匹配
  if (item.description) {
    const descLower = item.description.toLowerCase()
    if (descLower.includes(queryLower)) {
      score += 10 * (boost.description || 5)
    } else if (pinyinSearch(item.description, query)) {
      score += 8 * (boost.description || 5)
    } else if (fuzzyMatch(item.description, query)) {
      score += 5 * (boost.description || 5)
    }
  }

  // 标签匹配
  if (item.tags && Array.isArray(item.tags)) {
    for (const tag of item.tags) {
      const tagLower = tag.toLowerCase()
      if (tagLower === queryLower) {
        score += 30 * (boost.tags || 3)
      } else if (tagLower.includes(queryLower)) {
        score += 15 * (boost.tags || 3)
      } else if (pinyinSearch(tag, query)) {
        score += 10 * (boost.tags || 3)
      } else if (fuzzyMatch(tag, query)) {
        score += 5 * (boost.tags || 3)
      }
    }
  }

  // 类别匹配
  if (item.category) {
    const categoryLower = item.category.toLowerCase()
    if (categoryLower.includes(queryLower)) {
      score += 8
    } else if (pinyinSearch(item.category, query)) {
      score += 5
    }
  }

  return score
}

/**
 * 查找匹配的文本范围（用于高亮显示）
 */
export const findMatchRanges = (
  text: string,
  query: string,
): { start: number; end: number }[] => {
  if (!text || !query) return []

  const ranges: { start: number; end: number }[] = []
  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  let index = 0
  while (index < textLower.length) {
    const found = textLower.indexOf(queryLower, index)
    if (found === -1) break

    ranges.push({
      start: found,
      end: found + queryLower.length,
    })

    index = found + 1
  }

  return ranges
}

/**
 * 高亮文本
 */
export const highlightText = (
  text: string,
  query: string,
  className = 'search-highlight',
): string => {
  if (!text || !query) return text

  const ranges = findMatchRanges(text, query)
  if (ranges.length === 0) return text

  // 从后往前替换，避免索引偏移
  let result = text
  for (let i = ranges.length - 1; i >= 0; i--) {
    const range = ranges[i]
    if (range) {
      result = `${result.slice(0, range.start) 
      }<span class="${className}">${ 
        result.slice(range.start, range.end) 
      }</span>${ 
        result.slice(range.end)}`
    }
  }

  return result
}

/**
 * 防抖函数
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void => {
  let timeout: number | null = null

  return (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout)
    }

    timeout = window.setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * 主搜索函数
 */
export const performSearch = (
  items: SearchableItem[],
  query: string,
  options: SearchOptions = {},
): SearchResult[] => {
  if (!query.trim()) return []

  const {
    maxResults = 50,
    searchFields = ['name', 'description', 'tags', 'category'],
  } = options

  const results: SearchResult[] = []

  for (const item of items) {
    const score = calculateScore(item, query, options)

    if (score > 0) {
      const matchedFields: string[] = []
      const highlightRanges: { field: string; start: number; end: number }[] = []

      // 检查匹配的字段
      for (const field of searchFields) {
        const fieldValue = item[field]
        if (typeof fieldValue === 'string' && fieldValue) {
          const ranges = findMatchRanges(fieldValue, query)
          if (ranges.length > 0) {
            matchedFields.push(field)
            ranges.forEach(range => {
              highlightRanges.push({ field, ...range })
            })
          }
        } else if (field === 'tags' && Array.isArray(fieldValue)) {
          for (const tag of fieldValue) {
            const ranges = findMatchRanges(tag, query)
            if (ranges.length > 0) {
              matchedFields.push(field)
              ranges.forEach(range => {
                highlightRanges.push({ field, ...range })
              })
            }
          }
        }
      }

      results.push({
        ...item,
        score,
        matchedFields,
        highlightRanges,
      })
    }
  }

  // 按得分排序并限制结果数量
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
}

/**
 * 搜索历史管理
 */
export class SearchHistory {
  private key: string
  private maxSize: number

  constructor(key = 'search-history', maxSize = 10) {
    this.key = key
    this.maxSize = maxSize
  }

  get(): string[] {
    try {
      const stored = localStorage.getItem(this.key)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  add(query: string): void {
    if (!query.trim()) return

    const history = this.get()
    const index = history.indexOf(query)

    if (index > -1) {
      history.splice(index, 1)
    }

    history.unshift(query)

    if (history.length > this.maxSize) {
      history.splice(this.maxSize)
    }

    try {
      localStorage.setItem(this.key, JSON.stringify(history))
    } catch {
      // 忽略存储错误
    }
  }

  remove(query: string): void {
    const history = this.get()
    const index = history.indexOf(query)

    if (index > -1) {
      history.splice(index, 1)
      try {
        localStorage.setItem(this.key, JSON.stringify(history))
      } catch {
        // 忽略存储错误
      }
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(this.key)
    } catch {
      // 忽略存储错误
    }
  }
}
