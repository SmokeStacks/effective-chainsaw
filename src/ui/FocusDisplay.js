import React, { Component } from 'react';
const questIcon = 'https://cdn-icons-png.flaticon.com/512/1299/1299456.png';
const raidIcon = 'https://t4.ftcdn.net/jpg/04/65/06/67/360_F_465066712_3UrkO1MQ1jMyrmgE0VdDn8Qfi95aKvAE.jpg';
const hackIcon = 'https://static.vecteezy.com/system/resources/thumbnails/000/569/420/small/vector60-3894-01.jpg';


class FocusDisplay extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        const { focus } = this.props;

        return (
            <div>
                <div className="focus">
                        <div className="stat">Focus:</div>
                        <img className="stat-icon" src={questIcon}/>
                    </div>
                </div>
        );
    }
}

export default FocusDisplay;