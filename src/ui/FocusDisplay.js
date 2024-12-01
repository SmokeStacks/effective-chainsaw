import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
const questIcon = 'https://cdn-icons-png.flaticon.com/512/1299/1299456.png';
const raidIcon = 'https://t4.ftcdn.net/jpg/04/65/06/67/360_F_465066712_3UrkO1MQ1jMyrmgE0VdDn8Qfi95aKvAE.jpg';
const hackIcon = 'https://static.vecteezy.com/system/resources/thumbnails/000/569/420/small/vector60-3894-01.jpg';

const daggerIcon = 'https://media.istockphoto.com/id/1271256046/vector/dagger-icon-isolated-on-white-vector-stock-illustration-eps-10.jpg?s=612x612&w=0&k=20&c=tlVxsjAH-GdwliaAZRgiBHUc9d1nRomrunXs8OLfqXo=';



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
                    <div className={`${focus === 'magi' ? 'action-item-selected' : 'action-item'}`}>MAGI</div>
                    <div className={`${focus === 'phys' ? 'action-item-selected' : 'action-item'}`}>PHYS</div>
                    <div className={`${focus === 'tech' ? 'action-item-selected' : 'action-item'}`}>TECH</div>
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