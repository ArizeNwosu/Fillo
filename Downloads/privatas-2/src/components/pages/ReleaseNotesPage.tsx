
import React from 'react';
import { OverlayPageWrapper } from '../ui/OverlayPageWrapper';
import { ReleaseNotesContent } from '../../constants/staticContent';

export const ReleaseNotesPage: React.FC<{ onClose: () => void; }> = ({ onClose }) => {
    return (
        <OverlayPageWrapper title="Release Notes" onClose={onClose}>
            <ReleaseNotesContent />
        </OverlayPageWrapper>
    );
};
