import React, { Component } from 'react';

class Modal extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        const { title, message, onConfirm, onCancel } = this.props;

        return (
            <div className="modal-overlay">
              <div className="modal">
                <h2>{title}</h2>
                <p>{message}</p>
                <div className="modal-buttons">
                  <button onClick={onConfirm}>Confirm</button>
                  <button onClick={onCancel}>Cancel</button>
                </div>
              </div>
            </div>
          );
    }
}

export default Modal;