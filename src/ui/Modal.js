import React, { Component } from 'react';

class Modal extends Component {
  render() {
      const { title, message, renderContent, onConfirm, onCancel } = this.props;

      return (
          <div className="modal-overlay">
            <div className="modal">
              <h2>{title}</h2>
              <p>{message}</p>
              {renderContent && renderContent({ closeModal: onCancel })}
              <div className="modal-buttons">
                <div onClick={onConfirm}>Confirm</div>
                <div onClick={onCancel}>Cancel</div>
              </div>
            </div>
          </div>
        );
  }
}

export default Modal;