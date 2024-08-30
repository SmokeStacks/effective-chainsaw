import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
const daggerIcon = 'https://media.istockphoto.com/id/1271256046/vector/dagger-icon-isolated-on-white-vector-stock-illustration-eps-10.jpg?s=612x612&w=0&k=20&c=tlVxsjAH-GdwliaAZRgiBHUc9d1nRomrunXs8OLfqXo=';


class ConfirmButton extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        const { awaitingSacrifices, onSacrificeConfirmation } = this.props;

        if(awaitingSacrifices) {
            return (
                <div>
                    <div className="focus">
                        <Button className="action-button" onClick={onSacrificeConfirmation}>
                            DEVOUR
                        </Button>
                        <img className="stat-icon" src={daggerIcon} />
                    </div>
                </div>
            );
        }
        return (
            <div />
        )

    }
}

export default ConfirmButton;