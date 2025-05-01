import React, { Component } from 'react';



class FocusDisplay extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    renderFocus(focus, awaitingFocus, onFocusSelect) {
        if (awaitingFocus) {
            return (
                <div className="focus-container">
                    <div className="focus">Focus:</div>
                    <div className="action-item" onClick={() => onFocusSelect('magi')}>MAGI</div>
                    <div className="action-item" onClick={() => onFocusSelect('phys')}>PHYS</div>
                    <div className="action-item" onClick={() => onFocusSelect('tech')}>TECH</div>
                </div>
            )
        } else {
            return (
                <div className="focus-container">
                    <div className="focus">Focus:</div>
                    <div className={`${focus === 'magi' ? 'action-item-selected' : 'action-item'}`} onClick={() => onFocusSelect('magi')}>MAGI</div>
                    <div className={`${focus === 'phys' ? 'action-item-selected' : 'action-item'}`} onClick={() => onFocusSelect('phys')}>PHYS</div>
                    <div className={`${focus === 'tech' ? 'action-item-selected' : 'action-item'}`} onClick={() => onFocusSelect('tech')}>TECH</div>
                </div>
            )
        }
    }

    render() {
        const { focus, awaitingFocus, onFocusSelect, awaitingSacrifices, onSacrificeConfirmation } = this.props;

        if (awaitingSacrifices) {
            return (
                <div className="context-container">
                    <div className="action-item" onClick={() => onSacrificeConfirmation()}>CONSUME</div>
                    {this.renderFocus(focus, awaitingFocus, onFocusSelect)}
                </div>
            )
        }

        return (
            <div className="context-container">
                {this.renderFocus(focus, awaitingFocus, onFocusSelect)}
            </div>
        );
    }
}

export default FocusDisplay;