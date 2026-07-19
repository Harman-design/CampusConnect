import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  HiOutlineFolderAdd, 
  HiOutlineRefresh, 
  HiOutlineTrash, 
  HiOutlinePencilAlt, 
  HiOutlineCheck, 
  HiOutlineEyeOff, 
  HiOutlineEye,
  HiOutlinePresentationChartLine,
  HiOutlineBookOpen,
  HiOutlineCollection,
  HiOutlineDownload,
  HiOutlineAdjustments,
  HiOutlineDatabase,
  HiOutlineCloudUpload
} from 'react-icons/hi';
import { 
  fetchAcademicResources, 
  importFolder, 
  syncFolder, 
  fetchAnalytics, 
  updateResource, 
  deleteResource,
  bulkAction,
  fetchDriveFolders,
  createDriveFolder,
  updateDriveFolder,
  deleteDriveFolder,
  syncSingleFolder,
  syncAllFolders,
  fetchProviders,
  updateProviders,
  refreshProvider
} from '../../services/academicService';
import { TextInput } from '../../components/FormField';
import Pagination from '../../components/Pagination';

const CATEGORIES = [
  'Notes',
  'Previous Year Questions',
  'Lab Manuals',
  'Lab Records',
  'Assignments',
  'Tutorial Sheets',
  'Formula Sheets',
  'Question Banks',
  'Reference Books',
  'Syllabus',
  'Lecture PPTs',
  'Cheat Sheets',
  'Important Questions'
];

export default function AcademicResources() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('mappings'); // 'mappings' or 'assets'
  
  // Mappings Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMapping, setEditingMapping] = useState(null);
  const [mappingForm, setMappingForm] = useState({
    department: 'CSE',
    semester: 4,
    subject: '',
    category: 'All',
    driveFolderUrl: '',
    faculty: 'SRM Faculty',
    credits: 4
  });

  // Assets filter/page states
  const [filters, setFilters] = useState({ search: '', category: '', page: 1, limit: 10 });
  const [editingAsset, setEditingAsset] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkVal, setBulkVal] = useState('');
  const [bulkActType, setBulkActType] = useState('change-semester');

  // Queries
  const { data: mappingsData, isLoading: isMappingsLoading } = useQuery({
    queryKey: ['admin-drive-mappings'],
    queryFn: fetchDriveFolders
  });

  const { data: resourcesData, isLoading: isResourcesLoading } = useQuery({
    queryKey: ['admin-resources-bulk', filters],
    queryFn: () => fetchAcademicResources(filters),
    keepPreviousData: true,
    enabled: activeTab === 'assets'
  });

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: fetchAnalytics,
  });

  const { data: providersData, isLoading: isProvidersLoading } = useQuery({
    queryKey: ['admin-providers'],
    queryFn: fetchProviders
  });

  // Providers Mutations
  const updateProvidersMutation = useMutation({
    mutationFn: updateProviders,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-providers']);
      toast.success(res.message || 'Provider configurations updated.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update provider settings.')
  });

  const refreshProviderMutation = useMutation({
    mutationFn: refreshProvider,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-providers']);
      queryClient.invalidateQueries(['admin-drive-mappings']);
      queryClient.invalidateQueries(['admin-resources-bulk']);
      queryClient.invalidateQueries(['admin-analytics']);
      toast.success(res.message || 'Provider cache refreshed successfully.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Provider refresh failed.')
  });

  // Mappings Mutations
  const createMappingMutation = useMutation({
    mutationFn: createDriveFolder,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-drive-mappings']);
      queryClient.invalidateQueries(['admin-analytics']);
      toast.success(res.message || 'Mapping registered.');
      setShowAddModal(false);
      resetMappingForm();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create mapping.')
  });

  const updateMappingMutation = useMutation({
    mutationFn: ({ id, payload }) => updateDriveFolder(id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-drive-mappings']);
      queryClient.invalidateQueries(['admin-analytics']);
      toast.success(res.message || 'Mapping updated.');
      setEditingMapping(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update mapping.')
  });

  const deleteMappingMutation = useMutation({
    mutationFn: deleteDriveFolder,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-drive-mappings']);
      queryClient.invalidateQueries(['admin-analytics']);
      toast.success(res.message || 'Mapping deleted.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete.')
  });

  const syncMappingMutation = useMutation({
    mutationFn: syncSingleFolder,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-drive-mappings']);
      queryClient.invalidateQueries(['admin-analytics']);
      toast.success(res.message || 'Folder synchronized successfully.');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Sync failed.')
  });

  const syncAllMutation = useMutation({
    mutationFn: syncAllFolders,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-drive-mappings']);
      queryClient.invalidateQueries(['admin-analytics']);
      toast.success(res.message || 'Bulk sync complete.');
    },
    onError: (err) => toast.error('Bulk sync failed.')
  });

  // Legacy mutations
  const updateAssetMutation = useMutation({
    mutationFn: ({ id, payload }) => updateResource(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-resources-bulk']);
      queryClient.invalidateQueries(['admin-analytics']);
      toast.success('Asset updated.');
      setEditingAsset(null);
    },
    onError: () => toast.error('Failed to update.'),
  });

  const deleteAssetMutation = useMutation({
    mutationFn: deleteResource,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-resources-bulk']);
      queryClient.invalidateQueries(['admin-analytics']);
      toast.success('Asset deleted.');
    },
  });

  const bulkMutation = useMutation({
    mutationFn: bulkAction,
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-resources-bulk']);
      queryClient.invalidateQueries(['admin-analytics']);
      setSelectedIds([]);
      setBulkVal('');
      toast.success(res.message);
    },
    onError: () => toast.error('Bulk operation failed.'),
  });

  const resetMappingForm = () => {
    setMappingForm({
      department: 'CSE',
      semester: 4,
      subject: '',
      category: 'All',
      driveFolderUrl: '',
      faculty: 'SRM Faculty',
      credits: 4
    });
  };

  const handleAddMapping = (e) => {
    e.preventDefault();
    if (!mappingForm.subject || !mappingForm.driveFolderUrl) {
      return toast.error('Please enter subject name and Drive URL.');
    }
    createMappingMutation.mutate(mappingForm);
  };

  const handleSaveMappingEdit = (e) => {
    e.preventDefault();
    updateMappingMutation.mutate({ id: editingMapping._id, payload: editingMapping });
  };

  const handleDeleteMapping = (id) => {
    if (window.confirm('Delete mapping? Doing so deletes all imported files from this Drive Folder.')) {
      deleteMappingMutation.mutate(id);
    }
  };

  const handleSyncMapping = (id) => {
    toast.promise(syncMappingMutation.mutateAsync(id), {
      loading: 'Crawling Google Drive...',
      success: 'Synchronized.',
      error: 'Sync failed.'
    });
  };

  const handleSyncAll = () => {
    toast.promise(syncAllMutation.mutateAsync(), {
      loading: 'Syncing all mapped subjects...',
      success: 'All subjects synchronized.',
      error: 'Bulk sync failed.'
    });
  };

  // Asset action triggers
  const toggleApproval = (item) => {
    updateAssetMutation.mutate({ id: item._id, payload: { isApproved: !item.isApproved } });
  };

  const toggleHidden = (item) => {
    updateAssetMutation.mutate({ 
      id: item._id, 
      payload: { 
        isHidden: !item.isHidden,
        visibility: !item.isHidden ? 'hidden' : 'visible'
      } 
    });
  };

  const handleDeleteAsset = (id) => {
    if (window.confirm('Delete asset permanently?')) {
      deleteAssetMutation.mutate(id);
    }
  };

  const triggerBulk = () => {
    if (selectedIds.length === 0) return toast.error('No items selected.');
    let payload = { ids: selectedIds, action: bulkActType, value: bulkVal };
    if (bulkActType === 'delete') {
      if (!window.confirm(`Delete ${selectedIds.length} resources permanently?`)) return;
    }
    bulkMutation.mutate(payload);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mx-auto max-w-6xl space-y-6">
        
        {/* Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Academic Resource Manager</h1>
            <p className="text-sm text-slate-500 font-medium">Link Google Drive folders by Subject, map metadata, and sync university syllabus content.</p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 transition"
            >
              <HiOutlineFolderAdd className="h-4 w-4" />
              Add Subject Mapping
            </button>
            <button
              onClick={handleSyncAll}
              disabled={syncAllMutation.isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              <HiOutlineRefresh className={`h-4 w-4 ${syncAllMutation.isLoading ? 'animate-spin' : ''}`} />
              Sync All Mappings
            </button>
          </div>
        </div>

        {/* Analytics stats */}
        {!isAnalyticsLoading && analytics && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4 animate-fade-in">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600 shrink-0">
                <HiOutlineBookOpen className="h-6 w-6" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Notes</p>
                <h4 className="text-xl font-bold text-slate-800">{analytics.totalNotes}</h4>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4 animate-fade-in">
              <div className="rounded-lg bg-red-50 p-3 text-red-600 shrink-0">
                <HiOutlineCollection className="h-6 w-6" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total PYQs</p>
                <h4 className="text-xl font-bold text-slate-800">{analytics.totalPyqs}</h4>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4 animate-fade-in">
              <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600 shrink-0">
                <HiOutlineDownload className="h-6 w-6" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Top Subject</p>
                <h4 className="text-sm font-bold text-slate-800 truncate">{analytics.mostDownloadedSubject}</h4>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm flex items-center gap-4 animate-fade-in">
              <div className="rounded-lg bg-purple-50 p-3 text-purple-600 shrink-0">
                <HiOutlineDatabase className="h-6 w-6" />
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subject Mappings</p>
                <h4 className="text-xl font-bold text-slate-800">{mappingsData?.data?.length || 0}</h4>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 flex gap-6">
          <button
            onClick={() => setActiveTab('mappings')}
            className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === 'mappings' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Subject Mappings ({mappingsData?.data?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === 'assets' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Legacy Asset Auditor
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`pb-3 text-sm font-bold border-b-2 transition ${activeTab === 'providers' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Content Providers
          </button>
        </div>

        {/* DRIVE MAPPINGS TAB */}
        {activeTab === 'mappings' && (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              {isMappingsLoading ? (
                <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading drive mapping data...</div>
              ) : !mappingsData?.data || mappingsData.data.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-sm">No Google Drive subjects mapped. Click "Add Subject Mapping" to begin.</div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Subject</th>
                      <th className="px-5 py-3">Dept & Sem</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Credits & Faculty</th>
                      <th className="px-5 py-3">Folder ID</th>
                      <th className="px-5 py-3">Sync Status</th>
                      <th className="px-5 py-3">Files</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {mappingsData.data.map((map) => (
                      <tr key={map._id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3 font-semibold text-slate-800">{map.subject}</td>
                        <td className="px-5 py-3">{map.department} · Semester {map.semester}</td>
                        <td className="px-5 py-3">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600 uppercase text-[9px]">
                            {map.category}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {map.credits} Credits · {map.faculty}
                        </td>
                        <td className="px-5 py-3 font-mono text-[10px] text-slate-400 max-w-[120px] truncate" title={map.driveFolderId}>
                          {map.driveFolderId}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded px-1.5 py-0.5 font-bold uppercase text-[9px] ${
                            map.status === 'Synced' ? 'bg-green-50 text-green-700' :
                            map.status === 'Failed' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700 animate-pulse'
                          }`}>
                            {map.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-bold text-slate-700">{map.importedFiles}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSyncMapping(map._id)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600 transition"
                              title="Rescan & Sync"
                            >
                              <HiOutlineRefresh className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingMapping(map)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition"
                              title="Edit Mapping"
                            >
                              <HiOutlinePencilAlt className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMapping(map._id)}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition"
                              title="Delete Mapping"
                            >
                              <HiOutlineTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* LEGACY ASSETS AUDIT TAB */}
        {activeTab === 'assets' && (
          <>
            {/* Bulk Action Panel */}
            {selectedIds.length > 0 && (
              <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="bg-brand-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold shrink-0">
                    {selectedIds.length}
                  </span>
                  <p className="text-xs font-bold text-brand-800">Items selected. Configure bulk action:</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={bulkActType}
                    onChange={(e) => { setBulkActType(e.target.value); setBulkVal(''); }}
                    className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-700 focus:border-brand-500"
                  >
                    <option value="change-semester">Change Semester</option>
                    <option value="change-department">Change Department</option>
                    <option value="change-subject">Change Subject</option>
                    <option value="change-visibility">Change Visibility</option>
                    <option value="delete">Delete Selected</option>
                  </select>

                  {bulkActType !== 'delete' && (
                    <>
                      {bulkActType === 'change-semester' ? (
                        <select
                          value={bulkVal}
                          onChange={(e) => setBulkVal(e.target.value)}
                          className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-700 focus:border-brand-500"
                        >
                          <option value="">Select Sem</option>
                          {Array.from({ length: 10 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                          ))}
                        </select>
                      ) : bulkActType === 'change-visibility' ? (
                        <select
                          value={bulkVal}
                          onChange={(e) => setBulkVal(e.target.value)}
                          className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-700 focus:border-brand-500"
                        >
                          <option value="">Select Option</option>
                          <option value="visible">Visible</option>
                          <option value="hidden">Hidden</option>
                        </select>
                      ) : (
                        <TextInput
                          placeholder={bulkActType === 'change-department' ? 'e.g. CSE' : 'e.g. Operating Systems'}
                          value={bulkVal}
                          onChange={(e) => setBulkVal(e.target.value)}
                          className="w-48 py-1 px-3 text-xs"
                        />
                      )}
                    </>
                  )}
                  <button
                    onClick={triggerBulk}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-750 px-4 py-2 text-xs font-bold text-white hover:bg-brand-800 transition"
                  >
                    <HiOutlineAdjustments className="h-4 w-4" />
                    Apply Bulk Change
                  </button>
                </div>
              </div>
            )}

            {/* Resources Audit Table */}
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Audit Individual Assets</h3>
                  <p className="text-xs text-slate-400">Review all files synced inside subjects and modify metadata overrides.</p>
                </div>

                <div className="flex items-center gap-2">
                  <TextInput
                    placeholder="Search by keywords..."
                    value={filters.search}
                    onChange={(e) => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
                    className="w-48 py-1 px-2.5 text-xs"
                  />
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(f => ({ ...f, category: e.target.value, page: 1 }))}
                    className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-600 focus:border-brand-500"
                  >
                    <option value="">All Categories</option>
                    {CATEGORIES.concat(['Previous Year Questions']).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                {isResourcesLoading ? (
                  <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading resources...</div>
                ) : !resourcesData?.data || resourcesData.data.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-sm">No assets indexed. Configure a mapping first.</div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3 w-10 text-center">
                          <input 
                            type="checkbox" 
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(resourcesData.data.map(i => i._id));
                              else setSelectedIds([]);
                            }}
                            checked={selectedIds.length === resourcesData.data.length && selectedIds.length > 0}
                            className="rounded text-brand-600 focus:ring-brand-500"
                          />
                        </th>
                        <th className="px-5 py-3">Resource Title</th>
                        <th className="px-5 py-3">Subject</th>
                        <th className="px-5 py-3">Sem & Dept</th>
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3 text-center">Approval & Visibility</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      {resourcesData.data.map((item) => (
                        <tr key={item._id} className={`hover:bg-slate-50/50 ${selectedIds.includes(item._id) ? 'bg-brand-50/20' : ''}`}>
                          <td className="px-5 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item._id)}
                              onChange={() => setSelectedIds(prev => prev.includes(item._id) ? prev.filter(id => id !== item._id) : [...prev, item._id])}
                              className="rounded text-brand-600 focus:ring-brand-500"
                            />
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-800 max-w-[200px] truncate">{item.title}</td>
                          <td className="px-5 py-3">{item.subject} {item.unit ? `· Unit ${item.unit}` : ''}</td>
                          <td className="px-5 py-3">Sem {item.semester} · {item.department}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex rounded px-1.5 py-0.5 font-bold uppercase text-[9px] ${item.category === 'Previous Year Questions' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                              {item.category}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => toggleApproval(item)}
                                className={`rounded-full p-1 border transition ${item.isApproved ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                              >
                                <HiOutlineCheck className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => toggleHidden(item)}
                                className={`rounded-full p-1 border transition ${item.isHidden ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                              >
                                {item.isHidden ? <HiOutlineEyeOff className="h-3.5 w-3.5" /> : <HiOutlineEye className="h-3.5 w-3.5" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingAsset(item)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600 transition"
                              >
                                <HiOutlinePencilAlt className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAsset(item._id)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600 transition"
                              >
                                <HiOutlineTrash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="border-t border-slate-100 px-6 py-3">
                <Pagination pagination={resourcesData?.pagination} onPageChange={(page) => setFilters(f => ({ ...f, page }))} />
              </div>
            </div>
          </>
        )}

        {/* PROVIDERS CONFIG TAB */}
        {activeTab === 'providers' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 text-left animate-fade-in">
            <div>
              <h3 className="text-base font-bold text-slate-800">Content Resource Providers</h3>
              <p className="text-xs text-slate-500 mt-1">Configure search priority, enable/disable aggregating sources, and refresh their metadata caches.</p>
            </div>

            {isProvidersLoading ? (
              <div className="p-10 text-center text-slate-400 text-sm animate-pulse">Loading provider integrations...</div>
            ) : !providersData?.data ? (
              <div className="p-10 text-center text-slate-400 text-sm">Failed to retrieve provider details. Check backend configs.</div>
            ) : (
              <div className="space-y-4">
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                  {providersData.data.map((prov) => {
                    const handleToggleEnable = () => {
                      const updated = providersData.data.map(p => p.id === prov.id ? { ...p, enabled: !p.enabled } : p);
                      updateProvidersMutation.mutate(updated);
                    };

                    const handlePriorityChange = (e) => {
                      const newPriority = Number(e.target.value);
                      const updated = providersData.data.map(p => p.id === prov.id ? { ...p, priority: newPriority } : p);
                      updateProvidersMutation.mutate(updated);
                    };

                    const handleRefresh = () => {
                      toast.promise(refreshProviderMutation.mutateAsync(prov.id), {
                        loading: `Re-indexing ${prov.name}...`,
                        success: `${prov.name} synchronized successfully.`,
                        error: 'Sync execution encountered an error.'
                      });
                    };

                    return (
                      <div key={prov.id} className="p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/40 transition duration-150">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-800 text-sm">{prov.name}</h4>
                            <span className={`inline-flex rounded px-1.5 py-0.5 font-bold uppercase text-[9px] ${prov.enabled ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                              {prov.enabled ? 'Active' : 'Disabled'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-normal max-w-xl">
                            {prov.id === 'campus_db' ? 'Campus Database stores notes, assignments, standard textbooks and previous year question sheets uploaded locally via administrators and faculty members.' :
                             prov.id === 'google_drive' ? 'Google Drive fetches resources linked directly to mapped subject folders dynamically synced to SRM campus archives.' :
                             'Helper integration crawls, indexes, and caches metadata for legally permitted, public domain academic resource assets.'}
                          </p>
                          <div className="flex flex-wrap gap-x-4 pt-1.5 text-[10px] text-slate-400 font-medium">
                            <span>Sync Status: <strong className={prov.syncStatus === 'Synced' ? 'text-green-600' : 'text-amber-500 animate-pulse'}>{prov.syncStatus || 'Pending'}</strong></span>
                            {prov.lastSync && (
                              <span>Last Sync: <strong>{new Date(prov.lastSync).toLocaleString()}</strong></span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Priority:</span>
                            <select
                              value={prov.priority}
                              onChange={handlePriorityChange}
                              className="rounded-lg border border-slate-300 bg-white py-1 px-2.5 text-xs font-semibold text-slate-700 focus:border-brand-500"
                            >
                              {[1, 2, 3].map(num => (
                                <option key={num} value={num}>{num} {num === 1 ? '(Highest)' : num === 3 ? '(Lowest)' : ''}</option>
                              ))}
                            </select>
                          </div>

                          <button
                            onClick={handleToggleEnable}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition duration-150 ${
                              prov.enabled 
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' 
                                : 'bg-brand-600 text-white hover:bg-brand-700'
                            }`}
                          >
                            {prov.enabled ? 'Disable' : 'Enable'}
                          </button>

                          <button
                            onClick={handleRefresh}
                            disabled={refreshProviderMutation.isLoading}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition duration-150"
                            title="Trigger sync/refresh cache"
                          >
                            <HiOutlineRefresh className={`h-3.5 w-3.5 ${refreshProviderMutation.isLoading ? 'animate-spin' : ''}`} />
                            Sync
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD DRIVE MAPPING MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-slate-800 text-base mb-4">Add Google Drive Subject Mapping</h3>
            <form onSubmit={handleAddMapping} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Name</label>
                <TextInput
                  placeholder="e.g. Operating Systems"
                  value={mappingForm.subject}
                  onChange={(e) => setMappingForm({ ...mappingForm, subject: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
                  <select
                    value={mappingForm.department}
                    onChange={(e) => setMappingForm({ ...mappingForm, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-750 focus:border-brand-500"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CHEM">CHEM</option>
                    <option value="MATH">MATH</option>
                    <option value="BIOTECH">BIOTECH</option>
                    <option value="HUM">HUM/Languages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Semester</label>
                  <select
                    value={mappingForm.semester}
                    onChange={(e) => setMappingForm({ ...mappingForm, semester: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-750 focus:border-brand-500"
                  >
                    {Array.from({ length: 8 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Faculty</label>
                  <TextInput
                    placeholder="e.g. Dr. Rajesh Kumar"
                    value={mappingForm.faculty}
                    onChange={(e) => setMappingForm({ ...mappingForm, faculty: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Credits</label>
                  <TextInput
                    type="number"
                    value={mappingForm.credits}
                    onChange={(e) => setMappingForm({ ...mappingForm, credits: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Category Level (Optional)</label>
                <select
                  value={mappingForm.category}
                  onChange={(e) => setMappingForm({ ...mappingForm, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-750 focus:border-brand-500"
                >
                  <option value="All">All Categories (Auto-Categorize)</option>
                  <option value="Notes">Notes Only</option>
                  <option value="Previous Year Questions">PYQs Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Google Drive Folder URL</label>
                <TextInput
                  placeholder="https://drive.google.com/drive/folders/..."
                  value={mappingForm.driveFolderUrl}
                  onChange={(e) => setMappingForm({ ...mappingForm, driveFolderUrl: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMappingMutation.isLoading}
                  className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
                >
                  {createMappingMutation.isLoading ? 'Registering...' : 'Register Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DRIVE MAPPING MODAL */}
      {editingMapping && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingMapping(null)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-slate-800 text-base mb-4">Edit Google Drive Subject Mapping</h3>
            <form onSubmit={handleSaveMappingEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Name</label>
                <TextInput
                  value={editingMapping.subject}
                  onChange={(e) => setEditingMapping({ ...editingMapping, subject: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
                  <select
                    value={editingMapping.department}
                    onChange={(e) => setEditingMapping({ ...editingMapping, department: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-750 focus:border-brand-500"
                  >
                    <option value="CSE">CSE</option>
                    <option value="ECE">ECE</option>
                    <option value="EEE">EEE</option>
                    <option value="MECH">MECH</option>
                    <option value="CHEM">CHEM</option>
                    <option value="MATH">MATH</option>
                    <option value="BIOTECH">BIOTECH</option>
                    <option value="HUM">HUM/Languages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Semester</label>
                  <select
                    value={editingMapping.semester}
                    onChange={(e) => setEditingMapping({ ...editingMapping, semester: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-750 focus:border-brand-500"
                  >
                    {Array.from({ length: 8 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>Semester {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Faculty</label>
                  <TextInput
                    value={editingMapping.faculty || ''}
                    onChange={(e) => setEditingMapping({ ...editingMapping, faculty: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Credits</label>
                  <TextInput
                    type="number"
                    value={editingMapping.credits || ''}
                    onChange={(e) => setEditingMapping({ ...editingMapping, credits: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Category Level (Optional)</label>
                <select
                  value={editingMapping.category}
                  onChange={(e) => setEditingMapping({ ...editingMapping, category: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-750 focus:border-brand-500"
                >
                  <option value="All">All Categories</option>
                  <option value="Notes">Notes Only</option>
                  <option value="Previous Year Questions">Previous Year Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Google Drive Folder URL</label>
                <TextInput
                  value={editingMapping.driveFolderUrl}
                  onChange={(e) => setEditingMapping({ ...editingMapping, driveFolderUrl: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMapping(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMappingMutation.isLoading}
                  className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
                >
                  {updateMappingMutation.isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ASSET METADATA MODAL */}
      {editingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingAsset(null)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-fade-in">
            <h3 className="font-bold text-slate-800 text-base mb-4">Edit Asset Metadata</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateAssetMutation.mutate({ id: editingAsset._id, payload: editingAsset });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Title</label>
                <TextInput
                  value={editingAsset.title}
                  onChange={(e) => setEditingAsset({ ...editingAsset, title: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                <TextInput
                  value={editingAsset.subject}
                  onChange={(e) => setEditingAsset({ ...editingAsset, subject: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Semester</label>
                  <TextInput
                    type="number"
                    value={editingAsset.semester}
                    onChange={(e) => setEditingAsset({ ...editingAsset, semester: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                  <select
                    value={editingAsset.category}
                    onChange={(e) => setEditingAsset({ ...editingAsset, category: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 py-1.5 px-3 text-xs text-slate-700 focus:border-brand-500"
                  >
                    {CATEGORIES.concat(['Previous Year Questions']).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
