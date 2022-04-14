const text_consts = {
  "app_name": "Caspookem",
  "nft_name": "Caspookie",
  "nft_short_name": "Caspookie",
  "blockchain_name": "Casper",
  "mint_price": "0.1 CSPR"
}

const text = {
  "en": {
    "text_header_info": `Header Info`,
    "text_intro_line_1": `Intro line 1`,
    "text_intro_line_2": `Intro line 2`,
    "text_intro_line_3": `Intro line 3`,
    "text_intro_line_4": `Intro line 4`,
    "text_intro_summary": `Intro summary text`,
    "text_modal_1_tab_1": `About`,
    "text_modal_2_tab_2": `Controls`,
    "text_header_button_2": `Modal 2`,
    "text_sign_in": `Sign In`,
    "text_kart_name_label": `Enter ${text_consts.nft_name} name...`,
    "text_battle_started": `Battle has commenced!!`,
    "text_no_battle": `No battle to watch`,
    "text_battle_loading": `Arena is being prepared for battle...`,
    "text_battle_arena": `Battle Arena`,
    "text_battle": `Battle`,
    "text_your_kart": `Your ${text_consts.nft_short_name}`,
    "text_opponent_kart": `Opponent ${text_consts.nft_short_name}`,
    "text_vs": `Vs`,
    "text_get_new_decals": `Get new decals by winning battles!`,
    "text_unlock_items": `Unlock items as you rise through the levels!`,
    "text_creating_image": `Photographing ${text_consts.nft_name} for NFT`,
    "text_mint_request": `Minting on ${text_consts.blockchain_name} blockchain`,
    "text_upgrade_request": `Upgrading on ${text_consts.blockchain_name} blockchain`,
    "text_finding_opponent": `Finding opponent on ${text_consts.blockchain_name} blockchain`,
    "text_locked": `${text_consts.nft_name} is locked for upgrades`,
    "text_next_upgrade": `Next upgrade at level {next_upgrade_level}`,
    "text_upgrade_save": `Upgrade and save your ${text_consts.nft_short_name} on ${text_consts.blockchain_name}`,
    "text_level": `Level`,
    "text_leaderboard_waiting": `Leaderboard is waiting for data`,
    "text_leaderboard_processing": `New battle results are added after a short processing time`,


    "text_help_welcome": `Virtuous ruler nCtl has protected the blockchain from harm for centuries`,
    "text_help_near_karts": `Now nCtl has been compromised by The CORS`,
    "text_help_garage": `The blockchain is being torn apart by sweet Irish melodies`,
    "text_help_only_caspookie": `Only a heroic ${text_consts.nft_name} can reach nCtl's mind and save the blockchain.`,
    "text_help_mint": `Mint it on the ${text_consts.blockchain_name} blockchain for ${text_consts.mint_price}`,
    "text_help_garage_title": `Garage`,
    "text_help_battle_title": `Battles`,
    "text_help_battle": `Each battle won increases your ${text_consts.nft_name} level by 1`,
    "text_help_level_up": `Unlock items as your level increases`,
    "text_help_upgrade": `You can upgrade and save your ${text_consts.nft_name} once every 5 levels`,
    "text_help_kart_name": `Will you be the chosen one?`,
    "text_help_no_equip_benefit": `Your equipment does not effect on the battle outcome`,
    "text_help_look_cool": `It just makes your ${text_consts.nft_name} look cool!`,
    "text_try_later": `Please try again later`,

    "text_alpha_warning": `${text_consts.app_name} is an alpha demo running on ${text_consts.blockchain_name} testnet`,
    "text_data_loss_warning": `${text_consts.nft_name} and data may be removed as the app is developed`,

    "text_high_score_saved": `High score saved on Casper!`,
    "text_tx_complete": `Transaction complete: {type}`,
    "text_mint_nft": `Mint ${text_consts.nft_name}`,

    "text_updating_blockchain": `${text_consts.blockchain_name} is working its magic`,
    "text_unknown_transaction": `Unknown transaction`,
    "text_adding_high_score": `Adding high score`,
    "text_minting": `Minting ${text_consts.nft_name}`,

    'text_sign_in_to_save': 'Sign in to save and view progress',
    'text_wallet_name': 'Casper Signer',
    'text_get_casper': 'Go get {casper_signer}',

    'text_door_possession': 'Only those that possess the {object} may pass',
    'text_door_mashup': 'Only those that mashed up {number} {lifeforms} may pass',
    'text_door_mint_caspookies': 'Only minted caspookies may pass. Mint you should!',
    'text_door_is_pleased': 'Door is pleased. You may pass.',

    'text_equip_pink_crystal': 'pink crystal',
    'text_equip_blue_crystal': 'blue crystal',
    'text_equip_orange_crystal': 'orange crystal',
    'text_lifeform_spiders': 'spiders',

    "success_save_kart": `${text_consts.nft_name} saved!!`,
    "success_image_upload": `${text_consts.nft_short_name} image uploaded`,

    "error_chain_unavailable": `${text_consts.blockchain_name} is currently unavailable`,
    "error_save_kart": `Error saving ${text_consts.nft_name}`,
    "error_no_active_kart": `No ${text_consts.nft_name} is active`,
    "error_check_console": "Check console for details",
    "error_mint_kart": `Error minting ${text_consts.nft_name}`,
    "error_upgrade_kart": `Error upgrading ${text_consts.nft_name}`,
    "error_starting_battle": `Error starting battle`,
    "error_no_opponent_selected": `Error no opponent selected`,
    "error_no_battle_self": `Error ${text_consts.nft_name} cannot battle self`,
    "error_no_kart_name": `No name supplied for ${text_consts.nft_name}`,
    "error_image_upload_failed": `Image upload failed`,
    "error_upgrade_kart_locked": `${text_consts.nft_name} is locked for upgrades`,
    "error_signature_verification_failed": `Signature verification of cid failed`,
    "error_pubkey_is_not_signer": `Pub Key is not a registered signer`,
    "error_mint_payment_too_low": `Minting requires an attached deposit of at least ${text_consts.mint_price}`,
    "error_upgrade_payment_too_low": `Upgrade requires an attached deposit of at least ${text_consts.upgrade_price}`,

    "error_casper_error": `Error connecting to Casper network`,
    "error_casper_no_signer": `Casper wallet not found.`,
    "error_casper_signer_no_account": `Please sign in to Casper network`,
    "error_tx_pending": `A transaction of this type is waiting for Casper network`
  }
};

const langs = ["en"];
let lang = langs[0];

Object.assign(text[lang], text_consts);

export default function getText(id, replacements) {
  let t = text[lang][id] || id;
  if(replacements) {
    for(let k of Object.keys(replacements)) {
      t = t.replaceAll(`{${k}}`, `${replacements[k]}`);
    }
  }
  return t;
}

export function exclamation(text) {
  return text + '!!';
}

export function ellipsis(text) {
  return text + '…';
}