import React from 'react';

let modalVisible = false;
let modalProps = {};

export const showModal = (props) => {
  modalVisible = true;
  modalProps = props;
};

export const setModalVisible = (visible) => {
  modalVisible = visible;
};

export const isModalVisible = () => modalVisible;

export const getModalProps = () => modalProps;

export const hideModal = () => {
  modalVisible = false;
  modalProps = {};
};

const Modal = ({ isVisible, onClose, children, title }) => {
  if (!isVisible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {title && <h2>{title}</h2>}
        {children}
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Modal;
