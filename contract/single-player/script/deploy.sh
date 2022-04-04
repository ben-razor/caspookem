#!/usr/bin/env bash
casper-client put-deploy \
    --node-address http://162.55.6.177:7777/rpc \
    --chain-name casper-test \
    --secret-key ~/.casper/test1/secret_key.pem \
    --payment-amount 50000000000 \
    --session-path ../target/wasm32-unknown-unknown/release/highscore.wasm