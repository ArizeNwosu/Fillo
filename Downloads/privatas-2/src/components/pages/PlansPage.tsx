
import React from 'react';
import { OverlayPageWrapper } from '../ui/OverlayPageWrapper';

const PlanCard: React.FC<{ title: string; price: string; description: string; features: string[]; isFeatured?: boolean; }> = ({ title, price, description, features, isFeatured }) => (
    <div className={`border ${isFeatured ? 'border-[var(--accent)]' : 'border-[var(--surface-border)]'} rounded-lg p-6 flex flex-col`}>
        <h3 className="text-xl font-bold font-serif">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{description}</p>
        <p className="text-4xl font-bold my-6">{price}<span className="text-base font-normal text-[var(--text-secondary)]">/month</span></p>
        <ul className="space-y-3 text-sm mb-8">
            {features.map((f, i) => <li key={i} className="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{f}</li>)}
        </ul>
        <button className={`mt-auto w-full py-2 rounded-md font-semibold ${isFeatured ? 'bg-[var(--accent)] text-[var(--accent-text)]' : 'bg-[var(--surface-1)]'}`}>
            {isFeatured ? 'Get Started' : 'Choose Plan'}
        </button>
    </div>
);

export const PlansPage: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    return (
        <OverlayPageWrapper title="Plans and Pricing" onClose={onClose}>
            <div className="max-w-5xl mx-auto">
                <p className="text-center text-lg text-[var(--text-secondary)] mb-12">Choose the plan that's right for you.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <PlanCard title="Personal" price="$20" description="For individuals with essential needs." features={['All Standard Modules', 'Limited Custom Modules', 'Standard Support']} />
                    <PlanCard title="Professional" price="$50" description="For power users and professionals." features={['All Standard Modules', 'Unlimited Custom Modules', 'Priority Support', 'Advanced Analytics']} isFeatured />
                    <PlanCard title="White Glove AI" price="Contact Us" description="For individuals with bespoke AI needs." features={['Everything in Professional', 'Dedicated Account Manager', 'Dedicated AI Concierge', 'On-premise Options']} />
                </div>
            </div>
        </OverlayPageWrapper>
    );
};
