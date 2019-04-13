#!/bin/sh
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#
export PATH=$GOPATH/src/github.com/hyperledger/fabric/build/bin:${PWD}/../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}
CHANNEL_NAME=primarychannel

rm -rf config

mkdir config

# remove previous crypto material and config transactions
rm -fr config/*
rm -fr crypto-config/*

# generate crypto material
cryptogen generate --config=./crypto-config.yaml
if [ "$?" -ne 0 ]; then
  echo "Failed to generate crypto material..."
  exit 1
fi



# generate genesis block for orderer
configtxgen -profile NewputOrdererGenesis -outputBlock ./config/genesis.block
if [ "$?" -ne 0 ]; then
  echo "Failed to generate orderer genesis block..."
  exit 1
fi

# generate channel configuration transaction
configtxgen -profile NewputChannel -outputCreateChannelTx ./config/channel.tx -channelID $CHANNEL_NAME
if [ "$?" -ne 0 ]; then
  echo "Failed to generate channel configuration transaction..."
  exit 1
fi

# generate anchor peer transaction
configtxgen -profile NewputChannel -outputAnchorPeersUpdate ./config/NewputMSPanchors.tx -channelID $CHANNEL_NAME -asOrg NewputMSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for NewputMSP..."
  exit 1
fi

configtxgen -profile NewputChannel -outputAnchorPeersUpdate ./config/SentientMSPanchors.tx -channelID $CHANNEL_NAME -asOrg SentientMSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for NewputMSP..."
  exit 1
fi

configtxgen -profile NewputChannel -outputAnchorPeersUpdate ./config/CapitalCityMSPanchors.tx -channelID $CHANNEL_NAME -asOrg CapitalCityMSP
if [ "$?" -ne 0 ]; then
  echo "Failed to generate anchor peer update for NewputMSP..."
  exit 1
fi
