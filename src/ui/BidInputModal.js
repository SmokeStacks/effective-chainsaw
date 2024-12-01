// BidInputModal.js
import React, { useState } from 'react';

function BidInputModal({ maxBid, decisionCallback, closeModal }) {
    const [bidInput, setBidInput] = useState('');

    const handleChange = (e) => {
        const value = e.target.value;
        console.log('Input changed to:', value);
        if (value === '') {
            setBidInput('');
            return;
        }
        const numericValue = parseInt(value, 10);
        if (!isNaN(numericValue)) {
            const clampedValue = Math.max(0, Math.min(numericValue, maxBid));
            setBidInput(clampedValue);
        }
    };

    const handleSubmit = () => {
        const finalBid = bidInput === '' ? 0 : bidInput;
        console.log('Submitting bid:', finalBid);
        decisionCallback(finalBid);
        closeModal();
    };

    return (
        <div>
            <input
                type='number'
                min='0'
                max={maxBid}
                value={bidInput}
                onChange={handleChange}
            />
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
}

export default BidInputModal;
