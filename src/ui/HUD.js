import React, { Component } from 'react';
import { Button } from 'react-bootstrap';

import dnaIcon from '../images/dna.png'

const goldIcon = "https://www.symbols.com/images/symbol/719_gold.png";
const fateIcon = "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/77bf3ba9-0aac-4452-be82-de536b5aab32/df20ljo-609a3e25-fb40-47fb-8d63-a678e01a99a1.png/v1/fill/w_894,h_894/ex_ruby_sapphire_set_symbol_by_biochao_df20ljo-pre.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9MTI4MCIsInBhdGgiOiJcL2ZcLzc3YmYzYmE5LTBhYWMtNDQ1Mi1iZTgyLWRlNTM2YjVhYWIzMlwvZGYyMGxqby02MDlhM2UyNS1mYjQwLTQ3ZmItOGQ2My1hNjc4ZTAxYTk5YTEucG5nIiwid2lkdGgiOiI8PTEyODAifV1dLCJhdWQiOlsidXJuOnNlcnZpY2U6aW1hZ2Uub3BlcmF0aW9ucyJdfQ.Nnnj_6_zeqS8khRjO0Xh4XZYNWYn0FjdQKEKVA25ehA";
const burdenIcon = "https://s3.amazonaws.com/freestock-prod/450/freestock_573278191.jpg";
const woundIcon = 'https://static.vecteezy.com/system/resources/previews/014/717/403/original/wound-icon-free-vector.jpg'
const wishIcon = 'https://cdn.pixabay.com/photo/2016/12/18/11/02/star-1915449_1280.png';
const debtIcon = 'https://cdn-icons-png.flaticon.com/512/77/77309.png';
const actionIcon = "https://cdn-icons-png.flaticon.com/512/3898/3898664.png"
const eyeIcon = "https://static.vecteezy.com/system/resources/previews/000/637/727/original/vector-eye-icon-symbol-sign.jpg"


class HUD extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    render() {
        const { bits, ashes, fate, burden, wounds, debt, wishes, focus } = this.props;

        return (
            <div className="hud-list">
                <div className="huds">
                    <div className="stat"><img className="stat-icon" src={fateIcon} /><div>{`Fate: ${ashes}`}</div></div>
                    <div className="stat"><img className="dna-icon" src={dnaIcon} /><div>{`Ashes: ${ashes}`}</div></div>
                    <div className="stat"><img className="stat-icon" src={goldIcon} /><div>{`Bits: ${bits}`}</div></div>


                </div>
                <div className="huds">
                    <div className="stat"><img className="stat-icon" src={burdenIcon} /><div>{`Burden: ${ashes}`}</div></div>
                    <div className="stat"><img className="big-icon-invert" src={woundIcon} /><div>{`Wounds: ${wounds}`}</div></div>
                    <div className="stat"><img className="big-icon-invert" src={debtIcon} /><div>{`Debt: ${debt}`}</div></div>
                </div>
                <div className="huds">
                    <div className="stat"><img className="big-icon-invert" src={wishIcon} /><div>{`Wishes: ${ashes}`}</div></div>
                    <div className="stat"><img className="big-icon-invert" src={actionIcon} /><div>{`Actions: ${ashes}`}</div></div>
                    <div className="stat"><img className="stat-icon" src={eyeIcon} /><div>{`Surge: ${ashes}`}</div></div>
                </div>
            </div>
        );
    }
}

export default HUD;