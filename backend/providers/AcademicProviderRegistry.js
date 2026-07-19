const SystemSetting = require('../models/SystemSetting');
const CampusDatabaseProvider = require('./CampusDatabaseProvider');
const GoogleDriveProvider = require('./GoogleDriveProvider');
const HelperProvider = require('./HelperProvider');

const DEFAULT_CONFIG = [
  { id: 'campus_db', name: 'Campus Database', enabled: true, priority: 1 },
  { id: 'google_drive', name: 'Google Drive', enabled: true, priority: 2 },
  { id: 'helper', name: 'Helper', enabled: true, priority: 3 },
];

class AcademicProviderRegistry {
  constructor() {
    this.providers = {
      campus_db: new CampusDatabaseProvider(),
      google_drive: new GoogleDriveProvider(),
      helper: new HelperProvider(),
    };
  }

  /**
   * Helper to fetch settings from DB or seed defaults
   */
  async getConfig() {
    let setting = await SystemSetting.findOne({ key: 'academic_providers_config' });
    if (!setting) {
      setting = await SystemSetting.create({
        key: 'academic_providers_config',
        value: DEFAULT_CONFIG,
        description: 'Status enablement and search execution priority order for academic resource content providers.',
      });
    }
    return setting.value;
  }

  /**
   * Update settings in DB
   */
  async updateConfig(newConfig) {
    if (!Array.isArray(newConfig)) {
      throw new Error('Config must be an array');
    }
    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'academic_providers_config' },
      { value: newConfig },
      { new: true, upsert: true }
    );
    return setting.value;
  }

  /**
   * Search across all enabled providers, merge, deduplicate, and sort by relevance
   */
  async aggregateSearch(filters, user) {
    const configs = await this.getConfig();
    
    // Sort configs by priority (1 is highest priority, 2 is lower, etc.)
    const sortedConfigs = [...configs].sort((a, b) => a.priority - b.priority);

    const activeProviders = [];
    for (const conf of sortedConfigs) {
      if (conf.enabled && this.providers[conf.id]) {
        activeProviders.push({
          id: conf.id,
          priority: conf.priority,
          instance: this.providers[conf.id],
        });
      }
    }

    // If no active providers, return empty list
    if (activeProviders.length === 0) return [];

    // Query active providers in parallel
    const searchPromises = activeProviders.map(async (p) => {
      try {
        const results = await p.instance.search(filters, user);
        return { providerId: p.id, priority: p.priority, results };
      } catch (err) {
        console.error(`[Provider Search Failed] ${p.id}:`, err.message);
        // Do not crash if one provider fails (especially Helper)
        return { providerId: p.id, priority: p.priority, results: [] };
      }
    });

    const queryOutputs = await Promise.all(searchPromises);

    // Merge results in priority order and perform duplicate detection
    const mergedList = [];
    const seenFiles = new Set();
    const seenHashes = new Set();

    // Sort query outputs by provider priority to ensure higher priority duplicates shadow lower ones
    queryOutputs.sort((a, b) => a.priority - b.priority);

    for (const output of queryOutputs) {
      for (const item of output.results) {
        // Normalize title: remove spaces, punctuation, lowercase, remove file extension if any
        const cleanTitle = (item.title || '')
          .toLowerCase()
          .replace(/\.(pdf|ppt|pptx|docx|doc|zip|rar|png|jpg|jpeg)$/i, '')
          .replace(/[^a-z0-9]/g, '');

        const cleanSubject = (item.subject || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const duplicateKey = `${cleanSubject}_${cleanTitle}`;
        const hash = item.fileHash ? String(item.fileHash).trim() : '';

        let isDuplicate = false;

        if (hash) {
          if (seenHashes.has(hash)) {
            isDuplicate = true;
          }
        }
        
        if (!isDuplicate && seenFiles.has(duplicateKey)) {
          isDuplicate = true;
        }

        if (!isDuplicate) {
          if (hash) seenHashes.add(hash);
          seenFiles.add(duplicateKey);
          mergedList.push(item);
        }
      }
    }

    // Sort by relevance
    const searchVal = (filters.search || '').trim().toLowerCase();
    if (searchVal) {
      mergedList.forEach(item => {
        let score = 0;
        const titleLower = (item.title || '').toLowerCase();
        const subjectLower = (item.subject || '').toLowerCase();
        const descLower = (item.description || '').toLowerCase();

        if (titleLower === searchVal) {
          score += 100;
        } else if (titleLower.startsWith(searchVal)) {
          score += 50;
        } else if (titleLower.includes(searchVal)) {
          score += 25;
        }

        if (subjectLower.includes(searchVal)) {
          score += 15;
        }
        
        if (descLower.includes(searchVal)) {
          score += 5;
        }

        // Boost based on provider priority (higher priority gets subtle boost to break ties)
        // Since priority numbers are 1, 2, 3 (lower is higher priority), we subtract priority from a constant
        const priorityBoost = (10 - item.priority);
        score += priorityBoost;

        item.relevanceScore = score;
      });

      // Sort by relevanceScore descending, then downloads descending
      mergedList.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return (b.downloads || 0) - (a.downloads || 0);
      });
    } else {
      // Sort primarily by provider priority, then by creation date descending
      mergedList.sort((a, b) => {
        const priorityA = configs.find(c => c.id === (a.source === 'CampusConnect' ? 'campus_db' : a.source === 'Google Drive' ? 'google_drive' : 'helper'))?.priority || 99;
        const priorityB = configs.find(c => c.id === (b.source === 'CampusConnect' ? 'campus_db' : b.source === 'Google Drive' ? 'google_drive' : 'helper'))?.priority || 99;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      });
    }

    return mergedList;
  }

  /**
   * Retrieves provider status configuration along with live sync statuses
   */
  async getAdminStatus() {
    const configs = await this.getConfig();
    const statusResults = [];

    for (const conf of configs) {
      const provider = this.providers[conf.id];
      let syncMeta = { status: 'Synced', lastSync: new Date() };
      
      if (provider) {
        try {
          syncMeta = await provider.getSyncStatus();
        } catch (err) {
          console.error(`[Sync Status Fetch Failed] ${conf.id}:`, err.message);
          syncMeta = { status: 'Failed', lastSync: null, error: err.message };
        }
      }

      statusResults.push({
        ...conf,
        syncStatus: syncMeta.status,
        lastSync: syncMeta.lastSync,
        syncMeta,
      });
    }

    return statusResults;
  }

  /**
   * Triggers a sync/refresh on a specific provider
   */
  async syncProvider(providerId, user) {
    const provider = this.providers[providerId];
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }
    return await provider.sync(user);
  }
}

// Singleton pattern
module.exports = new AcademicProviderRegistry();
