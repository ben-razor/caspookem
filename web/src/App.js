/* global BigInt */
import { useState, useEffect, useCallback, Fragment } from 'react';
import Logo from './images/near-karts-1.png';
import * as Tone from 'tone';
import './scss/styles.scss';
import { toast as toasty } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as nearAPI from 'near-api-js';
import BrButton from './js/components/lib/BrButton';
import { initNear } from './js/helpers/near';
import { localLog } from './js/helpers/helpers';
import getText from './data/text';
import bigInt from 'big-integer';
import Modal from 'react-modal';
import gameConfig from './data/world/config';
import Phaser from 'phaser';
import HelloWorldScene from './js/components/scenes/HelloWorldScene.ts';

const baseImageURL = 'https://storage.googleapis.com/birdfeed-01000101.appspot.com/strange-juice-1/';
const TOAST_TIMEOUT = 4000;
const NEAR_ENV='testnet';
const BOATLOAD_OF_GAS = '100000000000000';

const nearkartsAddress = 'nearkarts1.benrazor.testnet';
const nearContractConfig = {
  [nearkartsAddress]: {
    viewMethods: [
      'nft_tokens_for_owner', 'near_kart_get_config', 'nft_get_token_metadata', 
      'get_num_karts', 'get_token_id_by_index', 'get_last_battle'
    ],
    changeMethods: [
      'nft_mint', 'upgrade', 'game_simple_battle'
    ]
  }
}

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
  const [contract, setContract] = useState();
  const [wallet, setWallet] = useState();
  const [walletSignedIn, setWalletSignedIn] = useState(true);
  const [nftContract, setNFTContract] = useState();
  const [tokensLoaded, setTokensLoaded] = useState(true);
  const [nftList, setNFTList] = useState([]);
  const [nftData, setNFTData] = useState({});
  const [nftMetadata, setNFTMetadata] = useState({});
  const [activeTokenId, setActiveTokenId] = useState();
  const [activeKart, setActiveKart] = useState('');
  const [processingActions, setProcessingActions] = useState({});
  const [screen, setScreen] = useState(screens.GARAGE);

  function toast(message, type='info') {
    toasty[type](message, { 
      position: "top-right",
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

  const connect = useCallback(async() => {
    (async () => {
      localLog('connecting');
      try {
        let { currentUser, nearConfig, walletConnection, provider } = 
          await initNear(NEAR_ENV, '.benrazor.testnet');

        setContract(contract);
        localLog('wallet', walletConnection);
        setWallet(walletConnection);
      }
      catch(e) {
        doubleToast(getText('error_chain_unavailable'), getText('text_try_later'), 'error');
        console.log(e);
      }

    })();
  }, [contract]);

  useEffect(() => {
    var config = {
      type: Phaser.AUTO,
      parent: 'phaser-parent',
      pixelArt: true,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 200 },
        },
      },
      scene: [HelloWorldScene],
    };

    var game = new Phaser.Game(config);


  }, []);

  useEffect(() => {
    connect();
  }, [connect]);

  const connectNFT = useCallback(async (contractAddress) => {
    const { viewMethods, changeMethods } = nearContractConfig[contractAddress];
    const _nftContract = await new nearAPI.Contract(
      wallet.account(),
      contractAddress,
      {
        viewMethods, changeMethods, sender: wallet.getAccountId(),
      }
    );

    setNFTContract(_nftContract);
  }, [wallet]);

  useEffect(() => {
    if(wallet && wallet?.isSignedIn()) {
      connectNFT(nearkartsAddress);
    }
  }, [wallet, connectNFT]);


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
    let imageURL = cid;
    if(!cid.startsWith('http')) {
      imageURL = `https://storage.googleapis.com/near-karts/${cid}.png`; 
    }
    return imageURL;
  }

  const signIn = () => {
    if(wallet?.isSignedIn()) {
      (async () => {
        wallet.signOut();
        setNFTData({});
        setNFTList([]);
        setActiveTokenId(0);
        setWalletSignedIn(false);
      })();
    }
    else {
      const { changeMethods } = nearContractConfig[nearkartsAddress];

      wallet.requestSignIn(
        {contractId: nearkartsAddress, methodNames: changeMethods }, //contract requesting access
        'NEAR Karts', //optional name
        null, //optional URL to redirect to if the sign in was successful
        null //optional URL to redirect to if the sign in was NOT successful
      );
      setWallet(wallet);
    }
  };

  async function execute(action, data) {
    if(!processingActions[action]) {
      let _processingActions = {...processingActions };
      _processingActions[action] = true;
      setProcessingActions(_processingActions);
      let reloadTokens = false;

      let nearPenny = bigInt(10).pow(bigInt(22));
      let pointOneNear = nearPenny.times(bigInt(10));

      if(action === 'mintWithImage') {
        localLog('mwi', data);
        localLog('mwi', data.nftData);
        let name = data.name.slice(0, 32);

        if(!name) {
          doubleToast(getText('error_mint_kart'), getText('error_no_kart_name'), 'warning');
        }
        else {
          let tokenId = name.replace(/\s+/g, '') + Date.now().toString();

          try {
            await nftContract.nft_mint({
              token_id: tokenId,
              receiver_id: wallet.getAccountId(),
              name,
              near_kart_new: data.nftData,
              cid: data.cid,
              sig: data.sigHex,
              pub_key: data.pubKeyHex
            }, BOATLOAD_OF_GAS, pointOneNear.toString());

            reloadTokens = true;
          } catch(e) {
            toast(getText('error_mint_kart'), 'error');
          }
        }
      }
      if(action === 'upgrade') {
        localLog('upgrade', data);
        localLog('upgrade', data.nftData);

        if(data.nftData.locked) {
          toast(getText('error_upgrade_kart_locked', 'warning'));
        }
        else {
          let tokenId = activeTokenId;
          if(!tokenId) {
            doubleToast(getText('error_save_kart'), getText('error_no_active_kart'), 'error');
          }
          else {
            try {
              await nftContract.upgrade({
                token_id: tokenId,
                near_kart_new: data.nftData,
                cid: data.cid,
                sig: data.sigHex,
                pub_key: data.pubKeyHex
              }, BOATLOAD_OF_GAS, pointOneNear.toString());

              reloadTokens = true;
            } catch(e) {
              toast(getText('error_upgrade_kart'), 'error');
              localLog(e);
            }
          }
        }
      }
      else if(action === 'selectNFT') {
        setActiveTokenId(data);
      }

      if(reloadTokens) {
        let tokensForOwnerRes = await nftContract.nft_tokens_for_owner({ account_id: wallet.getAccountId()});
        setNFTList(tokensForOwnerRes);
      }

      delete _processingActions[action];
      setProcessingActions(_processingActions);

    }
  }

  useEffect(() => {
    if(nftContract && wallet && wallet.getAccountId()) {
      (async () => {
        let _nftList = await nftContract.nft_tokens_for_owner({ account_id: wallet.getAccountId()});
        if(_nftList.length && !activeTokenId) {
          setActiveTokenId(_nftList[0].token_id);
        }
        setNFTList(_nftList);
        setTokensLoaded(true);
      })();
    }
  }, [nftContract, wallet]);

  const selectNFT = useCallback(tokenId => {
    (async () => {
      for(let token of nftList) {
        if(token.token_id === tokenId) {
          let nftData = await nftContract.near_kart_get_config({ token_id: tokenId });
          setNFTData(nftData);
          let _tokenMetadata = await nftContract.nft_get_token_metadata({ token_id: tokenId});
          setNFTMetadata(_tokenMetadata);
          setActiveKart(token);
        }
      }
    })();
  }, [nftList, nftContract]);

  const newKart = useCallback((isInitializing) => {
    setActiveTokenId('new_kart');
    setNFTData({ ...gameConfig.baseNFTData });
  }, [setActiveTokenId, setNFTData]);

  useEffect(() => {
    if(nftList && tokensLoaded) {
      if(nftList.length === 0) {
        newKart(true);
      }
      else {
        let numKarts = nftList.length;
        setActiveTokenId(nftList[numKarts - 1].token_id);
        selectNFT(nftList[numKarts - 1].token_id);
      }
    }
  }, [nftList, tokensLoaded, newKart, selectNFT]);

  useEffect(() => {
    if(nftContract && wallet) {
      (async () => {
        try {
          let result = await nftContract.get_last_battle({ account_id: wallet.getAccountId()});

          let homeKart = await nftContract.near_kart_get_config({ token_id: result.home_token_id });
          let awayKart = await nftContract.near_kart_get_config({ token_id: result.away_token_id });

          let homeMetadata = await nftContract.nft_get_token_metadata({ token_id: result.home_token_id });
          let awayMetadata = await nftContract.nft_get_token_metadata({ token_id: result.away_token_id });

          result.karts = [homeKart, awayKart];
          result.metadata = [homeMetadata, awayMetadata];

        }
        catch(e) {
          console.log('Error loading last battle', e);
        }
      })();
    }
  }, [nftContract, wallet]);

  useEffect(() => {
    if(nftList.length) {
      localLog('ATID', activeTokenId);
      if(activeTokenId) {
        for(let nft of nftList) {
          if(nft.token_id === activeTokenId) {
            selectNFT(nft.token_id);
          }
        }
      }
      else {
        if(activeTokenId !== 'new_kart') {
          let numKarts = nftList.length;
          selectNFT(nftList[numKarts - 1].token_id);
        }
      }
    }
  }, [nftList, activeTokenId, selectNFT]);

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
        <BrButton label={wallet?.isSignedIn() ? getText('text_sign_out') : getText('text_sign_in') } id="signIn" className="br-button" onClick={signIn} />
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
                <BrButton label={wallet?.isSignedIn() ? "Sign out" : "Sign in"} id="signIn" className="br-button" onClick={signIn} />
              </Fragment>
              :
              ''
            } 
          </div>
        </div>
      </div>
      <div className="br-content">
        <div id="phaser-parent" className="phaser-parent"></div>
      </div>
    </div>
  );
}

export default App;
