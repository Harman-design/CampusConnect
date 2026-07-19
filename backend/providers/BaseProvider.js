class BaseProvider {
  constructor(name, id) {
    this.name = name;
    this.id = id;
  }

  /**
   * Search academic resources for student queries
   * @param {Object} filters Query parameters like search, subject, category, semester, department
   * @param {Object} user User object of the student
   * @returns {Promise<Array>} Normalized array of resource objects
   */
  async search(filters, user) {
    throw new Error('search() must be implemented by subclass');
  }

  /**
   * Sync/Refresh cache metadata for this provider
   * @param {Object} user User object of the admin triggering the sync
   * @returns {Promise<Object>} Summary of the sync execution
   */
  async sync(user) {
    return { success: true, message: `Sync not required for ${this.name}` };
  }

  /**
   * Get sync status for this provider
   * @returns {Promise<Object>} Status details
   */
  async getSyncStatus() {
    return { status: 'Synced', lastSync: new Date() };
  }
}

module.exports = BaseProvider;
