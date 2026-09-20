import React, { useState } from 'react';
import { Users, Mail, Plus, ShieldCheck, MoreVertical, Search } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';

export default function FirmTeamPage() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const team = [
    { id: '1', name: 'Adv. Sarah Rahman', email: 'sarah@firm.com', role: 'Senior Partner', status: 'active', verified: true },
    { id: '2', name: 'Adv. Kazi Hassan', email: 'kazi@firm.com', role: 'Associate', status: 'active', verified: true },
    { id: '3', name: 'Nusrat Jahan', email: 'nusrat@firm.com', role: 'Junior Associate', status: 'pending', verified: false }
  ];

  const handleInvite = () => {
    alert(`Invite sent to ${inviteEmail}`);
    setInviteModalOpen(false);
    setInviteEmail('');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-zinc-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-50">Team Management</h1>
            <p className="text-zinc-400 mt-1">Manage lawyers and staff in your firm.</p>
          </div>
          <Button onClick={() => setInviteModalOpen(true)} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> Invite Member
          </Button>
        </div>

        <Card className="overflow-hidden border-zinc-800">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <div className="w-full max-w-sm">
              <Input iconLeft={Search} placeholder="Search team members..." className="h-9" />
            </div>
            <div className="text-sm text-zinc-400 hidden sm:block">
              {team.length} Members
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-zinc-900">
                {team.map((member) => (
                  <tr key={member.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-medium">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-zinc-50 flex items-center gap-1.5">
                            {member.name}
                            {member.verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                          </div>
                          <div className="text-zinc-500">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-300">
                      {member.role}
                    </td>
                    <td className="px-6 py-4">
                      {member.status === 'active' ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">Invite Pending</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

      </div>

      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Invite Team Member"
        description="Send an invitation email to add a lawyer to your firm's roster."
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteModalOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail} className="gap-2">
              <Mail className="h-4 w-4" /> Send Invite
            </Button>
          </>
        }
      >
        <div className="py-4 space-y-4">
          <Input 
            label="Email Address"
            type="email"
            placeholder="lawyer@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <p className="text-xs text-zinc-500">
            The invited lawyer will receive a link to join your firm. They must complete the Bar Council verification process themselves.
          </p>
        </div>
      </Modal>

    </div>
  );
}
