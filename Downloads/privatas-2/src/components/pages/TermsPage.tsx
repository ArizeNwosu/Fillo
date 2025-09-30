
import React, { useRef } from 'react';
import { OverlayPageWrapper } from '../ui/OverlayPageWrapper';
import { TermsContent } from '../../constants/staticContent';

export const TermsPage: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    const privacyPolicyRef = useRef<HTMLHeadingElement>(null);

    const handleScrollToPrivacy = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        privacyPolicyRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <OverlayPageWrapper title="Terms & Policies" onClose={onClose}>
            <TermsContent privacyPolicyRef={privacyPolicyRef} onScrollToPrivacy={handleScrollToPrivacy} />
        </OverlayPageWrapper>
    );
};
