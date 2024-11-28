import React, { Component } from 'react';
import { Button } from 'react-bootstrap';

import dnaIcon from '../images/repeat.png'

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
        const { bits,
            actions,
            ashes,
            fate,
            overload,
            burden,
            wounds,
            focus,
            surge,
            enemyWounds,
            enemyBits,
            enemyOverload,
            enemyActions,
            enemyFate,
            enemyBurden,
            enemyAshes,
            enemySurge,
            enemyHand, 
        } = this.props;

        return (
            <div>
                <div className="health-container">
                    <div className="burden-container box">
                        <img
                            className="gif"
                            src="https://i.pinimg.com/originals/9c/34/81/9c34814674ef579972ca3816f5595021.gif"
                            alt="Burden"
                        />
                        <p>BURDEN: {burden}</p>
                    </div>
                    <div className="wounds-container box">
                        <img
                            className="gif"
                            src="https://media1.giphy.com/media/qtNGa95cbq29EGi3ib/200w.gif?cid=6c09b9528l5irpzx4g6eswiubppxlf8hqzl0wjmdznq316y5&ep=v1_gifs_search&rid=200w.gif&ct=g"
                            alt="Wounds"
                        />
                        <p>WOUNDS: {wounds}</p>
                    </div>
                    <div className="overload-container box">
                        <img
                            className="gif"
                            src="https://cdnb.artstation.com/p/assets/images/images/032/317/467/original/aleksandar-r-solaris-ui.gif?1606101727"
                            alt="Wounds"
                        />
                        <p>OVERLOAD: {overload}</p>
                    </div>
                </div>
                <div className="status-container box">
                    <p>FATE: {fate}</p>
                    <p>BITS: {bits}</p>
                    <p>ASH: {ashes}</p>
                    <p>SURGE: {surge}</p>
                    <p>ACTIONS: {actions}</p>
                </div>
                <div className="status-container hostile-menu box">
                    <p>HOSTILE</p>
                    <p>WOUNDS: {enemyWounds}</p>
                    <p>BURDEN: {enemyBurden}</p>
                    <p>OVERLOAD: {enemyOverload}</p>
                    <p>FATE: {enemyFate}</p>
                    <p>BITS: {enemyBits}</p>
                    <p>ASH: {enemyAshes}</p>
                    <p>SURGE: {enemySurge}</p>
                    <p>ACTIONS: {enemyActions}</p>
                    <p>HEADSPACE: {enemyHand.length}</p>
                </div>
            </div>
        );
    }
}

export default HUD;