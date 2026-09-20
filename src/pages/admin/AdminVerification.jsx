import React, { useState } from 'react';
import { ShieldAlert, Check, X, Eye } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';

export default function AdminVerification() {
  const [selectedLawyer, setSelectedLawyer] = useState(null);

  const pendingLawyers = [
    { 
      id: 'l10', 
      name: 'Rahim Ullah', 
      email: 'rahim@example.com', 
      barId: 'BD-2022-104', 
      specialties: ['Criminal', 'Family'], 
      submittedAt: '2 hours ago',
      idImage: 'https://images.unsplash.com/photo-1633424108868-b778747441dc?w=800&q=80' // Dummy ID card placeholder
    },
    { 
      id: 'l11', 
      name: 'Tania Ahmed', 
      email: 'tania@example.com', 
      barId: 'BD-2019-442', 
      specialties: ['Corporate'], 
      submittedAt: '5 hours ago',
      idImage: 'https://images.unsplash.com/photo-1633424108868-b778747441dc?w=800&q=80'
    }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-50">Pending Verifications</h1>
          <p className="text-zinc-400 mt-1">Review and approve lawyer profiles to grant them access to the directory.</p>
        </div>

        <Card className="overflow-hidden border-zinc-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Applicant</th>
                  <th className="px-6 py-4 font-medium">Bar ID</th>
                  <th className="px-6 py-4 font-medium">Submitted</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                {pendingLawyers.map((lawyer) => (
                  <tr key={lawyer.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-50">{lawyer.name}</div>
                      <div className="text-zinc-500">{lawyer.email}</div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300 font-mono text-xs">
                      {lawyer.barId}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">
                      {lawyer.submittedAt}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="warning" className="gap-1.5"><ShieldAlert className="h-3 w-3" /> Pending Review</Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="secondary" onClick={() => setSelectedLawyer(lawyer)} className="gap-2">
                        <Eye className="h-4 w-4" /> Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      <Modal
        isOpen={!!selectedLawyer}
        onClose={() => setSelectedLawyer(null)}
        title="Review Verification Request"
        maxWidth="max-w-4xl"
        footer={
          <>
            <Button variant="danger" className="gap-2" onClick={() => setSelectedLawyer(null)}>
              <X className="h-4 w-4" /> Reject
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2" onClick={() => setSelectedLawyer(null)}>
              <Check className="h-4 w-4" /> Approve Lawyer
            </Button>
          </>
        }
      >
        {selectedLawyer && (
          <div className="flex flex-col md:flex-row gap-6">
            
            <div className="flex-1 space-y-4">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Claimed Details</h3>
              
              <div>
                <div className="text-xs text-zinc-500 mb-1">Full Name</div>
                <div className="font-medium text-zinc-50 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">{selectedLawyer.name}</div>
              </div>
              
              <div>
                <div className="text-xs text-zinc-500 mb-1">Bar Council ID</div>
                <div className="font-mono text-zinc-50 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">{selectedLawyer.barId}</div>
              </div>
              
              <div>
                <div className="text-xs text-zinc-500 mb-1">Specialties</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedLawyer.specialties.map(spec => (
                    <span key={spec} className="px-2 py-1 bg-zinc-800 rounded text-xs text-zinc-300">
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 border-l border-zinc-800 pl-6">
              <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">Uploaded Document</h3>
              <div className="rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video relative">
                <img src={selectedLawyer.idImage} alt="ID Card" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/10 hover:bg-transparent transition-colors flex items-center justify-center opacity-0 hover:opacity-100 cursor-zoom-in">
                  <Button variant="secondary" size="sm" className="gap-2 backdrop-blur-md">
                    <Eye className="h-4 w-4" /> Enlarge
                  </Button>
                </div>
              </div>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
}
