/**
 * 搜索服务
 * 处理搜索逻辑和数据管理
 */
class SearchService {
    constructor() {
        this.searchData = [];
        this.searchHistory = [];
        this.maxHistoryItems = 10;
    }

    /**
     * 设置搜索数据
     */
    setSearchData(data) {
        this.searchData = Array.isArray(data) ? data : [];
    }

    /**
     * 获取搜索数据
     */
    getSearchData() {
        return this.searchData;
    }

    /**
     * 执行搜索
     */
    search(query, options = {}) {
        const {
            maxResults = 10,
            includeScore = false,
            minScore = 0,
            sortBy = 'score'
        } = options;

        if (!query || !query.trim()) {
            return [];
        }

        const queryLower = query.trim().toLowerCase();
        const results = [];

        // 遍历所有搜索数据
        for (const item of this.searchData) {
            const matchResult = this.matchItem(item, queryLower);

            if (matchResult.matched && matchResult.score >= minScore) {
                const result = { ...item, score: matchResult.score };
                if (!includeScore) {
                    delete result.score;
                }
                results.push(result);
            }
        }

        // 排序结果
        this.sortResults(results, sortBy);

        // 限制结果数量
        const limitedResults = results.slice(0, maxResults);

        // 添加到搜索历史
        this.addToHistory(query);

        return limitedResults;
    }

    /**
     * 匹配单个项目
     */
    matchItem(item, queryLower) {
        let score = 0;
        let matched = false;

        // 标题匹配
        if (item.title && item.title.toLowerCase().includes(queryLower)) {
            const exactMatch = item.title.toLowerCase() === queryLower;
            const startsWith = item.title.toLowerCase().startsWith(queryLower);

            if (exactMatch) {
                score += 100;
            } else if (startsWith) {
                score += 80;
            } else {
                score += 50;
            }
            matched = true;
        }

        // 名称匹配
        if (item.name && item.name.toLowerCase().includes(queryLower)) {
            const exactMatch = item.name.toLowerCase() === queryLower;
            const startsWith = item.name.toLowerCase().startsWith(queryLower);

            if (exactMatch) {
                score += 90;
            } else if (startsWith) {
                score += 70;
            } else {
                score += 40;
            }
            matched = true;
        }

        // 描述匹配
        if (item.description && item.description.toLowerCase().includes(queryLower)) {
            score += 20;
            matched = true;
        }

        // 正则表达式匹配
        if (item.regexps && Array.isArray(item.regexps)) {
            for (const pattern of item.regexps) {
                try {
                    const regex = new RegExp(pattern, 'i');
                    if (regex.test(queryLower)) {
                        score += 60;
                        matched = true;
                        break; // 只要有一个正则匹配就足够了
                    }
                } catch (error) {
                    console.warn('无效的正则表达式:', pattern, error);
                }
            }
        }

        // 标签匹配
        if (item.tags && Array.isArray(item.tags)) {
            for (const tag of item.tags) {
                if (tag.toLowerCase().includes(queryLower)) {
                    const exactMatch = tag.toLowerCase() === queryLower;
                    score += exactMatch ? 30 : 15;
                    matched = true;
                }
            }
        }

        // 路径匹配
        if (item.path && item.path.toLowerCase().includes(queryLower)) {
            score += 10;
            matched = true;
        }

        // 类别匹配
        if (item.category && item.category.toLowerCase().includes(queryLower)) {
            score += 10;
            matched = true;
        }

        // 类型匹配
        if (item.type && item.type.toLowerCase().includes(queryLower)) {
            score += 10;
            matched = true;
        }

        return { matched, score };
    }

    /**
     * 排序结果
     */
    sortResults(results, sortBy) {
        switch (sortBy) {
            case 'score':
                results.sort((a, b) => (b.score || 0) - (a.score || 0));
                break;
            case 'name':
                results.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
                break;
            case 'type':
                results.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
                break;
            case 'recent':
                // 可以根据最近使用时间排序，这里暂时按分数排序
                results.sort((a, b) => (b.score || 0) - (a.score || 0));
                break;
            default:
                results.sort((a, b) => (b.score || 0) - (a.score || 0));
        }
    }

    /**
     * 获取搜索建议
     */
    getSuggestions(query, maxSuggestions = 5) {
        if (!query || query.length < 2) {
            return this.getPopularSearches();
        }

        const queryLower = query.toLowerCase();
        const suggestions = new Set();

        // 从搜索数据中提取建议
        for (const item of this.searchData) {
            // 标题建议
            if (item.title && item.title.toLowerCase().startsWith(queryLower)) {
                suggestions.add(item.title);
            }

            // 标签建议
            if (item.tags) {
                for (const tag of item.tags) {
                    if (tag.toLowerCase().startsWith(queryLower)) {
                        suggestions.add(tag);
                    }
                }
            }

            if (suggestions.size >= maxSuggestions) break;
        }

        return Array.from(suggestions).slice(0, maxSuggestions);
    }

    /**
     * 获取热门搜索
     */
    getPopularSearches() {
        // 可以基于搜索历史或预定义的热门搜索
        return ['设置', 'vscode', '插件', '应用'];
    }

    /**
     * 添加到搜索历史
     */
    addToHistory(query) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) return;

        // 移除重复项
        this.searchHistory = this.searchHistory.filter(item => item !== trimmedQuery);

        // 添加到开头
        this.searchHistory.unshift(trimmedQuery);

        // 限制历史记录数量
        if (this.searchHistory.length > this.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
        }
    }

    /**
     * 获取搜索历史
     */
    getSearchHistory() {
        return this.searchHistory;
    }

    /**
     * 清除搜索历史
     */
    clearHistory() {
        this.searchHistory = [];
    }

    /**
     * 按类别分组结果
     */
    groupByCategory(results) {
        const groups = {};

        for (const result of results) {
            const category = result.category || this.getCategoryByType(result.type) || '其他';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(result);
        }

        return groups;
    }

    /**
     * 根据类型获取类别
     */
    getCategoryByType(type) {
        const categoryMap = {
            'system': '系统功能',
            'application': '应用程序',
            'plugin': '插件',
            'plugin_entry': '插件入口',
            'file': '文件',
            'page': '页面',
            'function': '功能'
        };
        return categoryMap[type];
    }

    /**
     * 获取统计信息
     */
    getStats() {
        const typeStats = {};
        const categoryStats = {};

        for (const item of this.searchData) {
            // 类型统计
            const type = item.type || 'unknown';
            typeStats[type] = (typeStats[type] || 0) + 1;

            // 类别统计
            const category = item.category || this.getCategoryByType(item.type) || '其他';
            categoryStats[category] = (categoryStats[category] || 0) + 1;
        }

        return {
            total: this.searchData.length,
            types: typeStats,
            categories: categoryStats,
            historyCount: this.searchHistory.length
        };
    }
}

// 导出服务
if (typeof window !== 'undefined') {
    window.SearchService = SearchService;
}
