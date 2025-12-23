import React from 'react';
import { useWorkspaceStore } from '../../stores/workspaceStore';
import { Icon } from '../ui/Icon';

export const BlogView: React.FC = () => {
  const { createFile } = useWorkspaceStore();

  const posts = [
      { title: 'Scaling React Apps', slug: 'scaling-react', date: 'Oct 24' },
      { title: 'Better CSS Architecture', slug: 'css-arch', date: 'Oct 20' },
      { title: 'Understanding IndexedDB', slug: 'indexed-db', date: 'Oct 15' },
  ];

  const addPlaybook = (slug: string) => {
      createFile('root', `PLAYBOOK_${slug}.md`);
      alert("Playbook added to workspace!");
  };

  return (
    <div className="p-4 flex flex-col h-full bg-ide-sidebar text-ide-text overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Icon name="Newspaper" className="text-orange-400" />
            Capy Blog
        </h2>
        
        <div className="space-y-4">
            {posts.map((p, i) => (
                <div key={i} className="flex flex-col gap-2 pb-4 border-b border-ide-activity last:border-0">
                    <h3 className="font-bold text-sm hover:text-ide-accent cursor-pointer">{p.title}</h3>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{p.date} • 5 min read</span>
                        <button 
                            onClick={() => addPlaybook(p.slug)}
                            className="text-ide-secondary hover:underline flex items-center gap-1"
                        >
                            <Icon name="PlusCircle" size={12} /> Add Playbook
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};