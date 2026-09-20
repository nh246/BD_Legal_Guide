import React, { useState } from 'react';
import useAdminStore, { PERMISSIONS } from '../../store/useAdminStore';
import { Shield, Plus, Edit2, Trash2, X, Check, MoreVertical } from 'lucide-react';
import Card, { CardContent } from '../../components/ui/Card';

export default function AdminModerators() {
  const { moderators, addModerator, updateModerator, deleteModerator } = useAdminStore();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMod, setEditingMod] = useState(null);
  const [modName, setModName] = useState('');
  const [modScopes, setModScopes] = useState([]);

  const openNewModal = () => {
    setEditingMod(null);
    setModName('');
    setModScopes([]);
    setIsModalOpen(true);
  };

  const openEditModal = (mod) => {
    setEditingMod(mod);
    setModName(mod.name);
    setModScopes(mod.scopes);
    setIsModalOpen(true);
  };

  const toggleScope = (scopeKey) => {
    setModScopes(prev => 
      prev.includes(scopeKey) ? prev.filter(s => s !== scopeKey) : [...prev, scopeKey]
    );
  };

  const handleSave = () => {
    if (!modName.trim()) return;
    
    if (editingMod) {
      updateModerator(editingMod.id, { name: modName, scopes: modScopes });
    } else {
      addModerator({ name: modName, scopes: modScopes, status: 'active' });
    }
    setIsModalOpen(false);
  };

  const toggleStatus = (mod) => {
    updateModerator(mod.id, { status: mod.status === 'active' ? 'suspended' : 'active' });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-50">Moderator Management</h1>
            <p className="text-sm text-zinc-400 mt-1">Assign roles and permission scopes to staff.</p>
          </div>
          <button 
            onClick={openNewModal}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Moderator
          </button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Scopes</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {moderators.map(mod => (
                  <tr key={mod.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                          <Shield className="h-4 w-4 text-blue-500" />
                        </div>
                        <span className="font-semibold text-zinc-50">{mod.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {mod.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                          Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {mod.scopes.length === 0 ? (
                          <span className="text-zinc-500 italic text-xs">No scopes assigned</span>
                        ) : (
                          mod.scopes.map(scope => (
                            <span key={scope} className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-zinc-800 text-zinc-300">
                              {scope}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => toggleStatus(mod)}
                        className="text-xs font-medium text-zinc-400 hover:text-zinc-50 px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                      >
                        {mod.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button 
                        onClick={() => openEditModal(mod)}
                        className="text-xs font-medium text-blue-400 hover:text-blue-300 px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => deleteModerator(mod.id)}
                        className="text-xs font-medium text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <h3 className="text-lg font-bold text-zinc-50">
                {editingMod ? 'Edit Moderator' : 'Add Moderator'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-50 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Moderator Name</label>
                <input 
                  type="text"
                  value={modName}
                  onChange={(e) => setModName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-50 focus:ring-2 focus:ring-blue-500/50 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">Permission Scopes</label>
                <div className="space-y-3">
                  {PERMISSIONS.map(perm => {
                    const isSelected = modScopes.includes(perm.key);
                    return (
                      <div 
                        key={perm.key}
                        onClick={() => toggleScope(perm.key)}
                        className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className={`mt-0.5 shrink-0 h-5 w-5 rounded flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-blue-600 border-blue-600' : 'border-zinc-700 bg-zinc-900'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <div>
                          <div className={`text-sm font-semibold mb-1 ${isSelected ? 'text-blue-400' : 'text-zinc-300'}`}>
                            {perm.label}
                          </div>
                          <div className="text-xs text-zinc-500 leading-relaxed">
                            {perm.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-950/50">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={!modName.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {editingMod ? 'Save Changes' : 'Create Moderator'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
