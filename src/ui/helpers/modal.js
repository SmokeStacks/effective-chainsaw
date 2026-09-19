import { state, stateSetters } from './state';

// These used to be destructured from `state` / `stateSetters` at module load.
// The setters are still null at that point, so showModal threw immediately and
// isModalVisible() always reported the frozen `false`. Read both at call time.

export function showModal({ title, message, renderContent, onConfirm, onCancel }) {
    stateSetters.setModalProps({
        title,
        message,
        renderContent,
        onConfirm: () => {
            // Call the user's onConfirm callback before closing
            if (onConfirm && typeof onConfirm === 'function') {
                onConfirm();
            }
            hideModal();
        },
        onCancel: () => {
            // Call the user's onCancel callback before closing
            if (onCancel && typeof onCancel === 'function') {
                onCancel();
            }
            hideModal();
        },
    });

    stateSetters.setModalVisible(true);
}

export function hideModal() {
    stateSetters.setModalVisible(false);
    stateSetters.setModalProps({});
}

export function isModalVisible() {
    return state.modalVisible;
}

export function getModalProps() {
    return state.modalProps;
}
