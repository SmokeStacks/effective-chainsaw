import React, { useState } from 'react';
import Modal from './Modal';

export const BidInputModal = ({ isVisible, onClose, onSubmit, maxBid }) => {
  const [bidAmount, setBidAmount] = useState(0);

  const handleSubmit = () => {
    if (bidAmount <= maxBid) {
      onSubmit(bidAmount);
      onClose();
    }
  };

  return (
    <Modal isVisible={isVisible} onClose={onClose} title="Place Your Bid">
      <div className="bid-input">
        <input
          type="number"
          value={bidAmount}
          onChange={(e) => setBidAmount(parseInt(e.target.value))}
          min={0}
          max={maxBid}
        />
        <button onClick={handleSubmit}>Submit Bid</button>
      </div>
    </Modal>
  );
};

export default BidInputModal;
