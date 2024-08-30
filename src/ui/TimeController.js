import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
const questIcon = 'https://cdn-icons-png.flaticon.com/512/1299/1299456.png';
const raidIcon = 'https://t4.ftcdn.net/jpg/04/65/06/67/360_F_465066712_3UrkO1MQ1jMyrmgE0VdDn8Qfi95aKvAE.jpg';
const hackIcon = 'https://static.vecteezy.com/system/resources/thumbnails/000/569/420/small/vector60-3894-01.jpg';

const daggerIcon = 'https://media.istockphoto.com/id/1271256046/vector/dagger-icon-isolated-on-white-vector-stock-illustration-eps-10.jpg?s=612x612&w=0&k=20&c=tlVxsjAH-GdwliaAZRgiBHUc9d1nRomrunXs8OLfqXo=';



class TimeController extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        const { onPlayerTurn, onEnemyTurn, gameState } = this.props;

            return (
                <div className="time-controller">
                    <div className="focus">
                        <Button className="action-button" onClick={onEnemyTurn}>
                            Enemy Turn
                        </Button>
                        <img className="stat-icon" src={daggerIcon} />
                    </div>
                    <div className="focus">
                        <Button className="action-button" onClick={onPlayerTurn}>
                            Player Turn
                        </Button>
                        <img className="stat-icon" src={daggerIcon} />
                    </div>
                    {gameState}
                </div>
            );
    }
}

export default TimeController;