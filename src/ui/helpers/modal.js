import { gameState, setters } from './state';

const {
    modalVisible = false,
    modalProps = {},
} = gameState;

const {
    setModalVisible,
    setModalProps,
} = setters;

export function showModal({ title, message, renderContent, onConfirm, onCancel }) {
    setModalProps({
        title,
        message,
        renderContent,
        onConfirm: () => {
            // Call the user's onConfirm callback before closing
            if (onConfirm && typeof onConfirm === 'function') {
                onConfirm();
            }
            setModalVisible(false);
        },
        onCancel: () => {
            // Call the user's onCancel callback before closing
            if (onCancel && typeof onCancel === 'function') {
                onCancel();
            }
            setModalVisible(false);
        },
    });

    setModalVisible(true);
}

export function hideModal() {
    setModalVisible(false);
    setModalProps({});
}

export function isModalVisible() {
    return modalVisible;
}

export function getModalProps() {
    return modalProps;
}
