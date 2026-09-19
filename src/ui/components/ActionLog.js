import React, { useEffect, useRef } from 'react';

// Newest entry at the bottom, auto-scrolled into view.
const ActionLog = ({ entries = [] }) => {
    const endRef = useRef(null);

    useEffect(() => {
        if (endRef.current && endRef.current.scrollIntoView) {
            endRef.current.scrollIntoView({ block: 'nearest' });
        }
    }, [entries.length]);

    return (
        <div className="action-log">
            <div className="action-log-title">LOG</div>
            <div className="action-log-entries">
                {entries.length === 0 && (
                    <div className="action-log-empty">No actions yet.</div>
                )}
                {entries.map(entry => (
                    <div
                        key={entry.id}
                        className={`action-log-entry action-log-${(entry.side || 'system').toLowerCase()}`}
                    >
                        {entry.text}
                    </div>
                ))}
                <div ref={endRef} />
            </div>
        </div>
    );
};

export default ActionLog;
