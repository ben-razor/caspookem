/* global BigInt */
import { useState, useEffect, useCallback, Fragment } from 'react';
import Logo from './images/caspervania-1.png';
import './scss/styles.scss';
import { toast as toasty } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BrButton from './js/components/lib/BrButton';
import { localLog, StateCheck } from './js/helpers/helpers';
import getText from './js/helpers/text';
import { hexColorToInt } from './js/helpers/3d';
import bigInt from 'big-integer';
import Modal from 'react-modal';
import gameConfig from './data/world/config';
import Phaser from 'phaser';
import Scene1 from './js/components/scenes/MainScene';
import PauseScene from './js/components/scenes/PauseScene';
import Game3D from './js/components/Game3D';
import { csprToMote, casperAttemptConnect, addHighScore, getHighScore, getDeploy,
         getAccountInfo, getAccountNamedKeyValue, getNFTsForAccount, mintNFT, mintCaspookie, getCaspookiesForAccount } from './js/helpers/casper';
import { getNFTName } from './js/helpers/casper';
import path from 'path';

let game;
let stateCheck = new StateCheck();

const PAYMENT_ADD_HIGH_SCORE = csprToMote(0.1);
const NETWORK_NAME = 'casper-test';
const CONTRACT_ACCOUNT = '01483e93cb89a114afb30a7bb08b1cb463ca73329bfd1ae4595c1cde5b0f08bd3a';

const baseImageURL = 'https://storage.googleapis.com/birdfeed-01000101.appspot.com/strange-juice-1/';
const casBucketURL = 'https://casper-game-1.storage.googleapis.com/';
const TOAST_TIMEOUT = 4000;

const MS_IN_DAY = 86400000;
const MS_IN_MONTH = MS_IN_DAY * 30;

const screens= {
  GARAGE: 1,
  BATTLE_SETUP: 2,
  BATTLE: 3
};

const highScoreModes = {
  DAILY: 1,
  MONTHLY: 2
}

const helpModes = {
  INTRO: 1,
  BATTLE: 2
}

function App() {
  const [ modalIsOpen, setModalIsOpen ] = useState(false);
  const [ modal2IsOpen, setModal2IsOpen ] = useState(false);
  const [ helpMode, setHelpMode] = useState(helpModes.INTRO);
  const [ headerInfoText, setHeaderInfoText ] = useState(getText('text_header_info'));
  const [wallet, setWallet] = useState();
  const [walletSignedIn, setWalletSignedIn] = useState(true);
  const [nftList, setNFTList] = useState([]);
  const [processingActions, setProcessingActions] = useState({});
  const [screen, setScreen] = useState(screens.Garage);
  const [selectedGame, setSelectedGame] = useState('game3D');
  const [highScore, setHighScore] = useState(0);
  const [pendingTx, setPendingTx] = useState([]);
  const [timerId, setTimerId] = useState(0);
  const [submittedTx, setSubmittedTx] = useState([]);
  const [txTimerId, setTxTimerId] = useState(0);
  const [activePublicKey, setActivePublicKey] = useState();
  const [activeCaspookieMetadata, setActiveCaspookieMetadata ] = useState('');
  const [activeCaspookieImage, setActiveCaspookieImage ] = useState('');

  function toast(message, type='info') {
    toasty[type](message, { 
      position: "top-left",
      autoClose: TOAST_TIMEOUT,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: 'dark'
    });
  }

  function doubleToast(message1, message2, type='info') {
    toast( <Fragment><div>{message1}</div><div>{message2}</div></Fragment>, type)
  }

  function onGameOver(data) {
    console.log(JSON.stringify(['game over', data, highScore]));
    if(data.score > highScore) {
      setHighScore(data.score);
    }
  }

  const doPendingTx = useCallback(() => {
    console.log(JSON.stringify(['doing', pendingTx]));
    for(let txInfo of pendingTx) {
      console.log(JSON.stringify(['doing pending tx', txInfo]));
      
      requestCasperTx(txInfo.type, txInfo.data);
    }
    setPendingTx([]);
  }, [pendingTx]);

  function ipfsToBucketURL(ipfsURL) {
    let bucketURL = ipfsURL.replace('ipfs://', casBucketURL);
    return bucketURL;
  }

  useEffect(() => {
    console.log(JSON.stringify(['apk changed', activePublicKey]));
    
    if(activePublicKey) {
      requestHighScore();
      (async () => {
        let caspookieNFTs = await getCaspookiesForAccount(activePublicKey);
        console.log(JSON.stringify([caspookieNFTs]));

        for(let cas of caspookieNFTs) {
          let meta = cas.metaMap;

          let bucketURL = ipfsToBucketURL(meta.token_uri);
          console.log(JSON.stringify(['fetching metadata from', bucketURL]));

          let r = await fetch(bucketURL);
          let j = await r.json();

          console.log(JSON.stringify(['Caspookie metadata:', j]));
          setActiveCaspookieMetadata(j);
          
        }

      })();
    }
  }, [activePublicKey]);

  useEffect(() => {
    if(activeCaspookieMetadata) {
      let bucketURL = ipfsToBucketURL(activeCaspookieMetadata.image);
      console.log(JSON.stringify(['loading image', bucketURL]));
      
      setActiveCaspookieImage(bucketURL)
    }
  }, [activeCaspookieMetadata]);
  
  useEffect(() => {
    if(stateCheck.changed('doPendingTx', pendingTx) || stateCheck.changed('apk1', activePublicKey)) {
      console.log(JSON.stringify(['cl int']));
      
      clearInterval(timerId);

      let _timerId = setInterval(async () => {
        try {
          let _activePublicKey = await window.casperlabsHelper.getActivePublicKey();

          if(_activePublicKey !== activePublicKey) {
            console.log(JSON.stringify(['Connected!']));
            doPendingTx();
            setActivePublicKey(_activePublicKey);
          }
        }
        catch(e) { 
          setActivePublicKey();
        }
      }, 500);

      setTimerId(_timerId);
    }
    return () => clearInterval(timerId);
  }, [pendingTx, doPendingTx, timerId, activePublicKey]);

  useEffect(() => {
    console.log(JSON.stringify(['cstx 1']));
    
    if(stateCheck.changed('checkSubmittedTx', submittedTx)) {
      
      console.log(JSON.stringify(['cstx 2']));
      clearInterval(txTimerId);

      let _txTimerId = setInterval(async () => {
        try {
          if(submittedTx.length) {
            let successful = [];
            let i = 0;
            for(let txInfo of submittedTx) {
              let res = await getDeploy(txInfo.data.deploy);
              console.log(JSON.stringify([res]));

              if(res.success) {
                if(txInfo.type === 'addHighScore') {
                  toast(getText('text_high_score_saved'));
                }
                else {
                  toast(getText('text_tx_complete', txInfo));
                }
                console.log(JSON.stringify(['deployed!']));
                successful.push(i++);
              }
            }

            for(let index of successful) {
              console.log(JSON.stringify(['Removing submitted...', submittedTx[index]]));
              submittedTx.splice(index, 1);
            }

            setSubmittedTx(submittedTx);
          }
        }
        catch(e) { 
          console.log(JSON.stringify(['getDeploy monitor error', e]));
        }
      }, 2000);

      setTxTimerId(_txTimerId);
    }
    return () => clearInterval(txTimerId);
  }, [submittedTx, txTimerId]);

  useEffect(() => {
    console.log(JSON.stringify(['stx', submittedTx]));
  }, [submittedTx]);

  async function requestHighScore() {
    requestCasperTx('getHighScore');
  }

  async function saveHighScore(score) {
    requestCasperTx('addHighScore', { score })
  }

  async function requestMint() {
    (async () => {
      console.log(JSON.stringify(['reqmint 1']));
      requestCasperTx('mintCaspookie')
    })();
  }

  async function requestCasperTx(type, data={}) {
    try {
      let res = await casperAttemptConnect();

      if(res.success) {
        if(type === 'mintCaspookie') {
          let txRes = await mintCaspookie(res.data.activePublicKey);

          if(txRes.success) {
            console.log(JSON.stringify(['deploy', txRes.data.deploy]));
            
            data.deploy = txRes.data.deploy;
            let _submittedTx = [...submittedTx, { type, data }]
            setSubmittedTx(_submittedTx);
          }
        }
        if(type === 'addHighScore') {
          let txRes = await addHighScore(data.score, res.data.activePublicKey, NETWORK_NAME, PAYMENT_ADD_HIGH_SCORE);
          if(txRes.success) {
            console.log(JSON.stringify(['deploy', txRes.data.deploy]));
            
            data.deploy = txRes.data.deploy;
            let _submittedTx = [...submittedTx, { type, data }]
            setSubmittedTx(_submittedTx);
          }
        }
        else if(type === 'getHighScore') {
          let hsRes = await getHighScore(res.data.activePublicKey);

          if(hsRes.success) {
            let savedHighScore = hsRes.data.highScore;
            setHighScore(savedHighScore);
          }
          else {
            console.log('High score read error: ', hsRes.reason, res.data.activePublicKey);
            setHighScore(0);
          }
        }
      }
      else {
        addPendingTx(type, data);
        console.log(res.reason);
        toast(getText(res.reason), 'info');
      }
    }
    catch(e) {
      console.log('Error', e);
      toast(getText('error_casper_error'), 'warning');
    }
  }

  function txExists(type, data, exclusive=true) {
    let existingTx = pendingTx.find(x => x.type === type && exclusive);
    return existingTx;
  }

  function txDelete(type, data, exclusive=true) {
    let existingTxIndex = pendingTx.findIndex(x => x.type === type && exclusive);
    if(existingTxIndex !== -1) {
      pendingTx.splice(existingTxIndex, 1);
    }
  }

  useEffect(() => {
    console.log(JSON.stringify(['ptx', pendingTx]));
    
  }, [pendingTx]);

  function addPendingTx(type, data, exclusive=true) {
    console.log(JSON.stringify(['adding', type]));
    
    if(!txExists(type, data)) {
      let _pendingTx = [...pendingTx, { type, data }];
      setPendingTx(_pendingTx);
      console.log(JSON.stringify(['added', _pendingTx]));
    }
  }

  useEffect(() => {
    if(selectedGame !== 'phaser2D') {
      return;
    }
    Scene1.setGameOver(onGameOver);

    var config = {
      type: Phaser.AUTO,
      backgroundColor:0x888888,
      parent: 'phaser-parent',
      pixelArt: true,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          debug: true,
          gravity: { y: 200 },
        },
      },
      fps: {
        target: 20,
        forceSetTimeOut: true
      },
      scene: [Scene1, PauseScene],
    };

    game = new Phaser.Game(config);

  }, []);

  useEffect(() => {
    (async () => {
      let accountInfo = await getAccountInfo(CONTRACT_ACCOUNT);
      console.log(JSON.stringify(['cont', accountInfo]));
      let hash = await getAccountNamedKeyValue(accountInfo, 'pra1_contract_contract_hash')
      console.log(JSON.stringify(['cont hash', hash]));
      let nftName = await getNFTName();
      console.log(JSON.stringify(['nft name', nftName]));
    })();
  }, []);

  function getTextureURL(element, style) {
    if(!style) style = 0;
    let url = baseImageURL + `set-1-${element}-${style}.png`;
    return url;
  }

  function getIconURL(element, style='1') {
    let url = baseImageURL + `icons-1-${element}-${style}.png`;
    return url;
  }

  function getImageURL(cid) {
    if(!cid) {
      return '';
    }

    let imageURL = cid;
    if(!cid.startsWith('http')) {
      imageURL = `https://storage.googleapis.com/near-karts/${cid}.png`; 
    }
    return imageURL;
  }

  function getIntroPanel() {
    let ui = <div className="br-intro-panel">
      <div className="br-intro">
        <div className="br-intro-section">
          { getText('text_intro_line_1') }
        </div>
        <div className="br-intro-section">
          { getText('text_intro_line_2') }
        </div>
        <div className="br-intro-section">
          { getText('text_intro_line_3') }
        </div>
        <div className="br-intro-section">
          { getText('text_intro_line_4') }
        </div>
      </div>
      <Fragment>
        <BrButton label={wallet?.isSignedIn() ? getText('text_sign_out') : getText('text_sign_in') } id="signIn" className="br-button" onClick={()=>{}} />
      </Fragment>
      <div className="br-front-screen-image"></div>
      <div className="br-intro-section">
        { getText('text_intro_summary') }
      </div>
    </div>

    return ui;
  }

  function getHelpText() {
    let ui;

    let tab1ActiveClass = helpMode === helpModes.INTRO ? ' br-pill-active ' : '';
    let tab2ActiveClass = helpMode === helpModes.BATTLE ? ' br-pill-active ' : '';

    ui = <Fragment>
      <div className="br-help-controls">
        <div className="br-pills">
          <div className={ "br-pill br-pill-border br-pill-left br-pill-left-border" + tab1ActiveClass } onClick={ e => setHelpMode(helpModes.INTRO) }>
            { getText("text_modal_1_tab_1") }
          </div>
          <div className={ "br-pill br-pill-border br-pill-right br-pill-right-border" + tab2ActiveClass } onClick={ e => setHelpMode(helpModes.BATTLE)}>
            { getText("text_modal_2_tab_2") }
          </div>
        </div> 
      </div>
      { helpMode === helpModes.INTRO ?
        <div className="br-help-panel">
          <div className="br-help-line">{ getText('text_help_welcome') }</div>
          <div className="br-help-line">{ getText('text_help_near_karts') }</div>
          <div className="br-help-line">{ getText('text_help_garage') }</div>
          <div className="br-help-line">{ getText('text_help_mint') }</div>
          <div className="br-help-highlight">{ getText('text_help_kart_name') }</div>
          <div className="br-info-message br-info-message-start br-space-top br-full-width br-info-message-warning">
            <i className="fa fa-info br-info-icon"></i>
            {getText('text_alpha_warning')}
            <br />
            {getText('text_data_loss_warning')}
          </div>
        </div>
        :
        <div className="br-help-panel">
          <div className="br-help-line">{ getText('text_help_battle') }</div>
          <div className="br-help-line">{ getText('text_help_level_up') }</div>
          <div className="br-help-highlight">{ getText('text_help_upgrade') }</div>
          <div className="br-info-message br-info-message-start br-space-top br-full-width">
            <i className="fa fa-info br-info-icon"></i>
            {getText('text_help_no_equip_benefit')}
            <br />
            {getText('text_help_look_cool')}
          </div>
        </div>
      }
    </Fragment>            

    return ui;
  }

  function doHeaderAction() {
    console.log(JSON.stringify(['doing header action']));
  }

  function getHeaderInfoUI() {
    let ui;

    if(headerInfoText) {
      ui = <div className="br-last-battle-panel">
        <div className="br-last-battle-details">
          {headerInfoText}
        </div>
        <BrButton label="Header Action" id="headerAction" className="br-button" 
                  onClick={ e => doHeaderAction() }
                  isSubmitting={processingActions['headerAction']} />
      </div>
    }

    return ui;
  }

  const customStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      borderRadius: '8px 8px 0 0',
      padding: 0
    },
    overlay: {zIndex: 999}
  };

  function openModal(index=0) {
    closeModal();
    closeModal(2);

    if(index === 2) {
      setModal2IsOpen(true);
    }
    else {
      setModalIsOpen(true);
    }
  }

  function afterOpenModal() {

  }

  function closeModal(index=0) {
    if(index === 2) {
      setModal2IsOpen(false);
    }
    else { 
      setModalIsOpen(false);
    }
  }

  function showModal(index=0) {
    openModal(index);
  }

  localLog('nftList', nftList);

  let isSignedIn = wallet?.isSignedIn() && walletSignedIn;  // NEAR sign out doesn't have await so need this trick with walletSignedIn 

  return (
    <div className="br-page">
      <div>
        <Modal
          isOpen={modalIsOpen}
          onAfterOpen={afterOpenModal}
          onRequestClose={closeModal}
          style={customStyles}
          contentLabel="NEAR Karts"
        >
          <div className="br-modal-title">
            <h2 className="br-modal-heading">NEAR Karts</h2>
            <div className="br-modal-close">
              <BrButton label={<i className="fas fa-times-circle" />} className="br-button br-icon-button" 
                          onClick={closeModal} />
            </div>
          </div>
          <div className="br-modal-panel">
            <div className="br-modal-content">
              { getHelpText('introduction') } 
            </div>
          </div>
        </Modal>
      </div>
      <div>
        <Modal
          isOpen={modal2IsOpen}
          onRequestClose={e => closeModal(2)}
          style={customStyles}
          contentLabel="NEAR Karts Leaderboard"
          appElement={document.getElementById('root')}
        >
          <div className="br-modal-title">
            <h2 className="br-modal-heading">Modal 2 Title</h2>
            <div className="br-modal-close">
              <BrButton label={<i className="fas fa-times-circle" />} className="br-button br-icon-button" 
                          onClick={e => closeModal(2)} />
            </div>
          </div>
          <div className="br-modal-panel">
            <div className="br-modal-content">
              Modal 2 content
            </div>
          </div>
        </Modal>
      </div>
      <div className="br-header">
        <div className="br-header-logo-panel">
          { getHeaderInfoUI() }
        </div>
        <div className="br-header-title-panel">
          <img className="br-header-logo" alt="Ben Razor Head" src={Logo} />
        </div>
        <div className="br-header-controls-panel">
          <div className="br-header-controls">
            { screen === screens.GARAGE ?
              <button className="br-button br-icon-button"
                      onMouseDown={showModal}><i className="fa fa-info"></i></button>
              :
              ''
            }
            <Fragment>
              <BrButton label={ getText("text_header_button_2") } id="showHighScoresButton" className="br-button" onClick={e => showModal(2)} />
            </Fragment>
            { isSignedIn ?
              <Fragment>
                <BrButton label={wallet?.isSignedIn() ? "Sign out" : "Sign in"} id="signIn" className="br-button" onClick={()=>{}} />
              </Fragment>
              :
              ''
            } 
          </div>
        </div>
      </div>
      <div className="br-content">
        <div className="br-game-container">
          <div className="br-score-bar">
            {
              activeCaspookieImage ?
                <div className="br-caspookie-image-container">
                  <img className="br-caspookie-image" alt="Active caspookie" src={activeCaspookieImage} />
                </div>
                :
                ''
            }
            <div className="br-deed" id="deed-msg" style={ { display: 'none'}}>You Deed</div>
            <div className="br-score" id="score">0</div>
            <div className="br-high-score">High Score: <span id="high-score">{highScore}</span></div>
            <button className="br-score-control" onClick={() => saveHighScore(highScore)}>Save Score</button>
            <button className="br-score-control" onClick={requestHighScore}>Get Score</button>
            <button className="br-score-control" onClick={requestMint}>Mint</button>
          </div>
          { selectedGame === 'platformer2D' ?
            <div id="phaser-parent" className="phaser-parent">
            </div>
            :
            <Game3D processingActions={processingActions} toast={toast} 
            screens={screens} screen={screen} setScreen={setScreen} 
            showModal={showModal}
            getTextureURL={getTextureURL} getIconURL={getIconURL} 
            getImageURL={getImageURL} 
            nftList={nftList} />
          }
        </div>
      </div>
    </div>
  );
}

export default App;
