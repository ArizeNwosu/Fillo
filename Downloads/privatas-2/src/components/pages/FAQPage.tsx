
import React from 'react';
import { OverlayPageWrapper } from '../ui/OverlayPageWrapper';
import { faqs } from '../../constants/staticContent';

export const FAQPage: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    return (
        <OverlayPageWrapper title="Frequently Asked Questions" onClose={onClose}>
            <div className="max-w-3xl mx-auto">
                <div className="space-y-8">
                    {faqs.map((faq, index) => (
                        <div key={index} className="border-b border-[var(--surface-border)] pb-8 last:border-b-0 last:pb-0">
                            <h3 className="text-lg sm:text-xl font-bold font-serif mb-3">{faq.q}</h3>
                            <p className="text-base text-[var(--text-secondary)]">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </OverlayPageWrapper>
    );
};
