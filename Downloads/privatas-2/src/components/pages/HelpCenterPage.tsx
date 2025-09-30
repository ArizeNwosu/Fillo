
import React, { useState } from 'react';
import { OverlayPageWrapper } from '../ui/OverlayPageWrapper';
import { helpArticles } from '../../constants/staticContent';

export const HelpCenterPage: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArticleId, setSelectedArticleId] = useState(helpArticles[0].id);

    const filteredArticles = helpArticles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const selectedArticle = helpArticles.find(a => a.id === selectedArticleId);

    return (
        <OverlayPageWrapper title="Help Center" onClose={onClose}>
            <div className="flex flex-col md:flex-row gap-8 h-full">
                {/* Left Sidebar */}
                <aside className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                    <input
                        type="search"
                        placeholder="Search topics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[var(--surface-1)] p-2 rounded-md border-2 border-[var(--surface-border)] focus:outline-none focus:border-[var(--accent)] text-sm mb-4"
                    />
                    <nav className="flex flex-col gap-1">
                        {filteredArticles.map(article => (
                            <button
                                key={article.id}
                                onClick={() => setSelectedArticleId(article.id)}
                                className={`w-full text-left p-2 rounded-md text-sm transition-colors ${selectedArticleId === article.id ? 'bg-[var(--accent)] text-[var(--accent-text)] font-semibold' : 'hover:bg-[var(--surface-1)]'}`}
                            >
                                {article.title}
                            </button>
                        ))}
                         {filteredArticles.length === 0 && (
                            <p className="text-sm text-center text-[var(--text-secondary)] p-4">No articles found.</p>
                         )}
                    </nav>
                </aside>
                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {selectedArticle ? (
                        <article className="prose prose-invert max-w-none">
                            <h2 className="!text-2xl !font-serif !font-bold !mb-4">{selectedArticle.title}</h2>
                            <div dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />
                        </article>
                    ) : (
                        <p>Select an article to read.</p>
                    )}
                </main>
            </div>
        </OverlayPageWrapper>
    );
};
